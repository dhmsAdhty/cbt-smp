import { supabase } from '../../../lib/supabaseClient'
import Swal from 'sweetalert2'
import GlassCard from '../shared/GlassCard'
import { useState } from 'react'

const KelasView = ({ kelasList, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [isHovering, setIsHovering] = useState(null)

    const filteredKelas = kelasList.filter(kelas =>
        kelas.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAdd = async () => {
        const { value: namaKelas } = await Swal.fire({
            title: 'Tambah Kelas Baru',
            html: '<p style="color: #6b7280; margin: 10px 0;">Masukkan nama kelas baru</p>',
            input: 'text',
            inputPlaceholder: 'Contoh: X-A',
            showCancelButton: true,
            confirmButtonText: 'Simpan',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#6b7280',
            reverseButtons: true,
            inputValidator: (value) => {
                if (!value) return 'Nama kelas harus diisi!'
                if (value.length < 2) return 'Nama kelas minimal 2 karakter!'
                if (kelasList.some(k => k.nama_kelas.toLowerCase() === value.toLowerCase())) {
                    return 'Kelas sudah tersedia!'
                }
            }
        })

        if (namaKelas) {
            try {
                const { error } = await supabase.from('kelas').insert({
                    nama_kelas: namaKelas.trim(),
                    created_at: new Date().toISOString()
                })

                if (error) throw error

                Swal.fire({
                    title: 'Berhasil!',
                    text: 'Kelas berhasil ditambahkan',
                    showConfirmButton: false,
                    timer: 1500,
                    timerProgressBar: true,
                })

                if (onRefresh) onRefresh()
            } catch (err) {
                Swal.fire({
                    title: 'Error',
                    text: err.message,
                    confirmButtonColor: '#f97316',
                })
            }
        }
    }

    const handleDelete = async (id, nama) => {
        const result = await Swal.fire({
            title: 'Hapus Kelas',
            html: `
                <p style="color: #6b7280; margin: 10px 0;">Yakin ingin menghapus</p>
                <p style="color: #f97316; font-weight: bold; font-size: 18px; margin: 10px 0;">${nama}</p>
                <p style="color: #9ca3af; font-size: 14px;">Tindakan ini tidak dapat dibatalkan!</p>
            `,
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
            reverseButtons: true,
        })

        if (result.isConfirmed) {
            try {
                const { error } = await supabase.from('kelas').delete().eq('id', id)
                if (error) throw error

                Swal.fire({
                    title: 'Terhapus!',
                    text: 'Kelas berhasil dihapus',
                    showConfirmButton: false,
                    timer: 1500,
                    timerProgressBar: true,
                })

                if (onRefresh) onRefresh()
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: '❌ Error',
                    text: err.message,
                    confirmButtonColor: '#f97316',
                    background: '#1a1a1a',
                    color: '#fff',
                    iconColor: '#f97316'
                })
            }
        }
    }

    return (
        <div className="space-y-6">
            {/* Header dengan Search */}
            <GlassCard className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-3">

                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-gray-800">
                                Tambah Kelas
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Kelola data kelas sekolah
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search Input */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari kelas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64 pl-10 pr-4 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-500 placeholder-gray-400 text-gray-900 dark:text-white transition-all duration-200"
                            />
                        </div>

                        {/* Add Button */}
                        <button
                            onClick={handleAdd}
                            className="group relative px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 transform hover:-translate-y-0.5 overflow-hidden"
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            <div className="relative flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Tambah Kelas</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Total Kelas: <span className="font-bold text-orange-600 dark:text-orange-400">{kelasList.length}</span>
                        </span>
                    </div>
                    {searchTerm && (
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Hasil pencarian: <span className="font-bold text-blue-600 dark:text-blue-400">{filteredKelas.length}</span>
                            </span>
                        </div>
                    )}
                </div>
            </GlassCard>

            {/* Grid Kelas */}
            <GlassCard className="p-6">
                {filteredKelas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredKelas.map((kelas, index) => (
                            <div
                                key={kelas.id}
                                className="group relative animate-slide-down"
                                style={{ animationDelay: `${index * 50}ms` }}
                                onMouseEnter={() => setIsHovering(kelas.id)}
                                onMouseLeave={() => setIsHovering(null)}
                            >
                                {/* Premium Card */}
                                <div className="relative p-5 bg-gradient-to-br from-white to-orange-50/50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-orange-100/50 dark:border-orange-800/30 shadow-lg hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 hover:-translate-y-1 overflow-hidden">

                                    {/* Background Decoration */}
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-400/10 to-orange-600/10 rounded-full blur-2xl"></div>
                                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-orange-400/10 to-orange-600/10 rounded-full blur-xl"></div>

                                    {/* Content */}
                                    <div className="relative">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <h3 className="font-bold text-sm text-gray-800 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                                        {kelas.nama_kelas}
                                                    </h3>
                                                </div>
                                            </div>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleDelete(kelas.id, kelas.nama_kelas)}
                                                className={`
                                                    p-2 rounded-lg transition-all duration-300
                                                    ${isHovering === kelas.id
                                                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 scale-110'
                                                        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white'
                                                    }
                                                `}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                        {/* Empty State */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-orange-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-orange-400/20 to-orange-600/20 flex items-center justify-center">
                                <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                            {searchTerm ? 'Kelas Tidak Ditemukan' : 'Belum Ada Kelas'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                            {searchTerm
                                ? `Tidak ada kelas dengan nama "${searchTerm}"`
                                : 'Klik tombol "Tambah Kelas" untuk menambahkan kelas baru'
                            }
                        </p>

                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-300"
                            >
                                Reset Pencarian
                            </button>
                        )}
                    </div>
                )}
            </GlassCard>

            {/* Quick Actions */}
            {filteredKelas.length > 0 && (
                <div className="flex justify-end">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800/30">
                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                        <span className="text-sm text-orange-700 dark:text-orange-400">
                            {filteredKelas.length} kelas ditampilkan
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default KelasView
