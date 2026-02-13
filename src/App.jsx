// src/App.jsx
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'

// Import Halaman (Perhatikan path folder 'dashboard' baru)
import Login from './pages/Login'
import Admin from './pages/dashboard/Admin'
import Guru from './pages/dashboard/Guru'
import Siswa from './pages/dashboard/Siswa'
import UjianKerjakan from './pages/dashboard/siswa/UjianKerjakan'
import HasilUjian from './pages/dashboard/siswa/HasilUjian'

// Import Satpam
import ProtectedRoute from './components/ProtectedRoute'

// Import Error Handling
import NotFound from './pages/NotFound'
import ErrorBoundary from './components/ui/ErrorBoundary'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Cek sesi saat aplikasi pertama dibuka
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // 2. Pasang pendengar (listener) jika user login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Tampilkan layar loading putih saat cek status login (supaya tidak kedip)
  if (loading) {
    return <div className="h-screen flex items-center justify-center">Memuat...</div>
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Halaman Login (Publik) */}
          <Route path="/" element={<Login />} />

          {/* === AREA TERPROTEKSI (DASHBOARD) === */}

          {/* Admin */}
          <Route path="/dashboard/admin" element={
            <ProtectedRoute user={session} allowedRoles={['admin']}>
              <Admin />
            </ProtectedRoute>
          } />

          {/* Guru */}
          <Route path="/dashboard/guru" element={
            <ProtectedRoute user={session} allowedRoles={['guru']}>
              <Guru />
            </ProtectedRoute>
          } />

          {/* Siswa */}
          <Route path="/dashboard/siswa" element={
            <ProtectedRoute user={session} allowedRoles={['siswa']}>
              <Siswa />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/siswa/ujian/:id" element={
            <ProtectedRoute user={session} allowedRoles={['siswa']}>
              <UjianKerjakan />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/siswa/hasil/:id" element={
            <ProtectedRoute user={session} allowedRoles={['siswa']}>
              <HasilUjian />
            </ProtectedRoute>
          } />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App