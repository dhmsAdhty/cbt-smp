import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import {
    PlusSignIcon,
    Delete02Icon,
    Edit02Icon,
    Search01Icon,
    FilterHorizontalIcon
} from 'hugeicons-react'
import GlassCard from '../../admin/shared/GlassCard'
import LoadingSpinner from '../../admin/shared/LoadingSpinner'
import ActionButton from '../../admin/shared/ActionButton'
import SoalForm from './SoalForm'
import Swal from 'sweetalert2'

const BankSoalView = () => {
    const [soals, setSoals] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [selectedSoal, setSelectedSoal] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [mapelId, setMapelId] = useState(null) // Mapel ID for the logged-in guru

    useEffect(() => {
        fetchGuruMapel()
    }, [])

    useEffect(() => {
        if (mapelId) {
            fetchSoal()
        }
    }, [mapelId])

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
                .select('*')
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

    const filteredSoals = soals.filter(soal =>
        soal.pertanyaan.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (showForm) {
        return <SoalForm
            soal={selectedSoal}
            mapelId={mapelId}
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

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Toolbar */}
            <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari pertanyaan..."
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
                    Tambah Soal
                </ActionButton>
            </GlassCard>

            {loading ? (
                <div className="flex justify-center p-12">
                    <LoadingSpinner />
                </div>
            ) : filteredSoals.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">Belum ada soal dibuat.</p>
                    <p className="text-sm">Mulai buat bank soal untuk mata pelajaran Anda.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredSoals.map((soal, index) => (
                        <GlassCard key={soal.id} className="p-6 group hover:border-blue-300 transition-all duration-300">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                            No. {index + 1}
                                        </span>
                                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                                            {soal.tipe_soal === 'pilihan_ganda' ? 'Pilihan Ganda' : 'Essay'}
                                        </span>
                                        <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-medium">
                                            Bobot: {soal.bobot}
                                        </span>
                                    </div>

                                    <div className="prose dark:prose-invert max-w-none mb-4">
                                        <p className="text-gray-800 dark:text-gray-200 font-medium whitespace-pre-wrap">
                                            {soal.pertanyaan}
                                        </p>
                                        {soal.gambar_url && (
                                            <img
                                                src={soal.gambar_url}
                                                alt="Soal"
                                                className="mt-3 rounded-lg border border-gray-200 max-h-60 object-contain"
                                            />
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4 border-l-2 border-gray-100 dark:border-gray-700">
                                        {soal.opsi_jawaban && soal.opsi_jawaban.map((opsi, i) => (
                                            <div
                                                key={i}
                                                className={`
                                                    p-3 rounded-lg text-sm flex items-start gap-3
                                                    ${soal.kunci_jawaban === opsi.label
                                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                                        : 'bg-gray-50 text-gray-600'
                                                    }
                                                `}
                                            >
                                                <span className="font-bold">{opsi.label}.</span>
                                                <span>{opsi.text}</span>
                                                {soal.kunci_jawaban === opsi.label && (
                                                    <CheckmarkCircle02Icon size={16} className="ml-auto flex-shrink-0" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(soal)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit Soal"
                                    >
                                        <Edit02Icon size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(soal.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Hapus Soal"
                                    >
                                        <Delete02Icon size={20} />
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    )
}

export default BankSoalView
