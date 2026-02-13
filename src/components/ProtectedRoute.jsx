// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

// Menerima props:
// - user: data user dari Supabase
// - children: halaman yang ingin dibuka
// - allowedRoles: array string role yang diizinkan (misal: ['admin'])
const ProtectedRoute = ({ user, children, allowedRoles }) => {
    const [role, setRole] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkRole = async () => {
            if (!user) {
                setLoading(false)
                return
            }

            // Ambil role dari tabel users
            // NOTE: Prop 'user' is actually the 'session' object from App.jsx
            const userId = user.user?.id || user.id

            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single()

            if (data) {
                setRole(data.role)
            }
            setLoading(false)
        }

        checkRole()
    }, [user])

    // 1. Jika user belum login, redirect ke Login
    if (!user) {
        return <Navigate to="/" replace />
    }

    // 2. Tampilkan loading saat cek role
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        )
    }

    // 3. Jika role tidak sesuai, redirect ke dashboard yang benar
    if (allowedRoles && !allowedRoles.includes(role)) {
        if (role === 'admin') return <Navigate to="/dashboard/admin" replace />
        if (role === 'guru') return <Navigate to="/dashboard/guru" replace />
        if (role === 'siswa') return <Navigate to="/dashboard/siswa" replace />
        return <Navigate to="/" replace /> // Fallback
    }

    // 4. Jika lolos semua cek, izinkan masuk
    return children
}

export default ProtectedRoute