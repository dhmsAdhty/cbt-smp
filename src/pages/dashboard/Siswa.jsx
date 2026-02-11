import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import Swal from 'sweetalert2'

export default function Siswa() {
    const navigate = useNavigate()

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'Yakin ingin keluar?',
            text: 'Anda akan kembali ke halaman login',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a', // Green for Siswa
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
        <div className="min-h-screen bg-green-50 p-6">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-green-600 p-6 text-white flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Ruang Ujian</h1>
                        <p className="text-green-100 text-sm">Kerjakan dengan jujur!</p>
                    </div>
                    <button onClick={handleLogout} className="text-white underline hover:text-green-200">Logout</button>
                </div>

                <div className="p-8 text-center">
                    <div className="mb-6">
                        <label className="block text-left font-bold text-gray-700 mb-2">Pilih Mata Pelajaran</label>
                        <select className="w-full p-3 border rounded-lg bg-gray-50">
                            <option>-- Pilih Mapel --</option>
                            <option>TIK</option>
                            <option>Matematika</option>
                        </select>
                    </div>

                    <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg shadow-lg transform transition hover:scale-105">
                        MULAI UJIAN SEKARANG
                    </button>
                </div>
            </div>
        </div>
    )
}