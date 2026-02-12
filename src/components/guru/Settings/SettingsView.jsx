import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../../lib/supabaseClient'
import Swal from 'sweetalert2'
import LoadingSpinner from '../../admin/shared/LoadingSpinner'
import {
    User02Icon,
    Mail01Icon,
    LockPasswordIcon,
    UserAccountIcon,
    ShieldKeyIcon,
    School01Icon,
    BookOpen02Icon,
    Edit02Icon,
    CheckmarkCircle02Icon,
    Cancel01Icon,
    InformationCircleIcon,
    ViewOffSlashIcon
} from 'hugeicons-react'

const SettingsView = () => {
    const [userData, setUserData] = useState({
        nama: '',
        email: '',
        role: '',
        kelas: '',
        mapel: '',
        avatar_url: '',
        created_at: '',
        last_sign_in: ''
    })
    const [formData, setFormData] = useState({
        nama: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [activeTab, setActiveTab] = useState('profile')

    useEffect(() => {
        fetchUserData()
    }, [])

    const fetchUserData = async () => {
        setIsFetching(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (data) {
                    setUserData({
                        ...data,
                        last_sign_in: user.last_sign_in_at || new Date().toISOString(),
                        created_at: user.created_at || new Date().toISOString()
                    })
                    setFormData({
                        nama: data.nama,
                        email: data.email,
                        password: '',
                        confirmPassword: ''
                    })
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error)
        } finally {
            setIsFetching(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User tidak ditemukan')

            // Validasi password
            if (formData.password || formData.confirmPassword) {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error('Password tidak cocok!')
                }
                if (formData.password.length < 6) {
                    throw new Error('Password minimal 6 karakter')
                }
            }

            // Update auth email if changed
            if (formData.email !== userData.email) {
                const { error: emailError } = await supabase.auth.updateUser({
                    email: formData.email
                })
                if (emailError) throw emailError

                Swal.fire({
                    icon: 'info',
                    title: 'Verifikasi Email',
                    text: 'Email verifikasi telah dikirim ke alamat email baru Anda.',
                    confirmButtonColor: '#3b82f6',
                    iconColor: '#3b82f6'
                })
            }

            // Update password if provided
            if (formData.password) {
                const { error: passwordError } = await supabase.auth.updateUser({
                    password: formData.password
                })
                if (passwordError) throw passwordError
            }

            // Update users table
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    nama: formData.nama,
                    email: formData.email
                })
                .eq('id', user.id)

            if (updateError) throw updateError

            Swal.fire({
                icon: 'success',
                title: 'Profil Diperbarui!',
                html: `
                    <div style="margin: 10px 0;">
                        <p style="margin-bottom: 5px;">Perubahan profil berhasil disimpan</p>
                        <p style="color: #3b82f6; font-size: 14px;">${formData.password ? 'Password telah diperbarui' : ''}</p>
                    </div>
                `,
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
                iconColor: '#3b82f6'
            })

            await fetchUserData()
            setFormData({ ...formData, password: '', confirmPassword: '' })
            setIsEditing(false)
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: '❌ Error',
                text: error.message,
                confirmButtonColor: '#ef4444',
                iconColor: '#ef4444'
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchSecuritySettings = async () => {
        try {
            const { data, error } = await supabase
                .from('security_settings')
                .select('*')
                .eq('id', '00000000-0000-0000-0000-000000000001')
                .single()

            if (error) throw error

            if (data) {
                setSecuritySettings({
                    enable_copy_paste_block: data.enable_copy_paste_block,
                    enable_tab_switch_tracking: data.enable_tab_switch_tracking,
                    max_tab_switches: data.max_tab_switches,
                    enable_auto_submit: data.enable_auto_submit,
                    show_security_rules_popup: data.show_security_rules_popup,
                    enable_fullscreen_mode: data.enable_fullscreen_mode,
                    enable_right_click_block: data.enable_right_click_block
                })
            }
        } catch (error) {
            console.error('Error fetching security settings:', error)
        }
    }

    const handleSecuritySave = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            console.log('💾 Menyimpan settings:', securitySettings)

            const { data, error } = await supabase
                .from('security_settings')
                .update({
                    enable_copy_paste_block: securitySettings.enable_copy_paste_block,
                    enable_tab_switch_tracking: securitySettings.enable_tab_switch_tracking,
                    max_tab_switches: securitySettings.max_tab_switches,
                    enable_auto_submit: securitySettings.enable_auto_submit,
                    show_security_rules_popup: securitySettings.show_security_rules_popup,
                    enable_fullscreen_mode: securitySettings.enable_fullscreen_mode,
                    enable_right_click_block: securitySettings.enable_right_click_block
                })
                .eq('id', '00000000-0000-0000-0000-000000000001')
                .select()

            if (error) {
                console.error('❌ Error saat menyimpan:', error)
                throw error
            }

            console.log('✅ Berhasil disimpan ke database:', data)

            Swal.fire({
                icon: 'success',
                title: '✅ Pengaturan Disimpan!',
                text: 'Konfigurasi keamanan ujian berhasil diperbarui',
                showConfirmButton: false,
                timer: 1500,
                iconColor: '#3b82f6'
            })
        } catch (error) {
            console.error('❌ Error lengkap:', error)
            Swal.fire({
                icon: 'error',
                title: '❌ Gagal Menyimpan',
                html: `
                    <p style="margin-bottom: 8px;">Terjadi kesalahan saat menyimpan pengaturan</p>
                    <p style="font-size: 12px; color: #666;">${error.message}</p>
                `,
                confirmButtonColor: '#ef4444'
            })
        } finally {
            setLoading(false)
        }
    }

    const getRoleBadge = (role) => {
        const badges = {
            admin: {
                bg: 'bg-purple-50 dark:bg-purple-900/30',
                text: 'text-purple-700 dark:text-purple-400',
                border: 'border-purple-200 dark:border-purple-800',
                icon: <ShieldKeyIcon size={14} className="text-purple-600 dark:text-purple-400" />
            },
            guru: {
                bg: 'bg-blue-50 dark:bg-blue-900/30',
                text: 'text-blue-700 dark:text-blue-400',
                border: 'border-blue-200 dark:border-blue-800',
                icon: <School01Icon size={14} className="text-blue-600 dark:text-blue-400" />
            },
            siswa: {
                bg: 'bg-green-50 dark:bg-green-900/30',
                text: 'text-green-700 dark:text-green-400',
                border: 'border-green-200 dark:border-green-800',
                icon: <UserAccountIcon size={14} className="text-green-600 dark:text-green-400" />
            }
        }
        return badges[role] || badges.siswa
    }

    const getInitials = (name) => {
        if (!name) return 'U'
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    }

    if (isFetching) {
        return <LoadingSpinner color="blue" />
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/30 border-4 border-blue-50 dark:border-blue-900/30">
                            {getInitials(userData.nama)}
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
                                {userData.nama || 'Loading...'}
                            </h1>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 transition-colors"
                                >
                                    <Edit02Icon size={18} />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                                <Mail01Icon size={14} className="text-gray-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">{userData.email}</span>
                            </div>

                            {userData.role && (
                                <div className={`
                                    flex items-center gap-1.5 px-3 py-1 rounded-full border
                                    ${getRoleBadge(userData.role).bg} 
                                    ${getRoleBadge(userData.role).border}
                                `}>
                                    {getRoleBadge(userData.role).icon}
                                    <span className={`text-sm font-semibold ${getRoleBadge(userData.role).text}`}>
                                        {userData.role.toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Stats Row */}
                        <div className="flex flex-wrap gap-4">
                            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-gray-500 mb-0.5">Role Status</p>
                                <p className="font-semibold text-blue-600 dark:text-blue-400 capitalize">{userData.role}</p>
                            </div>
                            {userData.kelas && (
                                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                    <p className="text-xs text-gray-500 mb-0.5">Kelas</p>
                                    <p className="font-semibold text-green-600 dark:text-green-400">{userData.kelas}</p>
                                </div>
                            )}
                            {userData.mapel && (
                                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                    <p className="text-xs text-gray-500 mb-0.5">Mapel</p>
                                    <p className="font-semibold text-purple-600 dark:text-purple-400">{userData.mapel}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="space-y-6">
                {/* Profile Information Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                                Informasi Profil
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Kelola informasi pribadi Anda
                            </p>
                        </div>

                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all duration-300 flex items-center gap-2 text-sm"
                            >
                                <Edit02Icon size={16} />
                                <span>Edit Profil</span>
                            </button>
                        )}
                    </div>

                    {!isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { icon: User02Icon, label: 'Nama Lengkap', value: userData.nama, color: 'blue' },
                                { icon: Mail01Icon, label: 'Email', value: userData.email, color: 'indigo' },
                                { icon: UserAccountIcon, label: 'Role', value: userData.role, color: 'purple', badge: true },
                                { icon: LockPasswordIcon, label: 'Password', value: '••••••••', color: 'gray' },
                                ...(userData.kelas ? [{ icon: School01Icon, label: 'Kelas', value: userData.kelas, color: 'green' }] : []),
                                ...(userData.mapel ? [{ icon: BookOpen02Icon, label: 'Mata Pelajaran', value: userData.mapel, color: 'emerald' }] : [])
                            ].map((item, index) => {
                                const Icon = item.icon
                                const colors = {
                                    blue: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
                                    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
                                    purple: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
                                    gray: 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
                                    green: 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
                                    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                }

                                return (
                                    <div
                                        key={index}
                                        className="group p-5 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-2.5 rounded-lg border ${colors[item.color]}`}>
                                                <Icon size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">
                                                    {item.label}
                                                </p>
                                                {item.badge ? (
                                                    <span className={`
                                                    inline-block px-2.5 py-1 rounded-md text-sm font-semibold
                                                    ${getRoleBadge(item.value).bg}
                                                    ${getRoleBadge(item.value).text}
                                                `}>
                                                        {item.value?.toUpperCase()}
                                                    </span>
                                                ) : (
                                                    <p className="text-base font-semibold text-gray-800 dark:text-white">
                                                        {item.value || '-'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Nama Lengkap
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Password Baru
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                        placeholder="Kosongkan jika tidak ingin mengubah"
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                                    >
                                        {showPassword ? <ViewOffSlashIcon size={18} /> : <div className="text-xs font-bold">Show</div>}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Konfirmasi Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                        placeholder="Konfirmasi password baru"
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                                    >
                                        {showConfirmPassword ? <ViewOffSlashIcon size={18} /> : <div className="text-xs font-bold">Show</div>}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        {loading ? (
                                            <LoadingSpinner color="white" size="xs" />
                                        ) : (
                                            <>
                                                <CheckmarkCircle02Icon size={18} />
                                                <span>Simpan Perubahan</span>
                                            </>
                                        )}
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false)
                                        setFormData({
                                            nama: userData.nama,
                                            email: userData.email,
                                            password: '',
                                            confirmPassword: ''
                                        })
                                    }}
                                    className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-300 border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Cancel01Icon size={18} />
                                        <span>Batal</span>
                                    </div>
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Security Tips Card */}
                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <InformationCircleIcon size={20} />
                        </div>

                        <div className="flex-1">
                            <h4 className="font-bold text-gray-800 dark:text-white mb-2">
                                Tips Keamanan Akun
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    'Gunakan password yang kuat dan unik',
                                    'Perubahan email akan memerlukan verifikasi',
                                    'Jangan bagikan password ke siapapun',
                                    'Ganti password secara berkala',
                                ].map((tip, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                        {tip}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default SettingsView
