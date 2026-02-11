import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import Swal from 'sweetalert2'

export default function Guru() {
    const navigate = useNavigate()

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'Yakin ingin keluar?',
            text: 'Anda akan kembali ke halaman login',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb', // Blue for Guru
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, Keluar',
            cancelButtonText: 'Batal'
        })

        if (result.isConfirmed) {
            Swal.fire({
                title: 'Sedang Keluar...',
                text: 'Mohon tunggu sebentar',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading()
                }
            })

            try {
                await supabase.auth.signOut()
            } catch (error) {
                console.error('Logout error:', error)
            } finally {
                Swal.close()
                navigate('/', { replace: true })
            }
        }
    }

    return (
        <div className="min-h-screen bg-blue-50 p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-700">Dashboard Guru</h1>
                    <button
                        onClick={handleLogout}
                        className="bg-white text-red-500 border border-red-500 px-4 py-2 rounded hover:bg-red-50"
                    >
                        Keluar
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                        <h3 className="font-bold text-lg mb-2 text-blue-600">Input Soal Baru</h3>
                        <p className="text-sm text-gray-500">Buat soal pilihan ganda untuk ujian siswa.</p>
                        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded w-full">Buka Menu</button>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                        <h3 className="font-bold text-lg mb-2 text-green-600">Rekap Nilai</h3>
                        <p className="text-sm text-gray-500">Lihat hasil ujian siswa di mapel Anda.</p>
                        <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded w-full">Lihat Data</button>
                    </div>
                </div>
            </div>
        </div>
    )
}