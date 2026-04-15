import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import {
    Bookmark02Icon,
    Cancel01Icon,
    ImageAdd02Icon,
    Delete02Icon,
    CheckmarkCircle02Icon,
    Image01Icon,
} from 'hugeicons-react'
import ActionButton from '../../admin/shared/ActionButton'
import LoadingSpinner from '../../admin/shared/LoadingSpinner'
import Select from '../../ui/Select'
import Swal from 'sweetalert2'

const SoalForm = ({ soal, mapelId, kelasList = [], onClose }) => {
    // --- Cloudinary Config ---
    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        pertanyaan: '',
        tipe_soal: 'pilihan_ganda',
        kunci_jawaban: '',
        kelas_id: '',
        opsi_jawaban: [
            { label: 'A', text: '', image_url: null },
            { label: 'B', text: '', image_url: null },
            { label: 'C', text: '', image_url: null },
            { label: 'D', text: '', image_url: null },
            { label: 'E', text: '', image_url: null },
        ]
    })

    // --- State untuk gambar SOAL ---
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const fileInputRef = useRef(null)

    // --- State untuk gambar JAWABAN (per-opsi) ---
    // { A: File|null, B: File|null, C: File|null, D: File|null }
    const [optionImageFiles, setOptionImageFiles] = useState({})
    // { A: previewUrl|null, B: ... }
    const [optionImagePreviews, setOptionImagePreviews] = useState({})
    const optionFileRefs = useRef({ A: null, B: null, C: null, D: null, E: null })

    useEffect(() => {
        if (soal) {
            const opsi = soal.opsi_jawaban || [
                { label: 'A', text: '', image_url: null },
                { label: 'B', text: '', image_url: null },
                { label: 'C', text: '', image_url: null },
                { label: 'D', text: '', image_url: null },
                { label: 'E', text: '', image_url: null }
            ]
            setFormData({
                pertanyaan: soal.pertanyaan,
                tipe_soal: soal.tipe_soal || 'pilihan_ganda',
                kunci_jawaban: soal.kunci_jawaban,
                kelas_id: soal.kelas_id || '',
                opsi_jawaban: opsi.map(o => ({
                    label: o.label,
                    text: o.text || '',
                    image_url: o.image_url || null
                }))
            })
            if (soal.gambar_url) {
                setImagePreview(soal.gambar_url)
            }
            // Load existing option image previews
            const previews = {}
            opsi.forEach(o => {
                if (o.image_url) previews[o.label] = o.image_url
            })
            setOptionImagePreviews(previews)
        }
    }, [soal])

    // --- Handlers untuk gambar SOAL ---
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

    // --- Handlers untuk gambar JAWABAN ---
    const handleOptionImageChange = (label, e) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) {
            Swal.fire('Error', 'Ukuran gambar maksimal 2MB', 'error')
            return
        }
        setOptionImageFiles(prev => ({ ...prev, [label]: file }))
        setOptionImagePreviews(prev => ({ ...prev, [label]: URL.createObjectURL(file) }))
    }

    const removeOptionImage = (label) => {
        setOptionImageFiles(prev => {
            const next = { ...prev }
            delete next[label]
            return next
        })
        setOptionImagePreviews(prev => {
            const next = { ...prev }
            delete next[label]
            return next
        })
        // Also clear image_url in formData opsi_jawaban
        setFormData(prev => ({
            ...prev,
            opsi_jawaban: prev.opsi_jawaban.map(o =>
                o.label === label ? { ...o, image_url: null } : o
            )
        }))
        if (optionFileRefs.current[label]) optionFileRefs.current[label].value = ''
    }

    const handleOptionChange = (index, value) => {
        const newOptions = [...formData.opsi_jawaban]
        newOptions[index].text = value
        setFormData({ ...formData, opsi_jawaban: newOptions })
    }

    // --- Fungsi upload ke Cloudinary ---
    const uploadImageToCloudinary = async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("upload_preset", UPLOAD_PRESET);
        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                { method: "POST", body: fd }
            );
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return data.secure_url.replace('/upload/', '/upload/q_auto,f_auto,w_800/');
        } catch (error) {
            console.error("Upload error:", error);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!mapelId) {
            Swal.fire('Error', 'ID Mapel tidak ditemukan', 'error')
            return
        }

        if (formData.tipe_soal === 'pilihan_ganda' && !formData.kunci_jawaban) {
            Swal.fire('Error', 'Pilih kunci jawaban terlebih dahulu', 'warning')
            return
        }

        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            // Upload gambar SOAL
            let imageUrl = soal?.gambar_url || null
            if (imageFile) {
                try {
                    imageUrl = await uploadImageToCloudinary(imageFile);
                } catch (err) {
                    Swal.fire('Error', 'Gagal upload gambar soal: ' + err.message, 'error');
                    setLoading(false);
                    return;
                }
            } else if (imagePreview === null && soal?.gambar_url) {
                imageUrl = null
            }

            // Upload gambar JAWABAN (per opsi yang ada file baru)
            let finalOpsi = formData.opsi_jawaban
            if (formData.tipe_soal === 'pilihan_ganda') {
                const uploadedOpsi = await Promise.all(
                    formData.opsi_jawaban.map(async (opsi) => {
                        let opsiImageUrl = optionImagePreviews[opsi.label] && !optionImageFiles[opsi.label]
                            ? (soal?.opsi_jawaban?.find(o => o.label === opsi.label)?.image_url || null)
                            : null

                        if (optionImageFiles[opsi.label]) {
                            try {
                                opsiImageUrl = await uploadImageToCloudinary(optionImageFiles[opsi.label])
                            } catch (err) {
                                throw new Error(`Gagal upload gambar jawaban ${opsi.label}: ${err.message}`)
                            }
                        } else if (!optionImagePreviews[opsi.label]) {
                            // image was removed
                            opsiImageUrl = null
                        } else {
                            // keep existing url from soal data
                            opsiImageUrl = soal?.opsi_jawaban?.find(o => o.label === opsi.label)?.image_url || null
                        }

                        return { ...opsi, image_url: opsiImageUrl }
                    })
                )
                finalOpsi = uploadedOpsi
            }

            const payload = {
                guru_id: user.id,
                mapel_id: mapelId,
                pertanyaan: formData.pertanyaan,
                tipe_soal: formData.tipe_soal,
                opsi_jawaban: formData.tipe_soal === 'pilihan_ganda' ? finalOpsi : null,
                kunci_jawaban: formData.kunci_jawaban || null,
                kelas_id: formData.kelas_id ? parseInt(formData.kelas_id) : null,
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

            <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Pertanyaan & Gambar */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Kelas"
                                value={formData.kelas_id ? String(formData.kelas_id) : ''}
                                onChange={(val) => setFormData({ ...formData, kelas_id: val })}
                                placeholder="-- Pilih Kelas --"
                                variant="blue"
                                options={kelasList.map(k => ({ value: String(k.id), label: k.nama_kelas }))}
                            />
                            <Select
                                label="Tipe Soal"
                                value={formData.tipe_soal}
                                onChange={(val) => setFormData({ ...formData, tipe_soal: val, kunci_jawaban: '' })}
                                variant="blue"
                                options={[
                                    { value: 'pilihan_ganda', label: 'Pilihan Ganda' },
                                    { value: 'essay', label: 'Essay' }
                                ]}
                            />
                        </div>

                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Pertanyaan
                        </label>
                        <textarea
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                            placeholder="Tulis pertanyaan di sini... (opsional jika pakai gambar)"
                            value={formData.pertanyaan}
                            onChange={e => setFormData({ ...formData, pertanyaan: e.target.value })}
                        />

                        {/* Image Upload Area - SOAL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Gambar Soal <span className="text-gray-400 font-normal">(Opsional - untuk soal bergambar/rumus)</span>
                            </label>
                            <div className="border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
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
                                            alt="Preview Soal"
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
                                        className="cursor-pointer py-6 flex flex-col items-center gap-2 text-blue-400"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <ImageAdd02Icon size={32} />
                                        <span className="text-sm font-medium">Klik untuk upload gambar soal</span>
                                        <span className="text-xs text-gray-400">Max 2MB. JPG, PNG, GIF.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {formData.tipe_soal === 'pilihan_ganda' ? (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="flex items-center gap-3">
                                <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">Pilihan Jawaban</h3>
                                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">Klik huruf A-D untuk pilih kunci jawaban</span>
                            </div>

                            {/* Opsi Jawaban - full width dengan gambar */}
                            <div className="space-y-5">
                                {formData.opsi_jawaban.map((opsi, index) => (
                                    <div
                                        key={index}
                                        className={`
                                            rounded-xl border-2 transition-all
                                            ${formData.kunci_jawaban === opsi.label
                                                ? 'border-green-400 bg-green-50/50 dark:bg-green-900/10 shadow-md shadow-green-500/10'
                                                : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'
                                            }
                                        `}
                                    >
                                        <div className="flex items-start gap-3 p-3">
                                            {/* Label Button */}
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, kunci_jawaban: opsi.label })}
                                                className={`
                                                    min-w-[40px] h-10 flex items-center justify-center rounded-lg cursor-pointer transition-all font-bold border text-sm shrink-0 mt-0.5
                                                    ${formData.kunci_jawaban === opsi.label
                                                        ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30'
                                                        : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }
                                                `}
                                            >
                                                {formData.kunci_jawaban === opsi.label
                                                    ? <CheckmarkCircle02Icon size={18} />
                                                    : opsi.label
                                                }
                                            </button>

                                            {/* Text Input */}
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    placeholder={`Teks jawaban ${opsi.label} (opsional jika pakai gambar)`}
                                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                                    value={opsi.text}
                                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                                />
                                            </div>

                                            {/* Tombol Upload Gambar Jawaban */}
                                            <div className="shrink-0">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    ref={el => optionFileRefs.current[opsi.label] = el}
                                                    onChange={(e) => handleOptionImageChange(opsi.label, e)}
                                                />
                                                {optionImagePreviews[opsi.label] ? (
                                                    <div className="relative">
                                                        <img
                                                            src={optionImagePreviews[opsi.label]}
                                                            alt={`Gambar jawaban ${opsi.label}`}
                                                            className="h-10 w-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer"
                                                            onClick={() => optionFileRefs.current[opsi.label]?.click()}
                                                            title="Klik untuk ganti gambar"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeOptionImage(opsi.label)}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white p-0.5 rounded-full shadow hover:bg-red-600 transition-colors"
                                                        >
                                                            <Delete02Icon size={12} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => optionFileRefs.current[opsi.label]?.click()}
                                                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
                                                        title="Upload gambar untuk jawaban ini"
                                                    >
                                                        <Image01Icon size={16} />
                                                        <span>Gambar</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Preview gambar jawaban ukuran besar (jika ada) */}
                                        {optionImagePreviews[opsi.label] && (
                                            <div className="px-3 pb-3 pt-0">
                                                <div className="relative inline-block">
                                                    <img
                                                        src={optionImagePreviews[opsi.label]}
                                                        alt={`Preview jawaban ${opsi.label}`}
                                                        className="max-h-48 w-auto rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                        <button
                                                            type="button"
                                                            onClick={() => optionFileRefs.current[opsi.label]?.click()}
                                                            className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm"
                                                        >
                                                            Ganti Gambar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Kunci Jawaban */}
                            <div className="pt-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Kunci Jawaban
                                    </label>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                                        {formData.kunci_jawaban ? (
                                            <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-xl">
                                                <CheckmarkCircle02Icon size={24} />
                                                <span>Jawaban {formData.kunci_jawaban}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic text-sm">Klik huruf A-D di atas untuk memilih</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Essay Section */
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Kunci Jawaban / Pedoman Penilaian (Opsional)
                                </label>
                                <textarea
                                    rows={4}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                    placeholder="Tulis kunci jawaban atau pedoman penilaian untuk soal essay ini..."
                                    value={formData.kunci_jawaban}
                                    onChange={e => setFormData({ ...formData, kunci_jawaban: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Jawaban ini tidak ditampilkan ke siswa, hanya sebagai panduan penilaian.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            <Bookmark02Icon size={20} />
                            <span>{loading ? 'Menyimpan...' : 'Simpan Soal'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default SoalForm
