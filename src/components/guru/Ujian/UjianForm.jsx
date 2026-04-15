import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import {
    Bookmark02Icon,
    Cancel01Icon,
    Calendar02Icon,
    Clock01Icon,
    CheckmarkCircle02Icon,
    Search01Icon,
    FilterHorizontalIcon,
    ViewOffSlashIcon
} from 'hugeicons-react'
import LoadingSpinner from '../../admin/shared/LoadingSpinner'
import Select from '../../ui/Select'
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
                .select('id, pertanyaan, tipe_soal')
                .eq('mapel_id', mapelId)
                .is('deleted_at', null)
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

    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all') // all, pilihan_ganda, essay

    const toggleSoalSelection = (soalId) => {
        setSelectedSoalIds(prev =>
            prev.includes(soalId)
                ? prev.filter(id => id !== soalId)
                : [...prev, soalId]
        )
    }

    const filteredSoal = availableSoal.filter(soal => {
        const matchesSearch = soal.pertanyaan.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = filterType === 'all' || soal.tipe_soal === filterType
        return matchesSearch && matchesType
    })

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = filteredSoal.map(s => s.id)
            // Combine existing selected with new ones to avoid duplicates, or just replace?
            // Usually "Select All" selects visible items.
            // Let's merge unique IDs.
            const newSelected = [...new Set([...selectedSoalIds, ...allIds])]
            setSelectedSoalIds(newSelected)
        } else {
            // Unselect currently visible filtered items
            const visibleIds = filteredSoal.map(s => s.id)
            setSelectedSoalIds(prev => prev.filter(id => !visibleIds.includes(id)))
        }
    }

    const isAllSelected = filteredSoal.length > 0 && filteredSoal.every(s => selectedSoalIds.includes(s.id))

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

        if (new Date(formData.waktu_selesai) <= new Date(formData.waktu_mulai)) {
            Swal.fire('Error', 'Waktu selesai harus setelah waktu mulai', 'warning')
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
                <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Bookmark02Icon size={18} className="text-blue-600" />
                        </span>
                        Detail Ujian
                    </h3>

                    <div className="space-y-6">
                        <div>
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Deskripsi (Opsional)
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Keterangan tambahan tentang ujian ini..."
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                value={formData.deskripsi}
                                onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Jadwal Ujian */}
                <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Calendar02Icon size={18} className="text-blue-600" />
                        </span>
                        Jadwal Ujian
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Waktu Mulai */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Waktu Mulai
                            </label>
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-l-xl flex items-center justify-center border-r border-gray-200 dark:border-gray-700">
                                    <Calendar02Icon size={18} className="text-blue-600" />
                                </div>
                                <input
                                    type="datetime-local"
                                    required
                                    lang="en-GB"
                                    className="w-full pl-16 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                                    value={formData.waktu_mulai}
                                    onChange={e => setFormData({ ...formData, waktu_mulai: e.target.value })}
                                />
                            </div>
                            {formData.waktu_mulai && (
                                <p className="mt-1.5 text-xs text-gray-400">
                                    {new Date(formData.waktu_mulai).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} WIB
                                </p>
                            )}
                        </div>

                        {/* Waktu Selesai */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Waktu Selesai
                            </label>
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-12 bg-red-50 dark:bg-red-900/20 rounded-l-xl flex items-center justify-center border-r border-gray-200 dark:border-gray-700">
                                    <Calendar02Icon size={18} className="text-red-500" />
                                </div>
                                <input
                                    type="datetime-local"
                                    required
                                    lang="en-GB"
                                    className="w-full pl-16 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                                    value={formData.waktu_selesai}
                                    min={formData.waktu_mulai || undefined}
                                    onChange={e => setFormData({ ...formData, waktu_selesai: e.target.value })}
                                />
                            </div>
                            {formData.waktu_selesai && (
                                <p className="mt-1.5 text-xs text-gray-400">
                                    {new Date(formData.waktu_selesai).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} WIB
                                </p>
                            )}
                            {formData.waktu_mulai && formData.waktu_selesai && new Date(formData.waktu_selesai) <= new Date(formData.waktu_mulai) && (
                                <p className="mt-1.5 text-xs text-red-500 font-medium">⚠ Waktu selesai harus setelah waktu mulai</p>
                            )}
                        </div>

                        {/* Durasi */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Durasi Pengerjaan (Menit)
                            </label>
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-l-xl flex items-center justify-center border-r border-gray-200 dark:border-gray-700">
                                    <Clock01Icon size={18} className="text-blue-600" />
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    className="w-full pl-16 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                                    value={formData.durasi_menit}
                                    onChange={e => setFormData({ ...formData, durasi_menit: e.target.value })}
                                />
                            </div>
                            <p className="mt-1.5 text-xs text-gray-400">
                                Waktu maksimal siswa mengerjakan ujian
                            </p>
                        </div>

                        {/* Status */}
                        <div>
                            <Select
                                label="Status Ujian"
                                value={formData.status}
                                onChange={(val) => setFormData({ ...formData, status: val })}
                                variant="blue"
                                options={[
                                    { value: 'draft', label: 'Draft' },
                                    { value: 'aktif', label: 'Aktif' },
                                    { value: 'selesai', label: 'Selesai' }
                                ]}
                            />
                            <div className={`mt-2 p-3 rounded-lg text-xs ${formData.status === 'draft'
                                ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : formData.status === 'aktif'
                                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                }`}>
                                {formData.status === 'draft' && 'Ujian belum dipublish. Siswa tidak bisa melihat atau mengerjakan ujian ini.'}
                                {formData.status === 'aktif' && 'Ujian aktif dan bisa dikerjakan siswa sesuai jadwal waktu mulai & selesai.'}
                                {formData.status === 'selesai' && 'Ujian ditutup. Siswa tidak bisa lagi mengerjakan ujian ini.'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pilih Soal */}
                <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                            Pilih Soal ({selectedSoalIds.length} dipilih)
                        </h3>

                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Search */}
                            <div className="relative">
                                <Search01Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari soal..."
                                    className="pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-64"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Filter Status */}
                            <div className="w-48 text-sm">
                                <Select
                                    value={filterType}
                                    onChange={setFilterType}
                                    variant="blue"
                                    options={[
                                        { value: 'all', label: 'Semua Tipe' },
                                        { value: 'pilihan_ganda', label: 'Pilihan Ganda' },
                                        { value: 'essay', label: 'Essay' }
                                    ]}
                                    className="!mt-0"
                                />
                            </div>
                        </div>
                    </div>

                    {loadingSoal ? (
                        <div className="flex justify-center p-8">
                            <LoadingSpinner color="blue" />
                        </div>
                    ) : availableSoal.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>Belum ada soal di Bank Soal. Buat soal terlebih dahulu.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Select All Checkbox - Only show if there are filtered results */}
                            {filteredSoal.length > 0 && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"
                                        id="select-all"
                                    />
                                    <label htmlFor="select-all" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                        Pilih Semua ({filteredSoal.length} soal ditampilkan)
                                    </label>
                                </div>
                            )}

                            {/* Soal List */}
                            <div className="grid gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                {filteredSoal.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                                        <ViewOffSlashIcon size={32} className="mx-auto text-gray-400 mb-2" />
                                        <p className="text-gray-500">Tidak ada soal yang cocok dengan pencarian.</p>
                                    </div>
                                ) : (
                                    filteredSoal.map((soal, index) => (
                                        <div
                                            key={soal.id}
                                            onClick={() => toggleSoalSelection(soal.id)}
                                            className={`
                                                relative p-4 pl-12 rounded-xl border-2 cursor-pointer transition-all group
                                                ${selectedSoalIds.includes(soal.id)
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 bg-white dark:bg-gray-900'
                                                }
                                            `}
                                        >
                                            {/* Checkbox absolute position */}
                                            <div className="absolute left-4 top-4.5">
                                                <div className={`
                                                    w-5 h-5 rounded border flex items-center justify-center transition-colors
                                                    ${selectedSoalIds.includes(soal.id)
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 group-hover:border-blue-400'
                                                    }
                                                `}>
                                                    {selectedSoalIds.includes(soal.id) && <CheckmarkCircle02Icon size={14} className="text-white" />}
                                                </div>
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-xs font-bold text-gray-500">
                                                        {soal.tipe_soal === 'pilihan_ganda' ? 'PG' : 'Essay'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                                                    {soal.pertanyaan}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        <Bookmark02Icon size={20} />
                        <span>{loading ? 'Menyimpan...' : 'Simpan Ujian'}</span>
                    </button>
                </div>
            </form>
        </div>
    )
}

export default UjianForm

