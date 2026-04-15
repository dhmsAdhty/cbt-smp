import { supabase } from '../../../lib/supabaseClient'
import Swal from 'sweetalert2'
import GlassCard from '../shared/GlassCard'
import LoadingSpinner from '../shared/LoadingSpinner'
import { useState, useEffect } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CheckmarkCircle02Icon } from 'hugeicons-react'

const MapelView = () => {
    const [mapelList, setMapelList] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isHovering, setIsHovering] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchMapel = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('mapel')
                .select('*')
                .order('nama_mapel', { ascending: true })

            if (error) throw error
            setMapelList(data || [])
        } catch (error) {
            console.error('Error fetching mapel:', error)
            Swal.fire({
                icon: 'error',
                title: 'Gagal memuat data',
                text: error.message
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchMapel()
    }, [])

    const filteredMapel = mapelList.filter(mapel =>
        mapel.nama_mapel.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAdd = async () => {
        const { value: namaMapel } = await Swal.fire({
            title: 'Tambah Mata Pelajaran',
            html: '<p style="color: #6b7280; margin: 10px 0;">Masukkan nama mata pelajaran baru</p>',
            input: 'text',
            inputPlaceholder: 'Contoh: Matematika',
            showCancelButton: true,
            confirmButtonText: 'Simpan',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#6b7280',
            reverseButtons: true,
            inputValidator: (value) => {
                if (!value) return 'Nama mapel harus diisi!'
                if (value.length < 3) return 'Nama mapel minimal 3 karakter!'
                if (value.length < 3) return 'Nama mapel minimal 3 karakter!'
                if (mapelList.some(m => m.nama_mapel.toLowerCase() === value.toLowerCase())) {
                    return 'Mata pelajaran sudah tersedia!'
                }
            }
        })

        if (namaMapel) {
            try {
                const { error } = await supabase.from('mapel').insert({
                    nama_mapel: namaMapel.trim()
                })

                if (error) throw error

                const iconHtml = renderToStaticMarkup(
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <div style={{ color: '#22c55e' }}>
                            <CheckmarkCircle02Icon size={50} />
                        </div>
                    </div>
                )

                Swal.fire({
                    html: `
                        ${iconHtml}
                        <h2 style="margin-top: 10px; font-weight: bold; font-size: 1.5rem; color: #fff;">Berhasil!</h2>
                        <p style="margin-top: 5px; color: #d1d5db;">Mata pelajaran berhasil ditambahkan</p>
                    `,
                    showConfirmButton: false,
                    timer: 1500,
                    timerProgressBar: true,
                })

                await fetchMapel()
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
            title: 'Hapus Mata Pelajaran',
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
                const { error } = await supabase.from('mapel').delete().eq('id', id)
                if (error) throw error

                /* Success Delete */
                const iconHtml = renderToStaticMarkup(
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <div style={{ color: '#22c55e' }}>
                            <CheckmarkCircle02Icon size={50} />
                        </div>
                    </div>
                )

                Swal.fire({
                    html: `
                        ${iconHtml}
                        <h2 style="margin-top: 10px; font-weight: bold; font-size: 1.5rem; color: #fff;">Terhapus!</h2>
                        <p style="margin-top: 5px; color: #d1d5db;">Mata pelajaran berhasil dihapus</p>
                    `,
                    showConfirmButton: false,
                    timer: 1500,
                    timerProgressBar: true,
                })

                await fetchMapel()
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: '❌ Error',
                    text: err.message,
                    confirmButtonColor: '#f97316',
                    iconColor: '#f97316'
                })
            }
        }
    }

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header dengan Search */}
            <GlassCard className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-3">

                        <div>
                            <h2 className="text-2xl font-bold text-[#111c2d]">
                                Tambah Mata Pelajaran
                            </h2>
                            <p className="text-sm text-[#5f686f]">
                                Kelola data mata pelajaran sekolah
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search Input */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-[#0085db]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari mapel..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64 pl-10 pr-4 py-2.5 bg-[#f0f5f9] border border-[#e7ecf0] rounded-xl focus:ring-2 focus:ring-[#0085db]/20 focus:border-[#0085db] placeholder-gray-400 text-[#111c2d] transition-all duration-200"
                            />
                        </div>

                        {/* Add Button */}
                        <button
                            onClick={handleAdd}
                            className="group relative px-6 py-2.5 bg-gradient-to-r from-[#0085db] to-[#0071ba] hover:from-[#0071ba] hover:to-[#00639f] text-white rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 overflow-hidden"
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            <div className="relative flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Tambah Mapel</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#0085db] rounded-full"></span>
                        <span className="text-sm text-[#5f686f]">
                            Total Mapel: <span className="font-bold text-[#0085db]">{mapelList.length}</span>
                        </span>
                    </div>
                    {searchTerm && (
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span className="text-sm text-[#5f686f]">
                                Hasil pencarian: <span className="font-bold text-blue-600">{filteredMapel.length}</span>
                            </span>
                        </div>
                    )}
                </div>
            </GlassCard>

            {/* Grid Mapel */}
            <GlassCard className="p-6">
                {filteredMapel.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredMapel.map((mapel, index) => (
                            <div
                                key={mapel.id}
                                className="group relative animate-slide-down"
                                style={{ animationDelay: `${index * 50}ms` }}
                                onMouseEnter={() => setIsHovering(mapel.id)}
                                onMouseLeave={() => setIsHovering(null)}
                            >
                                {/* Premium Card */}
                                <div className="relative p-5 bg-white rounded-xl border border-[#e7ecf0] shadow-sm hover:shadow-md transition-all duration-500 hover:-translate-y-1 overflow-hidden">

                                    {/* Background Decoration */}
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#46caeb]/10 to-[#0085db]/10 rounded-full blur-2xl"></div>
                                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-[#46caeb]/10 to-[#0085db]/10 rounded-full blur-xl"></div>

                                    {/* Content */}
                                    <div className="relative">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                {/* Icon */}
                                                <div>
                                                    <h3 className="font-bold text-sm text-[#111c2d] group-hover:text-[#0085db] transition-colors">
                                                        {mapel.nama_mapel}
                                                    </h3>
                                                </div>
                                            </div>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleDelete(mapel.id, mapel.nama_mapel)}
                                                className={`
                                                    p-2 rounded-lg transition-all duration-300
                                                    ${isHovering === mapel.id
                                                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 scale-110'
                                                        : 'bg-red-50 text-red-600 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white'
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
                            <div className="absolute inset-0 bg-[#0085db] rounded-full blur-3xl opacity-10 animate-pulse"></div>
                            <div className="relative w-24 h-24 rounded-full bg-[#e5f3fb] flex items-center justify-center">
                                <svg className="w-12 h-12 text-[#0085db]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {searchTerm ? 'Mata Pelajaran Tidak Ditemukan' : 'Belum Ada Mata Pelajaran'}
                        </h3>
                        <p className="text-gray-500 text-center max-w-md mb-6">
                            {searchTerm
                                ? `Tidak ada mata pelajaran dengan nama "${searchTerm}"`
                                : 'Klik tombol "Tambah Mapel" untuk menambahkan mata pelajaran baru'
                            }
                        </p>

                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-300"
                            >
                                Reset Pencarian
                            </button>
                        )}
                    </div>
                )}
            </GlassCard>

            {/* Quick Actions */}
            {filteredMapel.length > 0 && (
                <div className="flex justify-end">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#e5f3fb] rounded-lg border border-[#0085db]/20">
                        <span className="w-2 h-2 bg-[#0085db] rounded-full animate-pulse"></span>
                        <span className="text-sm text-[#0085db]">
                            {filteredMapel.length} mata pelajaran ditampilkan
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MapelView
