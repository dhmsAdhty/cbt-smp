import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import {
    Bookmark02Icon,
    Cancel01Icon,
    Calendar02Icon,
    Clock01Icon,
    CheckmarkCircle02Icon
} from 'hugeicons-react'
import GlassCard from '../../admin/shared/GlassCard'
import ActionButton from '../../admin/shared/ActionButton'
import LoadingSpinner from '../../admin/shared/LoadingSpinner'
import Swal from 'sweetalert2'

const UjianForm = ({ ujian, guruId, onClose }) => {
    const [loading, setLoading] = useState(false)
    const [loadingSoal, setLoadingSoal] = useState(true)
    const [availableSoal, setAvailableSoal] = useState([])
    const [selectedSoalIds, setSelectedSoalIds] = useState([])
    const [mapelId, setMapelId] = useState(null)
    const [formData, setFormData] = useState({
        judul: '',
        deskripsi: '',
        waktu_mulai: '',
        waktu_selesai: '',
        durasi_menit: 60,
        status: 'draft'
    })

    useEffect(() => {
        fetchGuruMapel()
    }, [])

    useEffect(() => {
        if (mapelId) {
            fetchAvailableSoal()
        }
    }, [mapelId])

    useEffect(() => {
        if (ujian) {
            setFormData({
                judul: ujian.judul,
                deskripsi: ujian.deskripsi || '',
                waktu_mulai: ujian.waktu_mulai ? new Date(ujian.waktu_mulai).toISOString().slice(0, 16) : '',
                waktu_selesai: ujian.waktu_selesai ? new Date(ujian.waktu_selesai).toISOString().slice(0, 16) : '',
                durasi_menit: ujian.durasi_menit || 60,
                status: ujian.status || 'draft'
            })
            fetchSelectedSoal(ujian.id)
        }
    }, [ujian])

    const fetchGuruMapel = async () => {
        try {
            const { data: userData, error } = await supabase
                .from('users')
                .select('mapel')
                .eq('id', guruId)
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
        }
    }

    const fetchAvailableSoal = async () => {
        try {
            setLoadingSoal(true)
            const { data, error } = await supabase
                .from('bank_soal')
                .select('id, pertanyaan, bobot')
                .eq('mapel_id', mapelId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setAvailableSoal(data || [])
        } catch (error) {
            console.error('Error fetching soal:', error)
        } finally {
            setLoadingSoal(false)
        }
    }

    const fetchSelectedSoal = async (ujianId) => {
        try {
            const { data, error } = await supabase
                .from('ujian_soal')
                .select('soal_id')
                .eq('ujian_id', ujianId)

            if (error) throw error
            setSelectedSoalIds(data.map(item => item.soal_id))
        } catch (error) {
            console.error('Error fetching selected soal:', error)
        }
    }

    const toggleSoalSelection = (soalId) => {
        setSelectedSoalIds(prev =>
            prev.includes(soalId)
                ? prev.filter(id => id !== soalId)
                : [...prev, soalId]
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!mapelId) {
            Swal.fire('Error', 'ID Mapel tidak ditemukan', 'error')
            return
        }

        if (selectedSoalIds.length === 0) {
            Swal.fire('Error', 'Pilih minimal 1 soal untuk ujian', 'warning')
            return
        }

        setLoading(true)

        try {
            const payload = {
                guru_id: guruId,
                mapel_id: mapelId,
                judul: formData.judul,
                deskripsi: formData.deskripsi,
                waktu_mulai: new Date(formData.waktu_mulai).toISOString(),
                waktu_selesai: new Date(formData.waktu_selesai).toISOString(),
                durasi_menit: parseInt(formData.durasi_menit),
                status: formData.status
            }

            let ujianId = ujian?.id

            if (ujian) {
                // Update existing
                const { error } = await supabase
                    .from('ujian')
                    .update(payload)
                    .eq('id', ujian.id)
                if (error) throw error

                // Delete old ujian_soal relations
                await supabase
                    .from('ujian_soal')
                    .delete()
                    .eq('ujian_id', ujian.id)
            } else {
                // Create new
                const { data: newUjian, error } = await supabase
                    .from('ujian')
                    .insert(payload)
                    .select()
                    .single()
                if (error) throw error
                ujianId = newUjian.id
            }

            // Insert ujian_soal relations
            const ujianSoalData = selectedSoalIds.map((soalId, index) => ({
                ujian_id: ujianId,
                soal_id: soalId,
                urutan: index + 1
            }))

            const { error: soalError } = await supabase
                .from('ujian_soal')
                .insert(ujianSoalData)

            if (soalError) throw soalError

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: `Ujian berhasil ${ujian ? 'diperbarui' : 'dibuat'}`,
                timer: 1500,
                showConfirmButton: false
            })
            onClose()

        } catch (error) {
            console.error('Error saving ujian:', error)
            Swal.fire('Error', error.message || 'Gagal menyimpan ujian', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto animate-fade-in-up">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                    <Cancel01Icon size={24} />
                </button>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {ujian ? 'Edit Ujian' : 'Buat Ujian Baru'}
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Detail Ujian */}
                <GlassCard className="p-8">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Detail Ujian</h3>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Judul Ujian
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Contoh: UTS Matematika Semester 1"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={formData.judul}
                                onChange={e => setFormData({ ...formData, judul: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Deskripsi (Opsional)
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Keterangan tambahan tentang ujian ini..."
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
                                value={formData.deskripsi}
                                onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Calendar02Icon size={16} className="inline mr-1" />
                                Waktu Mulai
                            </label>
                            <input
                                type="datetime-local"
                                required
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={formData.waktu_mulai}
                                onChange={e => setFormData({ ...formData, waktu_mulai: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Calendar02Icon size={16} className="inline mr-1" />
                                Waktu Selesai
                            </label>
                            <input
                                type="datetime-local"
                                required
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={formData.waktu_selesai}
                                onChange={e => setFormData({ ...formData, waktu_selesai: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Clock01Icon size={16} className="inline mr-1" />
                                Durasi Pengerjaan (Menit)
                            </label>
                            <input
                                type="number"
                                min="1"
                                required
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={formData.durasi_menit}
                                onChange={e => setFormData({ ...formData, durasi_menit: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Status
                            </label>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="draft">Draft</option>
                                <option value="aktif">Aktif</option>
                                <option value="selesai">Selesai</option>
                            </select>
                        </div>
                    </div>
                </GlassCard>

                {/* Pilih Soal */}
                <GlassCard className="p-8">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                        Pilih Soal ({selectedSoalIds.length} dipilih)
                    </h3>

                    {loadingSoal ? (
                        <div className="flex justify-center p-8">
                            <LoadingSpinner />
                        </div>
                    ) : availableSoal.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>Belum ada soal di Bank Soal. Buat soal terlebih dahulu.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3 max-h-96 overflow-y-auto pr-2">
                            {availableSoal.map((soal, index) => (
                                <div
                                    key={soal.id}
                                    onClick={() => toggleSoalSelection(soal.id)}
                                    className={`
                                        p-4 rounded-xl border-2 cursor-pointer transition-all
                                        ${selectedSoalIds.includes(soal.id)
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                        }
                                    `}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`
                                            w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                                            ${selectedSoalIds.includes(soal.id)
                                                ? 'border-purple-500 bg-purple-500'
                                                : 'border-gray-300'
                                            }
                                        `}>
                                            {selectedSoalIds.includes(soal.id) && (
                                                <CheckmarkCircle02Icon size={16} className="text-white" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-gray-500">No. {index + 1}</span>
                                                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                                    Bobot: {soal.bobot}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                                {soal.pertanyaan}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>

                <div className="flex gap-4">
                    <ActionButton
                        variant="primary"
                        type="submit"
                        icon={Bookmark02Icon}
                        loading={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                        Simpan Ujian
                    </ActionButton>
                </div>
            </form>
        </div>
    )
}

export default UjianForm
