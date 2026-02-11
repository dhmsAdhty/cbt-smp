import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import {
    PlusSignIcon,
    Calendar02Icon,
    Clock01Icon,
    Edit02Icon,
    Delete02Icon,
    Search01Icon
} from 'hugeicons-react'
import GlassCard from '../../admin/shared/GlassCard'
import LoadingSpinner from '../../admin/shared/LoadingSpinner'
import ActionButton from '../../admin/shared/ActionButton'
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
            Swal.fire('Error', 'Gagal memuat data ujian', 'error')
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
        ujian.judul.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (showForm) {
        return <UjianForm
            ujian={selectedUjian}
            guruId={guruId}
            onClose={handleFormClose}
        />
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Toolbar */}
            <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari ujian..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <ActionButton
                    variant="primary"
                    icon={PlusSignIcon}
                    onClick={() => setShowForm(true)}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
                >
                    Buat Ujian Baru
                </ActionButton>
            </GlassCard>

            {loading ? (
                <div className="flex justify-center p-12">
                    <LoadingSpinner />
                </div>
            ) : filteredUjians.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">Belum ada ujian dibuat.</p>
                    <p className="text-sm">Buat jadwal ujian baru untuk siswa Anda.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredUjians.map((ujian) => (
                        <GlassCard key={ujian.id} className="p-6 group hover:border-blue-300 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`
                                    px-3 py-1 rounded-full text-xs font-bold
                                    ${ujian.status === 'aktif' ? 'bg-green-100 text-green-600' :
                                        ujian.status === 'selesai' ? 'bg-gray-100 text-gray-600' :
                                            'bg-yellow-100 text-yellow-600'}
                                `}>
                                    {ujian.status.toUpperCase()}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(ujian)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit02Icon size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ujian.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Hapus"
                                    >
                                        <Delete02Icon size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
                                {ujian.judul}
                            </h3>

                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
                                <div className="flex items-center gap-2">
                                    <Calendar02Icon size={16} />
                                    <span>
                                        {new Date(ujian.waktu_mulai).toLocaleDateString('id-ID', {
                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock01Icon size={16} />
                                    <span>{ujian.durasi_menit} Menit</span>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    )
}

export default UjianView
