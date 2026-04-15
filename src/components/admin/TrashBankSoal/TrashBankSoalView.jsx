import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../../lib/supabaseClient'
import {
    Search01Icon,
    Delete02Icon,
    CheckmarkCircle02Icon,
    Calendar02Icon,
    UserMultiple02Icon,
    BookOpen02Icon,
    MeetingRoomIcon,
    FilterIcon,
    RefreshIcon
} from 'hugeicons-react'
import LoadingSpinner from '../shared/LoadingSpinner'
import GlassCard from '../shared/GlassCard'
import ActionButton from '../shared/ActionButton'
import Select from '../../ui/Select'
import Swal from 'sweetalert2'

// =====================
// Custom Hooks (tetap sama)
// =====================

/**
 * Hook untuk mengambil data kelas
 */
const useKelas = () => {
    const [kelasList, setKelasList] = useState([])
    const [loadingKelas, setLoadingKelas] = useState(true)

    const fetchKelas = useCallback(async () => {
        try {
            setLoadingKelas(true)
            const { data, error } = await supabase
                .from('kelas')
                .select('*')
                .order('nama_kelas', { ascending: true })

            if (error) throw error
            setKelasList(data || [])
        } catch (error) {
            console.error('Error fetching kelas:', error)
        } finally {
            setLoadingKelas(false)
        }
    }, [])

    useEffect(() => {
        fetchKelas()
    }, [fetchKelas])

    return { kelasList, loadingKelas, refetch: fetchKelas }
}

/**
 * Hook untuk mengambil data mapel
 */
const useMapel = () => {
    const [mapelList, setMapelList] = useState([])
    const [loadingMapel, setLoadingMapel] = useState(true)

    const fetchMapel = useCallback(async () => {
        try {
            setLoadingMapel(true)
            const { data, error } = await supabase
                .from('mapel')
                .select('*')
                .order('nama_mapel', { ascending: true })

            if (error) throw error
            setMapelList(data || [])
        } catch (error) {
            console.error('Error fetching mapel:', error)
        } finally {
            setLoadingMapel(false)
        }
    }, [])

    useEffect(() => {
        fetchMapel()
    }, [fetchMapel])

    return { mapelList, loadingMapel, refetch: fetchMapel }
}

/**
 * Hook untuk mengambil guru (users with role guru)
 */
const useGuru = () => {
    const [guruList, setGuruList] = useState([])
    const [loadingGuru, setLoadingGuru] = useState(true)

    const fetchGuru = useCallback(async () => {
        try {
            setLoadingGuru(true)
            // Get unique guru IDs from trashed soal
            const { data: soalData, error: soalError } = await supabase
                .from('bank_soal')
                .select('guru_id')
                .not('deleted_at', 'is', null)

            if (soalError) throw soalError

            const guruIds = [...new Set(soalData?.map(s => s.guru_id).filter(Boolean) || [])]

            if (guruIds.length === 0) {
                setGuruList([])
                return
            }

            // Fetch guru details - select * to get all columns
            const { data: guruData, error: guruError } = await supabase
                .from('users')
                .select('*')
                .in('id', guruIds)

            if (guruError) throw guruError
            
            // Transform data to ensure we have required fields
            const transformedData = (guruData || []).map(guru => ({
                id: guru.id,
                email: guru.email || '',
                nama_lengkap: guru.nama || guru.nama_lengkap || guru.name || guru.full_name || 'Guru',
                mapel: guru.mapel || ''
            }))
            
            const sorted = transformedData.sort((a, b) => (a.nama_lengkap || '').localeCompare(b.nama_lengkap || ''))
            setGuruList(sorted)
        } catch (error) {
            console.error('Error fetching guru:', error)
            setGuruList([])
        } finally {
            setLoadingGuru(false)
        }
    }, [])

    useEffect(() => {
        fetchGuru()
    }, [fetchGuru])

    return { guruList, loadingGuru, refetch: fetchGuru }
}

/**
 * Hook untuk mengambil soal yang soft delete
 */
const useTrashBankSoal = () => {
    const [trashedSoals, setTrashedSoals] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchTrashSoal = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const { data, error: fetchError } = await supabase
                .from('bank_soal')
                .select('*')
                .not('deleted_at', 'is', null)
                .order('deleted_at', { ascending: false })

            if (fetchError) throw fetchError

            let enrichedData = data || []

            if (enrichedData.length > 0) {
                const kelas_ids = [...new Set(enrichedData.map(s => s.kelas_id).filter(Boolean))]
                const mapel_ids = [...new Set(enrichedData.map(s => s.mapel_id).filter(Boolean))]
                const guru_ids = [...new Set(enrichedData.map(s => s.guru_id).filter(Boolean))]

                const [kelasRes, mapelRes, guruRes] = await Promise.all([
                    kelas_ids.length > 0 ? supabase.from('kelas').select('*').in('id', kelas_ids) : { data: [] },
                    mapel_ids.length > 0 ? supabase.from('mapel').select('*').in('id', mapel_ids) : { data: [] },
                    guru_ids.length > 0 ? supabase.from('users').select('*').in('id', guru_ids) : { data: [] }
                ])

                enrichedData = enrichedData.map(soal => ({
                    ...soal,
                    kelas: kelasRes.data?.find(k => k.id === soal.kelas_id),
                    mapel_data: mapelRes.data?.find(m => m.id === soal.mapel_id),
                    guru_data: guruRes.data?.find(g => g.id === soal.guru_id)
                }))
            }

            setTrashedSoals(enrichedData)
        } catch (err) {
            console.error('Error fetching trashed soal:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchTrashSoal()
        
        const subscription = supabase
            .channel('bank_soal_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bank_soal' }, () => {
                fetchTrashSoal()
            })
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [fetchTrashSoal])

    const restoreSoal = useCallback(async (id) => {
        try {
            const { data, error } = await supabase
                .from('bank_soal')
                .update({ deleted_at: null })
                .eq('id', id)
                .select()

            if (error) throw error
            if (!data || data.length === 0) throw new Error('Gagal mengembalikan soal: Data tidak ditemukan atau akses ditolak.')

            setTrashedSoals(prev => prev.filter(s => s.id !== id))
            return { success: true }
        } catch (err) {
            console.error('Error restoring soal:', err)
            return { success: false, error: err.message }
        }
    }, [])

    const permanentDeleteSoal = useCallback(async (id) => {
        try {
            const { error } = await supabase
                .from('bank_soal')
                .delete()
                .eq('id', id)

            if (error) throw error

            setTrashedSoals(prev => prev.filter(s => s.id !== id))
            return { success: true }
        } catch (err) {
            console.error('Error permanently deleting soal:', err)
            return { success: false, error: err.message }
        }
    }, [])

    return {
        trashedSoals,
        loading,
        error,
        refetch: fetchTrashSoal,
        restoreSoal,
        permanentDeleteSoal
    }
}

// =====================
// Animation Variants
// =====================

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: 'easeOut' }
    }
}

// =====================
// Sub Components
// =====================

const InfoHeader = ({ totalItems, onRefresh }) => (
    <GlassCard>
        <div className="p-4 sm:p-5 bg-[#e5f3fb] rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-xl shrink-0">
                        <Delete02Icon size={24} className="text-[#0085db]" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Sampah Soal</h2>
                        <p className="text-sm text-gray-600 mt-0.5">
                            Total <span className="font-semibold text-[#0085db]">{totalItems}</span> soal telah dihapus
                        </p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onRefresh}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-[#f0f5f9] text-[#0085db] border border-[#0085db]/20 rounded-xl font-semibold transition-all shadow-xs"
                >
                    <RefreshIcon size={18} />
                    <span>Refresh</span>
                </motion.button>
            </div>
        </div>
    </GlassCard>
)

const Toolbar = ({
    searchTerm,
    onSearchChange,
    filterGuru,
    onFilterGuruChange,
    filterMapel,
    onFilterMapelChange,
    filterKelas,
    onFilterKelasChange,
    guruList,
    mapelList,
    kelasList,
    showFilters,
    onToggleFilters
}) => {
    // State untuk menampilkan filter di mobile
    const [isFilterOpen, setIsFilterOpen] = useState(showFilters)

    return (
        <GlassCard>
            <div className="p-4 sm:p-5">
                {/* Header Toolbar */}
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <FilterIcon size={20} className="text-[#0085db]" />
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filter Pencarian</h3>
                    </div>
                    
                    {/* Tombol toggle filter untuk mobile */}
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="lg:hidden flex items-center gap-2 px-3 py-1.5 bg-[#e5f3fb] text-[#0085db] rounded-lg text-sm font-medium"
                    >
                        <FilterIcon size={16} />
                        {isFilterOpen ? 'Sembunyikan' : 'Tampilkan'} Filter
                    </button>
                </div>

                {/* Search - Selalu tampil */}
                <div className="mb-4">
                    <div className="relative">
                        <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari pertanyaan soal..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0085db]/20 focus:border-[#0085db] transition-all text-sm sm:text-base"
                        />
                    </div>
                </div>

                {/* Filter Grid - Responsif */}
                <div className={`${isFilterOpen ? 'block' : 'hidden lg:block'} transition-all duration-300`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Filter Guru */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 block lg:hidden">
                                Filter Guru
                            </label>
                            <Select
                                options={[{ value: '', label: 'Semua Guru' }, ...guruList.map(g => ({ value: g.id, label: g.nama_lengkap }))]}
                                value={filterGuru}
                                onChange={onFilterGuruChange}
                                placeholder="Filter Guru"
                                className="w-full"
                            />
                        </div>

                        {/* Filter Mapel */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 block lg:hidden">
                                Filter Mata Pelajaran
                            </label>
                            <Select
                                options={[{ value: '', label: 'Semua Mapel' }, ...mapelList.map(m => ({ value: m.id, label: m.nama_mapel }))]}
                                value={filterMapel}
                                onChange={onFilterMapelChange}
                                placeholder="Filter Mata Pelajaran"
                                className="w-full"
                            />
                        </div>

                        {/* Filter Kelas */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 block lg:hidden">
                                Filter Kelas
                            </label>
                            <Select
                                options={[{ value: '', label: 'Semua Kelas' }, ...kelasList.map(k => ({ value: k.id, label: k.nama_kelas }))]}
                                value={filterKelas}
                                onChange={onFilterKelasChange}
                                placeholder="Filter Kelas"
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Info filter aktif (untuk mobile) */}
                    {(filterGuru || filterMapel || filterKelas) && (
                        <div className="mt-3 p-2 bg-[#e5f3fb] rounded-lg lg:hidden">
                            <p className="text-xs text-[#0085db]">
                                Filter aktif: {
                                    [
                                        filterGuru && 'Guru',
                                        filterMapel && 'Mapel',
                                        filterKelas && 'Kelas'
                                    ].filter(Boolean).join(', ')
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    )
}

const EmptyState = () => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 sm:py-16 px-4 bg-white rounded-2xl border border-gray-200"
    >
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#e5f3fb] rounded-full flex items-center justify-center mx-auto mb-4">
            <Delete02Icon size={40} className="text-[#46caeb]" />
        </div>
        <p className="text-lg sm:text-xl mb-2 font-semibold text-gray-900">Tidak ada soal yang dihapus</p>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
            Semua soal masih aktif di bank soal. Soal yang dihapus akan muncul di sini.
        </p>
    </motion.div>
)

const SoalCard = ({ soal, guruList, mapelList, kelasList, onRestore, onDelete }) => {
    const guru = guruList.find(g => g.id === soal.guru_id)
    const deletedDate = new Date(soal.deleted_at)
    const formattedDate = deletedDate.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    return (
        <motion.div
            variants={itemVariants}
            layout
            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all h-full flex flex-col"
        >
            {/* Header */}
            <div className="px-4 py-3 bg-[#e5f3fb] border-b border-[#0085db]/10 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#0085db] text-white whitespace-nowrap">
                    {soal.tipe_soal === 'pilihan_ganda' ? 'Pilihan Ganda' : 'Essay'}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1 shrink-0">
                    <Calendar02Icon size={14} />
                    <span className="hidden sm:inline">{formattedDate}</span>
                    <span className="sm:hidden">{deletedDate.toLocaleDateString('id-ID')}</span>
                </span>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 flex-1">
                {/* Pertanyaan */}
                <div>
                    <p className="text-sm font-medium text-gray-900 line-clamp-3">
                        {soal.pertanyaan}
                    </p>
                </div>

                {/* Info Grid - Responsif */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Guru */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <UserMultiple02Icon size={14} className="text-blue-600" />
                            <span className="font-semibold text-blue-700">Guru</span>
                        </div>
                        <p className="text-gray-700 font-medium text-sm truncate">{guru?.nama_lengkap || '-'}</p>
                        <p className="text-gray-500 text-xs truncate">{guru?.email || '-'}</p>
                    </div>

                    {/* Mapel */}
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <BookOpen02Icon size={14} className="text-green-600" />
                            <span className="font-semibold text-green-700">Mapel</span>
                        </div>
                        <p className="text-gray-700 font-medium text-sm">{soal.mapel_data?.nama_mapel || '-'}</p>
                    </div>

                    {/* Kelas - Full width di mobile, grid di tablet+ */}
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-100 sm:col-span-2">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <MeetingRoomIcon size={14} className="text-purple-600" />
                            <span className="font-semibold text-purple-700">Kelas</span>
                        </div>
                        <p className="text-gray-700 font-medium text-sm">{soal.kelas?.nama_kelas || '-'}</p>
                    </div>
                </div>

                {/* Jawaban Preview - Responsif */}
                {soal.tipe_soal === 'pilihan_ganda' && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                            Kunci Jawaban: <span className="text-gray-900 font-bold">{soal.kunci_jawaban}</span>
                        </p>
                        <div className="space-y-1.5">
                            {soal.opsi_jawaban?.slice(0, 4).map((opsi, idx) => (
                                <div
                                    key={idx}
                                    className={`text-xs p-2 rounded-lg flex items-center gap-2 ${
                                        soal.kunci_jawaban === opsi.label
                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                            : 'bg-white text-gray-700 border border-gray-200'
                                    }`}
                                >
                                    <span className="font-bold shrink-0">{opsi.label}.</span>
                                    <span className="truncate">{opsi.text}</span>
                                    {soal.kunci_jawaban === opsi.label && (
                                        <CheckmarkCircle02Icon size={14} className="ml-auto shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {soal.tipe_soal === 'essay' && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="text-xs text-blue-900">
                            <span className="font-semibold">Pedoman Penilaian:</span> {soal.kunci_jawaban || '-'}
                        </p>
                    </div>
                )}
            </div>

            {/* Footer Actions - Responsif */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onRestore(soal.id)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-all w-full sm:w-auto"
                >
                    <Delete02Icon size={16} />
                    <span>Kembalikan</span>
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onDelete(soal.id)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-all w-full sm:w-auto"
                >
                    <Delete02Icon size={16} />
                    <span>Hapus Permanen</span>
                </motion.button>
            </div>
        </motion.div>
    )
}

const SoalGrid = ({ soals, guruList, mapelList, kelasList, onRestore, onDelete }) => (
    <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
    >
        <AnimatePresence>
            {soals.map((soal) => (
                <SoalCard
                    key={soal.id}
                    soal={soal}
                    guruList={guruList}
                    mapelList={mapelList}
                    kelasList={kelasList}
                    onRestore={onRestore}
                    onDelete={onDelete}
                />
            ))}
        </AnimatePresence>
    </motion.div>
)

// =====================
// Helper Functions
// =====================

const showRestoreConfirmation = () => {
    return Swal.fire({
        title: 'Kembalikan Soal?',
        text: 'Soal akan dikembalikan ke bank soal guru pemilik soal ini.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#16a34a',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Kembalikan',
        cancelButtonText: 'Batal',
        reverseButtons: true
    })
}

const showDeleteConfirmation = () => {
    return Swal.fire({
        title: 'Hapus Permanen?',
        text: 'Soal akan dihapus secara permanen dan tidak dapat dipulihkan.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Hapus Permanen',
        cancelButtonText: 'Batal',
        reverseButtons: true
    })
}

const showSuccessMessage = (message) => {
    Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: message,
        timer: 2000,
        showConfirmButton: false
    })
}

const showErrorMessage = (message) => {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        confirmButtonColor: '#dc2626'
    })
}

// =====================
// Main Component
// =====================

export default function TrashBankSoalView() {
    // State
    const [searchTerm, setSearchTerm] = useState('')
    const [filterGuru, setFilterGuru] = useState('')
    const [filterMapel, setFilterMapel] = useState('')
    const [filterKelas, setFilterKelas] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    // Custom hooks
    const { kelasList } = useKelas()
    const { mapelList } = useMapel()
    const { guruList } = useGuru()
    const { trashedSoals, loading, refetch: refetchTrash, restoreSoal, permanentDeleteSoal } = useTrashBankSoal()

    // Filtered soal
    const filteredSoals = useMemo(() => {
        return trashedSoals.filter(soal => {
            const matchSearch = soal.pertanyaan?.toLowerCase().includes(searchTerm.toLowerCase())
            const matchGuru = !filterGuru || soal.guru_id === filterGuru
            const matchMapel = !filterMapel || soal.mapel_id === parseInt(filterMapel)
            const matchKelas = !filterKelas || soal.kelas_id === parseInt(filterKelas)
            return matchSearch && matchGuru && matchMapel && matchKelas
        })
    }, [trashedSoals, searchTerm, filterGuru, filterMapel, filterKelas])

    // Handlers
    const handleRestore = useCallback(async (id) => {
        const result = await showRestoreConfirmation()

        if (result.isConfirmed) {
            Swal.fire({
                title: 'Memproses...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            })

            const { success, error } = await restoreSoal(id)

            if (success) {
                Swal.close()
                showSuccessMessage('Soal berhasil dikembalikan ke bank soal.')
            } else {
                Swal.close()
                showErrorMessage(error || 'Gagal mengembalikan soal')
            }
        }
    }, [restoreSoal])

    const handlePermanentDelete = useCallback(async (id) => {
        const result = await showDeleteConfirmation()

        if (result.isConfirmed) {
            Swal.fire({
                title: 'Menghapus...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            })

            const { success, error } = await permanentDeleteSoal(id)

            if (success) {
                Swal.close()
                showSuccessMessage('Soal berhasil dihapus permanen.')
            } else {
                Swal.close()
                showErrorMessage(error || 'Gagal menghapus soal')
            }
        }
    }, [permanentDeleteSoal])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <LoadingSpinner color="blue" />
            </div>
        )
    }

    return (
        <div className="space-y-5 sm:space-y-6 animate-fade-in-up">
            {/* Info Header */}
            <InfoHeader 
                totalItems={trashedSoals.length} 
                onRefresh={() => refetchTrash()}
            />

            {/* Toolbar / Filter */}
            <Toolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterGuru={filterGuru}
                onFilterGuruChange={setFilterGuru}
                filterMapel={filterMapel}
                onFilterMapelChange={setFilterMapel}
                filterKelas={filterKelas}
                onFilterKelasChange={setFilterKelas}
                guruList={guruList}
                mapelList={mapelList}
                kelasList={kelasList}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
            />

            {/* Content */}
            {filteredSoals.length === 0 && trashedSoals.length === 0 ? (
                <EmptyState />
            ) : filteredSoals.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 px-4 bg-white rounded-2xl border border-gray-200"
                >
                    <p className="text-lg mb-2 font-semibold text-gray-900">Tidak ada hasil filter</p>
                    <p className="text-sm text-gray-500">Coba ubah filter pencarian Anda</p>
                </motion.div>
            ) : (
                <>
                    {/* Info hasil pencarian */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            Menampilkan <span className="font-semibold text-[#0085db]">{filteredSoals.length}</span> dari{' '}
                            <span className="font-semibold">{trashedSoals.length}</span> soal
                        </p>
                    </div>
                    
                    {/* Grid Soal */}
                    <SoalGrid
                        soals={filteredSoals}
                        guruList={guruList}
                        mapelList={mapelList}
                        kelasList={kelasList}
                        onRestore={handleRestore}
                        onDelete={handlePermanentDelete}
                    />
                </>
            )}
        </div>
    )
}