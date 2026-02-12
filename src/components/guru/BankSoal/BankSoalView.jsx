import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../../lib/supabaseClient'
import {
    PlusSignIcon,
    Delete02Icon,
    Edit02Icon,
    Search01Icon,
    FilterHorizontalIcon,
    CheckmarkCircle02Icon,
    MeetingRoomIcon
} from 'hugeicons-react'
import GlassCard from '../../admin/shared/GlassCard'
import LoadingSpinner from '../../admin/shared/LoadingSpinner'
import ActionButton from '../../admin/shared/ActionButton'
import SoalForm from './SoalForm'
import Select from '../../ui/Select'
import Swal from 'sweetalert2'

const BankSoalView = () => {
    const [soals, setSoals] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [selectedSoal, setSelectedSoal] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [mapelId, setMapelId] = useState(null) // Mapel ID for the logged-in guru
    const [kelasList, setKelasList] = useState([])
    const [filterKelas, setFilterKelas] = useState('')
    const [filterTipe, setFilterTipe] = useState('')

    useEffect(() => {
        fetchGuruMapel()
        fetchKelas()
    }, [])

    useEffect(() => {
        if (mapelId) {
            fetchSoal()
        }
    }, [mapelId])

    const fetchKelas = async () => {
        try {
            const { data, error } = await supabase
                .from('kelas')
                .select('*')
                .order('nama_kelas', { ascending: true })
            if (error) throw error
            setKelasList(data || [])
        } catch (error) {
            console.error('Error fetching kelas:', error)
        }
    }

    const fetchGuruMapel = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get guru's mapel from users table
            const { data: userData, error } = await supabase
                .from('users')
                .select('mapel')
                .eq('id', user.id)
                .single()

            if (error) throw error

            if (userData?.mapel) {
                // Find mapel ID
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
        }
    }

    const fetchSoal = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('bank_soal')
                .select('*, kelas:kelas_id(id, nama_kelas)')
                .eq('mapel_id', mapelId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setSoals(data || [])
        } catch (error) {
            console.error('Error fetching soal:', error)
            Swal.fire('Error', 'Gagal memuat bank soal', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Hapus Soal?',
            text: 'Soal yang dihapus tidak dapat dikembalikan',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        })

        if (result.isConfirmed) {
            try {
                const { error } = await supabase
                    .from('bank_soal')
                    .delete()
                    .eq('id', id)

                if (error) throw error

                setSoals(soals.filter(s => s.id !== id))
                Swal.fire('Terhapus!', 'Soal berhasil dihapus.', 'success')
            } catch (error) {
                Swal.fire('Error', 'Gagal menghapus soal', 'error')
            }
        }
    }

    const handleEdit = (soal) => {
        setSelectedSoal(soal)
        setShowForm(true)
    }

    const handleFormClose = () => {
        setShowForm(false)
        setSelectedSoal(null)
        fetchSoal()
    }

    const filteredSoals = soals.filter(soal => {
        const matchSearch = soal.pertanyaan.toLowerCase().includes(searchTerm.toLowerCase())
        const matchKelas = !filterKelas || soal.kelas_id === parseInt(filterKelas)
        const matchTipe = !filterTipe || soal.tipe_soal === filterTipe
        return matchSearch && matchKelas && matchTipe
    })

    if (showForm) {
        return <SoalForm
            soal={selectedSoal}
            mapelId={mapelId}
            kelasList={kelasList}
            onClose={handleFormClose}
        />
    }

    if (!mapelId && !loading) {
        return (
            <div className="text-center p-10 bg-red-50 text-red-600 rounded-xl">
                <p>Anda belum ditugaskan ke mata pelajaran apapun. Hubungi Admin.</p>
            </div>
        )
    }

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: 'easeOut'
            }
        }
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex flex-1 w-full gap-3 flex-col sm:flex-row">
                    <div className="relative flex-1">
                        <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari pertanyaan..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full sm:w-52">
                        <Select
                            value={filterKelas}
                            onChange={(val) => setFilterKelas(val)}
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
                            onChange={(val) => setFilterTipe(val)}
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
                    onClick={() => setShowForm(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20"
                >
                    <PlusSignIcon size={20} />
                    <span>Tambah Soal</span>
                </motion.button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <LoadingSpinner color="blue" />
                </div>
            ) : filteredSoals.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-200">
                    <p className="text-lg mb-2 font-semibold">Belum ada soal dibuat.</p>
                    <p className="text-sm">Mulai buat bank soal untuk mata pelajaran Anda.</p>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    <AnimatePresence>
                        {filteredSoals.map((soal, index) => (
                            <motion.div
                                key={soal.id}
                                variants={itemVariants}
                                layout
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-blue-400 hover:shadow-lg transition-all duration-300 flex flex-col"
                            >
                                {/* Card Header */}
                                <div className="p-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                                {index + 1}
                                            </span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${soal.tipe_soal === 'essay'
                                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                {soal.tipe_soal === 'pilihan_ganda' ? 'PG' : 'Essay'}
                                            </span>
                                            {soal.kelas && (
                                                <span className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                    {soal.kelas.nama_kelas}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400 font-medium">
                                            Bobot: {soal.bobot}
                                        </span>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-4 flex-1">
                                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium line-clamp-3 mb-3">
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
                                        <div className="space-y-1.5">
                                            {(() => {
                                                const opsis = Array.isArray(soal.opsi_jawaban)
                                                    ? soal.opsi_jawaban
                                                    : Object.entries(soal.opsi_jawaban || {}).map(([k, v]) => ({ label: k, text: v }));

                                                return opsis.slice(0, 2).map((opsi, i) => (
                                                    <div
                                                        key={i}
                                                        className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 ${soal.kunci_jawaban === opsi.label
                                                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 font-semibold'
                                                            : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                            }`}
                                                    >
                                                        <span className="font-bold">{opsi.label}.</span>
                                                        <span className="truncate">{opsi.text}</span>
                                                        {soal.kunci_jawaban === opsi.label && (
                                                            <CheckmarkCircle02Icon size={14} className="ml-auto flex-shrink-0" />
                                                        )}
                                                    </div>
                                                ))
                                            })()}
                                            {(Array.isArray(soal.opsi_jawaban) ? soal.opsi_jawaban.length : Object.keys(soal.opsi_jawaban || {}).length) > 2 && (
                                                <p className="text-xs text-gray-400 italic pl-1">+ {(Array.isArray(soal.opsi_jawaban) ? soal.opsi_jawaban.length : Object.keys(soal.opsi_jawaban || {}).length) - 2} opsi lainnya</p>
                                            )}
                                        </div>
                                    ) : soal.tipe_soal === 'essay' ? (
                                        <p className="text-xs text-blue-500 dark:text-blue-400 italic">
                                            Jawaban uraian
                                        </p>
                                    ) : null}
                                </div>

                                {/* Card Footer */}
                                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-1">
                                    <button
                                        onClick={() => handleEdit(soal)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-xs flex items-center gap-1.5 font-medium"
                                    >
                                        <Edit02Icon size={16} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(soal.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-xs flex items-center gap-1.5 font-medium"
                                    >
                                        <Delete02Icon size={16} />
                                        Hapus
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    )
}

export default BankSoalView
