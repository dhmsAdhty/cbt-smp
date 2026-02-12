import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../../lib/supabaseClient'
import Swal from 'sweetalert2'
import {
    UserCircleIcon,
    Mail01Icon,
    LockKeyIcon,
    FloppyDiskIcon,
    HierarchySquare02Icon
} from 'hugeicons-react'

export default function ProfileView() {
    const [loading, setLoading] = useState(false)
    const [studentData, setStudentData] = useState({
        nama: '',
        email: '',
        kelas: '',
        role: ''
    })
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    })

    useEffect(() => {
        fetchStudentProfile()
    }, [])

    const fetchStudentProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch student data from users table
            const { data, error } = await supabase
                .from('users')
                .select('nama, email, kelas, role')
                .eq('id', user.id)
                .single()

            if (error) throw error

            if (data) {
                setStudentData({
                    nama: data.nama || '',
                    email: data.email || '',
                    kelas: data.kelas || '-',
                    role: data.role || ''
                })
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
            Swal.fire('Error', 'Gagal memuat data profil', 'error')
        }
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.newPassword) {
            Swal.fire('Info', 'Tidak ada perubahan yang disimpan', 'info')
            return
        }

        if (formData.newPassword !== formData.confirmPassword) {
            Swal.fire('Error', 'Password baru tidak cocok', 'error')
            return
        }

        if (formData.newPassword.length < 6) {
            Swal.fire('Error', 'Password minimal 6 karakter', 'error')
            return
        }

        setLoading(true)
        try {
            // Update password in Supabase auth
            const { error } = await supabase.auth.updateUser({
                password: formData.newPassword
            })

            if (error) throw error

            Swal.fire('Sukses', 'Password berhasil diperbarui', 'success')
            setFormData({ newPassword: '', confirmPassword: '' })
        } catch (error) {
            console.error('Error updating password:', error)
            Swal.fire('Error', 'Gagal memperbarui password', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                        <UserCircleIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Profil Saya</h2>
                        <p className="text-gray-600">Informasi data diri dan akun Anda</p>
                    </div>
                </div>
            </div>

            {/* Data Diri */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Diri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                        <div className="relative">
                            <UserCircleIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={studentData.nama}
                                disabled
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Kelas</label>
                        <div className="relative">
                            <HierarchySquare02Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={studentData.kelas}
                                disabled
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <div className="relative">
                            <Mail01Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="email"
                                value={studentData.email}
                                disabled
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 outline-none"
                            />
                        </div>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">Data diri tidak dapat diubah. Hubungi admin untuk perubahan data.</p>
            </div>

            {/* Ganti Password */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ganti Password</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Password Baru</label>
                            <div className="relative">
                                <LockKeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    placeholder="Minimal 6 karakter"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Konfirmasi Password</label>
                            <div className="relative">
                                <LockKeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    placeholder="Ulangi password baru"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <FloppyDiskIcon className="w-5 h-5" />
                            )}
                            Simpan Password Baru
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    )
}
