import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import DotGrid from '../components/ui/DotGrid'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        setIsVisible(true)
    }, [])

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)

        const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (authError) {
            Swal.fire({
                icon: 'error',
                title: 'Login Gagal',
                text: 'Email atau Password salah!',
                confirmButtonColor: '#f97316',
                background: '#1a1a1a',
                color: '#fff',
                iconColor: '#f97316',
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false
            })
            setLoading(false)
            return
        }


        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role, nama')
            .eq('id', user.id)
            .single()


        if (profileError || !profile) {
            Swal.fire({
                icon: 'warning',
                title: 'Data Tidak Ditemukan',
                text: 'Akun Anda belum terdaftar di database sistem.',
                confirmButtonColor: '#f97316',
                background: '#1a1a1a',
                color: '#fff',
                iconColor: '#f97316',
            })
            await supabase.auth.signOut()
            setLoading(false)
            return
        }

        Swal.fire({
            icon: 'success',
            title: `Selamat Datang, ${profile.nama}!`,
            text: 'Anda akan dialihkan ke dashboard',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
            background: '#1a1a1a',
            color: '#fff',
            iconColor: '#f97316',
        }).then(() => {
            if (profile.role === 'admin') navigate('/dashboard/admin')
            else if (profile.role === 'guru') navigate('/dashboard/guru')
            else if (profile.role === 'siswa') navigate('/dashboard/siswa')
        })

        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 relative overflow-hidden">
            {/* Animated DotGrid Background */}
            <div className="absolute inset-0 z-0 opacity-50">
                <DotGrid
                    dotSize={2.5}
                    gap={15}
                    baseColor="#fdba74"
                    activeColor="#c2410c"
                    proximity={100}
                    shockRadius={150}
                    shockStrength={3}
                    resistance={750}
                    returnDuration={1.5}
                />
            </div>

            <div className={`
                relative z-10 w-full max-w-md transform transition-all duration-700 ease-out
                ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
            `}>
                {/* Premium Card */}
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-orange-100/50 dark:border-orange-800/30">

                    {/* Logo & Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-35 h-35 transform hover:scale-105 transition-transform duration-300">
                            <img
                                src="/ATSLogo -trans.png"
                                alt="Logo SMP Tahfidz Al Hikmah"
                                className="w-35 h-35 object-contain"
                            />
                        </div>

                        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent mb-2">
                            SMP Tahidz Al Hikmah
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                            <span className="w-1 h-1 bg-orange-500 rounded-full"></span>
                            Silakan masuk ke akun Anda
                            <span className="w-1 h-1 bg-orange-500 rounded-full"></span>
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email Field */}
                        <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Alamat Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-orange-500 group-focus-within:text-orange-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12H8m12 0a4 4 0 01-4 4H8a4 4 0 01-4-4V8a4 4 0 014-4h8a4 4 0 014 4v4z" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-500 placeholder-gray-400 text-gray-900 dark:text-white transition-all duration-200"
                                    placeholder="admin@sekolah.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-orange-500 group-focus-within:text-orange-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="block w-full pl-10 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-500 placeholder-gray-400 text-gray-900 dark:text-white transition-all duration-200"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <svg className="h-5 w-5 text-gray-400 hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {showPassword ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="relative w-full group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl opacity-100 group-hover:opacity-90 transition-opacity"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="relative flex items-center justify-center gap-2 py-4 px-6 text-white font-semibold">
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Memproses...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Masuk ke Dashboard</span>
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </div>
                        </button>
                    </form>

                    {/* Decorative Element */}
                    <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2">
                        <div className="w-20 h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-300 rounded-full opacity-50"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}