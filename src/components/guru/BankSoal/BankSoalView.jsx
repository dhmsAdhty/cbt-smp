import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../../lib/supabaseClient'
import {
    PlusSignIcon,
    Delete02Icon,
    Edit02Icon,
    Search01Icon,
    CheckmarkCircle02Icon
} from 'hugeicons-react'
import LoadingSpinner from '../../admin/shared/LoadingSpinner'
import SoalForm from './SoalForm'
import Select from '../../ui/Select'
import Swal from 'sweetalert2'

// =====================
// Custom Hooks
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
 * Hook untuk mengambil mapel guru yang login
 */
const useGuruMapel = () => {
    const [mapelId, setMapelId] = useState(null)
    const [loadingMapel, setLoadingMapel] = useState(true)

    const fetchGuruMapel = useCallback(async () => {
        try {
            setLoadingMapel(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: userData, error } = await supabase
                .from('users')
                .select('mapel')
                .eq('id', user.id)
                .single()

            if (error) throw error

            if (userData?.mapel) {
                const { data: mapelData, error: mapelError } = await supabase
                    .from('mapel')
                    .select('id')
                    .eq('nama_mapel', userData.mapel)
                    .single()

                if (mapelError) throw mapelError
                if (mapelData) setMapelId(mapelData.id)
            }
        } catch (error) {
            console.error('Error fetching guru mapel:', error)
        } finally {
            setLoadingMapel(false)
        }
    }, [])

    useEffect(() => {
        fetchGuruMapel()
    }, [fetchGuruMapel])

    return { mapelId, loadingMapel, refetch: fetchGuruMapel }
}

/**
 * Hook untuk mengambil soal bank soal
 */
const useBankSoal = (mapelId) => {
    const [soals, setSoals] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchSoal = useCallback(async () => {
        if (!mapelId) return

        try {
            setLoading(true)
            setError(null)

            const { data, error: fetchError } = await supabase
                .from('bank_soal')
                .select('*, kelas:kelas_id(id, nama_kelas)')
                .eq('mapel_id', mapelId)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError
            setSoals(data || [])
        } catch (err) {
            console.error('Error fetching soal:', err)
            setError(err.message)
            Swal.fire('Error', 'Gagal memuat bank soal', 'error')
        } finally {
            setLoading(false)
        }
    }, [mapelId])

    useEffect(() => {
        fetchSoal()
    }, [fetchSoal])

    // Soft delete handler
    const deleteSoal = useCallback(async (id) => {
        try {
            const { data, error } = await supabase
                .from('bank_soal')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .select()

            if (error) throw error
            if (!data || data.length === 0) throw new Error('Gagal menghapus soal: Data tidak ditemukan atau akses ditolak.')

            // Update local state
            setSoals(prev => prev.filter(s => s.id !== id))
            return { success: true }
        } catch (err) {
            console.error('Error soft deleting soal:', err)
            return { success: false, error: err.message }
        }
    }, [])

    return {
        soals,
        loading,
        error,
        refetch: fetchSoal,
        deleteSoal
    }
}

// =====================
// Helper Functions
// =====================

const showDeleteConfirmation = () => {
    return Swal.fire({
        title: 'Hapus Soal?',
        text: 'Soal akan dipindahkan ke sampah dan dapat dipulihkan nanti.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    })
}

const showSuccessMessage = (message) => {
    Swal.fire('Terhapus!', message, 'success')
}

const showErrorMessage = (message) => {
    Swal.fire('Error', message, 'error')
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

const Toolbar = ({
    searchTerm,
    onSearchChange,
    filterKelas,
    onFilterKelasChange,
    filterTipe,
    onFilterTipeChange,
    kelasList,
    onAdd
}) => (
    <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-1 w-full gap-3 flex-col sm:flex-row">
            <div className="relative flex-1">
                <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Cari pertanyaan..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
            <div className="w-full sm:w-52">
                <Select
                    value={filterKelas}
                    onChange={onFilterKelasChange}
                    placeholder="Semua Kelas"
                    variant="blue"
                    options={[
                        { value: '', label: 'Semua Kelas' },
                        ...kelasList.map(k => ({ value: String(k.id), label: k.nama_kelas }))
                    ]}
                />
            </div>
            <div className="w-full sm:w-48">
                <Select
                    value={filterTipe}
                    onChange={onFilterTipeChange}
                    placeholder="Semua Tipe"
                    variant="blue"
                    options={[
                        { value: '', label: 'Semua Tipe' },
                        { value: 'pilihan_ganda', label: 'Pilihan Ganda' },
                        { value: 'essay', label: 'Essay' }
                    ]}
                />
            </div>
        </div>
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAdd}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20"
        >
            <PlusSignIcon size={20} />
            <span>Tambah Soal</span>
        </motion.button>
    </div>
)

const EmptyState = () => (
    <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-200">
        <p className="text-lg mb-2 font-semibold">Belum ada soal dibuat.</p>
        <p className="text-sm">Mulai buat bank soal untuk mata pelajaran Anda.</p>
    </div>
)

const OpsiJawaban = ({ soal }) => {
    const opsis = Array.isArray(soal.opsi_jawaban)
        ? soal.opsi_jawaban
        : Object.entries(soal.opsi_jawaban || {}).map(([k, v]) => ({ label: k, text: v }))

    const totalOpsi = Array.isArray(soal.opsi_jawaban)
        ? soal.opsi_jawaban.length
        : Object.keys(soal.opsi_jawaban || {}).length

    return (
        <div className="space-y-1.5">
            {opsis.slice(0, 2).map((opsi, i) => (
                <div
                    key={i}
                    className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 ${soal.kunci_jawaban === opsi.label
                        ? 'bg-green-50 text-green-700 font-semibold'
                        : 'bg-gray-50 text-gray-600'
                        }`}
                >
                    <span className="font-bold">{opsi.label}.</span>
                    <span className="truncate">{opsi.text}</span>
                    {soal.kunci_jawaban === opsi.label && (
                        <CheckmarkCircle02Icon size={14} className="ml-auto shrink-0" />
                    )}
                </div>
            ))}
            {totalOpsi > 2 && (
                <p className="text-xs text-gray-400 italic pl-1">
                    + {totalOpsi - 2} opsi lainnya
                </p>
            )}
        </div>
    )
}

const SoalCard = ({ soal, index, onEdit, onDelete }) => (
    <motion.div
        variants={itemVariants}
        layout
        initial="hidden"
        animate="visible"
        exit={{ opacity: 0, scale: 0.9 }}
        className="group bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 flex flex-col"
    >
        {/* Card Header */}
        <div className="p-4 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        {index + 1}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${soal.tipe_soal === 'essay'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                        }`}>
                        {soal.tipe_soal === 'pilihan_ganda' ? 'PG' : 'Essay'}
                    </span>
                    {soal.kelas && (
                        <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                            {soal.kelas.nama_kelas}
                        </span>
                    )}
                </div>
            </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex-1">
            <p className="text-sm text-gray-800 font-medium line-clamp-3 mb-3">
                {soal.pertanyaan}
            </p>

            {soal.gambar_url && (
                <img
                    src={soal.gambar_url}
                    alt="Soal"
                    className="rounded-lg border border-gray-200 max-h-32 object-contain mb-3"
                />
            )}

            {soal.tipe_soal === 'pilihan_ganda' && soal.opsi_jawaban ? (
                <OpsiJawaban soal={soal} />
            ) : soal.tipe_soal === 'essay' ? (
                <p className="text-xs text-blue-500 italic">
                    Jawaban uraian
                </p>
            ) : null}
        </div>

        {/* Card Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-end gap-1">
            <button
                onClick={() => onEdit(soal)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs flex items-center gap-1.5 font-medium"
            >
                <Edit02Icon size={16} />
                Edit
            </button>
            <button
                onClick={() => onDelete(soal.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-xs flex items-center gap-1.5 font-medium"
            >
                <Delete02Icon size={16} />
                Hapus
            </button>
        </div>
    </motion.div>
)

const SoalGrid = ({ soals, onEdit, onDelete }) => (
    <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
        <AnimatePresence>
            {soals.map((soal, index) => (
                <SoalCard
                    key={soal.id}
                    soal={soal}
                    index={index}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </AnimatePresence>
    </motion.div>
)

// =====================
// Main Component
// =====================

const BankSoalView = () => {
    // State
    const [showForm, setShowForm] = useState(false)
    const [selectedSoal, setSelectedSoal] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterKelas, setFilterKelas] = useState('')
    const [filterTipe, setFilterTipe] = useState('')

    // Custom hooks
    const { mapelId, loading: loadingMapel } = useGuruMapel()
    const { kelasList } = useKelas()
    const { soals, loading: loadingSoal, refetch: refetchSoal, deleteSoal } = useBankSoal(mapelId)

    // Derived state
    const loading = loadingMapel || loadingSoal

    // Filtered soal
    const filteredSoals = useMemo(() => {
        return soals.filter(soal => {
            const matchSearch = soal.pertanyaan?.toLowerCase().includes(searchTerm.toLowerCase())
            const matchKelas = !filterKelas || soal.kelas_id === parseInt(filterKelas)
            const matchTipe = !filterTipe || soal.tipe_soal === filterTipe
            return matchSearch && matchKelas && matchTipe
        })
    }, [soals, searchTerm, filterKelas, filterTipe])

    // Handlers
    const handleAdd = useCallback(() => {
        setSelectedSoal(null)
        setShowForm(true)
    }, [])

    const handleEdit = useCallback((soal) => {
        setSelectedSoal(soal)
        setShowForm(true)
    }, [])

    const handleDelete = useCallback(async (id) => {
        const result = await showDeleteConfirmation()

        if (result.isConfirmed) {
            const { success, error } = await deleteSoal(id)

            if (success) {
                showSuccessMessage('Soal berhasil dihapus (Soft Delete).')
            } else {
                showErrorMessage(error || 'Gagal menghapus soal')
            }
        }
    }, [deleteSoal])

    const handleFormClose = useCallback(() => {
        setShowForm(false)
        setSelectedSoal(null)
        refetchSoal()
    }, [refetchSoal])

    // Render form if showForm is true
    if (showForm) {
        return (
            <SoalForm
                soal={selectedSoal}
                mapelId={mapelId}
                kelasList={kelasList}
                onClose={handleFormClose}
            />
        )
    }

    // Show warning if guru doesn't have mapel assigned
    if (!mapelId && !loading) {
        return (
            <div className="text-center p-10 bg-red-50 text-red-600 rounded-xl">
                <p>Anda belum ditugaskan ke mata pelajaran apapun. Hubungi Admin.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <Toolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterKelas={filterKelas}
                onFilterKelasChange={setFilterKelas}
                filterTipe={filterTipe}
                onFilterTipeChange={setFilterTipe}
                kelasList={kelasList}
                onAdd={handleAdd}
            />

            {/* Content */}
            {loading ? (
                <LoadingSpinner color="blue" />
            ) : filteredSoals.length === 0 ? (
                <EmptyState />
            ) : (
                <SoalGrid
                    soals={filteredSoals}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}
        </div>
    )
}

export default BankSoalView
