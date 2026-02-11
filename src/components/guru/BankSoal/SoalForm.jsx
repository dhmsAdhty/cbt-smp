import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import {
    Bookmark02Icon,
    Cancel01Icon,
    ImageAdd02Icon,
    Delete02Icon,
    CheckmarkCircle02Icon
} from 'hugeicons-react'
import GlassCard from '../../admin/shared/GlassCard'
import ActionButton from '../../admin/shared/ActionButton'
import LoadingSpinner from '../../admin/shared/LoadingSpinner'
import Swal from 'sweetalert2'

const SoalForm = ({ soal, mapelId, onClose }) => {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        pertanyaan: '',
        tipe_soal: 'pilihan_ganda',
        kunci_jawaban: '',
        bobot: 1,
        opsi_jawaban: [
            { label: 'A', text: '' },
            { label: 'B', text: '' },
            { label: 'C', text: '' },
            { label: 'D', text: '' },
            { label: 'E', text: '' }
        ]
    })
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (soal) {
            setFormData({
                pertanyaan: soal.pertanyaan,
                tipe_soal: soal.tipe_soal || 'pilihan_ganda',
                kunci_jawaban: soal.kunci_jawaban,
                bobot: soal.bobot || 1,
                opsi_jawaban: soal.opsi_jawaban || [
                    { label: 'A', text: '' },
                    { label: 'B', text: '' },
                    { label: 'C', text: '' },
                    { label: 'D', text: '' },
                    { label: 'E', text: '' }
                ]
            })
            if (soal.gambar_url) {
                setImagePreview(soal.gambar_url)
            }
        }
    }, [soal])

    const handleOptionChange = (index, value) => {
        const newOptions = [...formData.opsi_jawaban]
        newOptions[index].text = value
        setFormData({ ...formData, opsi_jawaban: newOptions })
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                Swal.fire('Error', 'Ukuran gambar maksimal 2MB', 'error')
                return
            }
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const removeImage = () => {
        setImageFile(null)
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!mapelId) {
            Swal.fire('Error', 'ID Mapel tidak ditemukan', 'error')
            return
        }

        if (!formData.kunci_jawaban) {
            Swal.fire('Error', 'Pilih kunci jawaban terlebih dahulu', 'warning')
            return
        }

        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            let imageUrl = soal?.gambar_url || null

            // Upload Image if selected
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop()
                const fileName = `${Date.now()}.${fileExt}`
                const filePath = `${user.id}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('soal-images')
                    .upload(filePath, imageFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('soal-images')
                    .getPublicUrl(filePath)

                imageUrl = publicUrl
            } else if (imagePreview === null && soal?.gambar_url) {
                // Logic to delete old image could be added here if needed
                imageUrl = null
            }

            const payload = {
                guru_id: user.id,
                mapel_id: mapelId,
                pertanyaan: formData.pertanyaan,
                tipe_soal: formData.tipe_soal,
                opsi_jawaban: formData.opsi_jawaban,
                kunci_jawaban: formData.kunci_jawaban,
                bobot: parseInt(formData.bobot),
                gambar_url: imageUrl
            }

            if (soal) {
                const { error } = await supabase
                    .from('bank_soal')
                    .update(payload)
                    .eq('id', soal.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('bank_soal')
                    .insert(payload)
                if (error) throw error
            }

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: `Soal berhasil ${soal ? 'diperbarui' : 'ditambahkan'}`,
                timer: 1500,
                showConfirmButton: false
            })
            onClose()

        } catch (error) {
            console.error('Error saving soal:', error)
            Swal.fire('Error', error.message || 'Gagal menyimpan soal', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                    <Cancel01Icon size={24} />
                </button>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {soal ? 'Edit Soal' : 'Tambah Soal Baru'}
                </h2>
            </div>

            <GlassCard className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Pertanyaan & Gambar */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Pertanyaan
                        </label>
                        <textarea
                            required
                            rows={4}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                            placeholder="Tulis pertanyaan di sini..."
                            value={formData.pertanyaan}
                            onChange={e => setFormData({ ...formData, pertanyaan: e.target.value })}
                        />

                        {/* Image Upload Area */}
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                            />

                            {imagePreview ? (
                                <div className="relative inline-block">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="max-h-64 rounded-lg shadow-md"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                    >
                                        <Delete02Icon size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className="cursor-pointer py-8 flex flex-col items-center gap-2 text-gray-500"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImageAdd02Icon size={32} />
                                    <span className="text-sm font-medium">Klik untuk upload gambar (Opsional)</span>
                                    <span className="text-xs text-gray-400">Max 2MB. JPG, PNG, GIF.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Opsi Jawaban */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Pilihan Jawaban
                            </label>
                            {formData.opsi_jawaban.map((opsi, index) => (
                                <div key={index} className="flex gap-3 items-center">
                                    <div
                                        onClick={() => setFormData({ ...formData, kunci_jawaban: opsi.label })}
                                        className={`
                                            w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer transition-all font-bold border
                                            ${formData.kunci_jawaban === opsi.label
                                                ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30'
                                                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                                            }
                                        `}
                                    >
                                        {opsi.label}
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        placeholder={`Jawaban ${opsi.label}`}
                                        className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        value={opsi.text}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Settings */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Kunci Jawaban
                                </label>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                                    {formData.kunci_jawaban ? (
                                        <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-xl">
                                            <CheckmarkCircle02Icon size={24} />
                                            <span>{formData.kunci_jawaban}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic">Klik huruf A-E di samping untuk memilih</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Bobot Soal
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={formData.bobot}
                                    onChange={(e) => setFormData({ ...formData, bobot: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Nilai poin untuk soal ini jika benar.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <ActionButton
                            variant="primary"
                            type="submit"
                            icon={Bookmark02Icon}
                            loading={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            Simpan Soal
                        </ActionButton>
                    </div>
                </form>
            </GlassCard>
        </div>
    )
}

export default SoalForm
