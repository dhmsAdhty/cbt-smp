// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'

// Menerima props:
// - user: data user dari Supabase
// - children: halaman yang ingin dibuka (Admin/Guru/Siswa)
const ProtectedRoute = ({ user, children }) => {

    // Jika user KOSONG (belum login), redirect paksa ke halaman utama (Login)
    if (!user) {
        return <Navigate to="/" replace />
    }

    // Jika user ADA, izinkan masuk (render halaman dashboard)
    return children
}

export default ProtectedRoute