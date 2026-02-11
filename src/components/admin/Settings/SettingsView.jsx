import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import Swal from 'sweetalert2'
import GlassCard from '../shared/GlassCard'
import LoadingSpinner from '../shared/LoadingSpinner'
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
    InformationCircleIcon
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
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setIsVisible(true)
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
                    confirmButtonColor: '#f97316',
                    background: '#1a1a1a',
                    color: '#fff',
                    iconColor: '#f97316'
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
                    <div style="margin: 20px 0;">
                        <p style="color: #fff; margin-bottom: 10px;">Perubahan profil berhasil disimpan</p>
                        <p style="color: #f97316; font-size: 14px;">${formData.password ? 'Password telah diperbarui' : ''}</p>
                    </div>
                `,
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
                background: '#1a1a1a',
                color: '#fff',
                iconColor: '#f97316'
            })

            await fetchUserData()
            setFormData({ ...formData, password: '', confirmPassword: '' })
            setIsEditing(false)
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: '❌ Error',
                text: error.message,
                confirmButtonColor: '#f97316',
                background: '#1a1a1a',
                color: '#fff',
                iconColor: '#f97316'
            })
        } finally {
            setLoading(false)
        }
    }

    const getRoleBadge = (role) => {
        const badges = {
            admin: {
                bg: 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 dark:from-purple-500/30 dark:to-purple-600/30',
                text: 'text-purple-700 dark:text-purple-400',
                border: 'border-purple-500/30',
                icon: <ShieldKeyIcon size={14} className="text-purple-600 dark:text-purple-400" />
            },
            guru: {
                bg: 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 dark:from-orange-500/30 dark:to-orange-600/30',
                text: 'text-orange-700 dark:text-orange-400',
                border: 'border-orange-500/30',
                icon: <School01Icon size={14} className="text-orange-600 dark:text-orange-400" />
            },
            siswa: {
                bg: 'bg-gradient-to-r from-green-500/20 to-green-600/20 dark:from-green-500/30 dark:to-green-600/30',
                text: 'text-green-700 dark:text-green-400',
                border: 'border-green-500/30',
                icon: <UserAccountIcon size={14} className="text-green-600 dark:text-green-400" />
            }
        }
        return badges[role] || badges.siswa
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getInitials = (name) => {
        if (!name) return 'U'
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    }

    if (isFetching) {
        return <LoadingSpinner />
    }

    return (
        <div className={`
            space-y-8 transition-all duration-700
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
        `}>
            {/* Header Section */}
            <GlassCard className="relative overflow-hidden bg-white dark:bg-gray-800">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-8">
                    {/* Avatar */}
                    <div className="flex items-center gap-6 p-5">
                        <div className="relative w-28 h-28 rounded-full bg-orange-500 flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white dark:border-gray-800">
                            {getInitials(userData.nama)}
                        </div>
                    </div>

                    <div className="flex-1 p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white">
                                {userData.nama || 'Loading...'}
                            </h1>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 transition-all duration-300 transform hover:scale-110 hover:-translate-y-0.5"
                                >
                                    <Edit02Icon size={18} />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600">
                                <Mail01Icon size={14} className="text-orange-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{userData.email}</span>
                            </div>

                            {userData.role && (
                                <div className={`
                                    flex items-center gap-1.5 px-3 py-1.5 rounded-full border
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
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="p-5 flex lg:flex-col gap-3 lg:ml-auto border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-700">
                    <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Role Status</p>
                        <p className="font-bold text-orange-600 dark:text-orange-400 capitalize">{userData.role}</p>
                    </div>
                    {userData.kelas && (
                        <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Kelas</p>
                            <p className="font-bold text-blue-600 dark:text-blue-400">{userData.kelas}</p>
                        </div>
                    )}
                    {userData.mapel && (
                        <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Mapel</p>
                            <p className="font-bold text-green-600 dark:text-green-400">{userData.mapel}</p>
                        </div>
                    )}
                </div>
            </GlassCard>

            {/* Profile Section */}
            <div className="space-y-6">
                {/* Profile Information Card */}
                <GlassCard className="p-8 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-orange-500 text-white">
                                <User02Icon size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                    Informasi Profil
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Kelola informasi pribadi Anda
                                </p>
                            </div>
                        </div>

                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="group relative px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-all duration-300 transform hover:-translate-y-0.5 overflow-hidden"
                            >
                                <div className="relative flex items-center gap-2">
                                    <Edit02Icon size={18} />
                                    <span>Edit Profil</span>
                                </div>
                            </button>
                        )}
                    </div>

                    {!isEditing ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {[
                                { icon: User02Icon, label: 'Nama Lengkap', value: userData.nama, color: 'orange' },
                                { icon: Mail01Icon, label: 'Email', value: userData.email, color: 'blue' },
                                { icon: UserAccountIcon, label: 'Role', value: userData.role, color: 'purple', badge: true },
                                { icon: LockPasswordIcon, label: 'Password', value: '••••••••', color: 'red' },
                                ...(userData.kelas ? [{ icon: School01Icon, label: 'Kelas', value: userData.kelas, color: 'green' }] : []),
                                ...(userData.mapel ? [{ icon: BookOpen02Icon, label: 'Mata Pelajaran', value: userData.mapel, color: 'emerald' }] : [])
                            ].map((item, index) => {
                                const Icon = item.icon
                                const colors = {
                                    orange: 'bg-orange-50 text-orange-600 border-orange-100',
                                    blue: 'bg-blue-50 text-blue-600 border-blue-100',
                                    purple: 'bg-purple-50 text-purple-600 border-purple-100',
                                    red: 'bg-red-50 text-red-600 border-red-100',
                                    green: 'bg-green-50 text-green-600 border-green-100',
                                    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }

                                return (
                                    <div
                                        key={index}
                                        className="group p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all duration-300"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-lg border ${colors[item.color].split(' ')[2]} ${colors[item.color].split(' ')[0]}`}>
                                                <Icon className={`w-5 h-5 ${colors[item.color].split(' ')[1]}`} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    {item.label}
                                                </p>
                                                {item.badge ? (
                                                    <span className={`
                                                        inline-block mt-1.5 px-3 py-1.5 rounded-full text-sm font-semibold
                                                        ${getRoleBadge(item.value).bg}
                                                        ${getRoleBadge(item.value).text}
                                                        border ${getRoleBadge(item.value).border}
                                                    `}>
                                                        {item.value?.toUpperCase()}
                                                    </span>
                                                ) : (
                                                    <p className="text-lg font-semibold text-gray-800 dark:text-white mt-1">
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
                                        <User02Icon className="w-4 h-4 text-orange-500" />
                                        Nama Lengkap
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        <Mail01Icon className="w-4 h-4 text-orange-500" />
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <LockPasswordIcon className="w-4 h-4 text-orange-500" />
                                    Password Baru
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                                        placeholder="Kosongkan jika tidak ingin mengubah"
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <LockPasswordIcon className="w-4 h-4 text-orange-500" />
                                    Konfirmasi Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                                        placeholder="Konfirmasi password baru"
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                                    >
                                        {showConfirmPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 relative group px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                                >
                                    <div className="relative flex items-center justify-center gap-2">
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Menyimpan...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckmarkCircle02Icon size={20} />
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
                                    className="flex-1 px-6 py-3.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-0.5 border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Cancel01Icon size={20} />
                                        <span>Batal</span>
                                    </div>
                                </button>
                            </div>
                        </form>
                    )}
                </GlassCard>

                {/* Security Tips Card */}
                <GlassCard className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-lg bg-orange-500 text-white">
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
                                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                        {tip}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}

export default SettingsView