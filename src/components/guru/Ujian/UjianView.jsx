import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../../lib/supabaseClient'
import {
    PlusSignIcon,
    Calendar02Icon,
    Clock01Icon,
    Edit02Icon,
    Delete02Icon,
    Search01Icon,
    NoteIcon
} from 'hugeicons-react'
import LoadingSpinner from '../../admin/shared/LoadingSpinner'
import UjianForm from './UjianForm'
import Swal from 'sweetalert2'

const UjianView = () => {
    const [ujians, setUjians] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [selectedUjian, setSelectedUjian] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [guruId, setGuruId] = useState(null)

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setGuruId(user.id)
        }
        fetchUser()
    }, [])

    useEffect(() => {
        if (guruId) {
            fetchUjian()
        }
    }, [guruId])

    const fetchUjian = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('ujian')
                .select('*')
                .eq('guru_id', guruId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setUjians(data || [])
        } catch (error) {
            console.error('Error fetching ujian:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Hapus Ujian?',
            text: 'Data ujian dan nilai siswa terkait akan dihapus permanen',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        })

        if (result.isConfirmed) {
            try {
                // Delete ujian_soal relations first
                await supabase
                    .from('ujian_soal')
                    .delete()
                    .eq('ujian_id', id)

                const { error } = await supabase
                    .from('ujian')
                    .delete()
                    .eq('id', id)

                if (error) throw error

                setUjians(ujians.filter(u => u.id !== id))
                Swal.fire('Terhapus!', 'Ujian berhasil dihapus.', 'success')
            } catch (error) {
                Swal.fire('Error', 'Gagal menghapus ujian', 'error')
            }
        }
    }

    const handleEdit = (ujian) => {
        setSelectedUjian(ujian)
        setShowForm(true)
    }

    const handleFormClose = () => {
        setShowForm(false)
        setSelectedUjian(null)
        fetchUjian()
    }

    const filteredUjians = ujians.filter(ujian =>
        ujian.judul?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getStatusStyle = (status) => {
        switch (status) {
            case 'aktif':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            case 'selesai':
                return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            default:
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        }
    }

    if (showForm) {
        return <UjianForm
            ujian={selectedUjian}
            guruId={guruId}
            onClose={handleFormClose}
        />
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
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari ujian..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowForm(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20"
                >
                    <PlusSignIcon size={20} />
                    <span>Buat Ujian Baru</span>
                </motion.button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <LoadingSpinner color="blue" />
                </div>
            ) : filteredUjians.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-200">
                    <p className="text-lg mb-2 font-semibold">Belum ada ujian dibuat.</p>
                    <p className="text-sm">Buat jadwal ujian baru untuk siswa Anda.</p>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                >
                    <AnimatePresence>
                        {filteredUjians.map((ujian) => (
                            <motion.div
                                key={ujian.id}
                                variants={itemVariants}
                                layout
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 hover:shadow-lg transition-all duration-300 flex flex-col"
                            >
                                {/* Card Header */}
                                <div className="p-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center justify-start gap-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusStyle(ujian.status)}`}>
                                            {ujian.status === 'draft' && 'DRAFT'}
                                            {ujian.status === 'aktif' && 'AKTIF'}
                                            {ujian.status === 'selesai' && 'SELESAI'}
                                        </span>
                                        <span className="text-xs text-gray-400 border border-gray-100 px-2 py-0.5 rounded-full">
                                            {ujian.durasi_menit} menit
                                        </span>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-4 flex-1">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3 line-clamp-2">
                                        {ujian.judul}
                                    </h3>

                                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <Calendar02Icon size={15} className="text-blue-500 flex-shrink-0" />
                                            <span className="text-xs truncate">
                                                <span className="font-medium text-gray-600 dark:text-gray-300">Mulai:</span>{' '}
                                                {ujian.waktu_mulai ? new Date(ujian.waktu_mulai).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
                                                }) + ' WIB' : '-'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar02Icon size={15} className="text-red-400 flex-shrink-0" />
                                            <span className="text-xs truncate">
                                                <span className="font-medium text-gray-600 dark:text-gray-300">Selesai:</span>{' '}
                                                {ujian.waktu_selesai ? new Date(ujian.waktu_selesai).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
                                                }) + ' WIB' : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-1">
                                    <button
                                        onClick={() => handleEdit(ujian)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-xs flex items-center gap-1.5 font-medium"
                                    >
                                        <Edit02Icon size={16} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ujian.id)}
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

export default UjianView

