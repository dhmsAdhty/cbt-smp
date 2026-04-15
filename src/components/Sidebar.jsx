import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Swal from 'sweetalert2'
import {
    DashboardSquare02Icon,
    UserMultiple02Icon,
    MeetingRoomIcon,
    BookOpen02Icon,
    ChartHistogramIcon,
    Download01Icon,
    Logout03Icon,
    Menu01Icon,
    Cancel01Icon,
    Settings01Icon,
    Delete02Icon
} from 'hugeicons-react'

export default function Sidebar({ activeTab, setActiveTab, menuItems: propMenuItems, themeColor = 'orange', userRole }) {
    const navigate = useNavigate()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const getRoleLabel = () => {
        if (userRole) return userRole.toUpperCase()
        return themeColor === 'blue' ? 'GURU' : 'ADMIN'
    }

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'Yakin ingin keluar?',
            text: 'Anda akan kembali ke halaman login',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0085db',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Keluar',
            cancelButtonText: 'Batal',
            background: '#1a1a1a',
            color: '#fff',
            iconColor: '#0085db'
        })

        if (result.isConfirmed) {
            Swal.fire({
                title: 'Sedang Keluar...',
                text: 'Mohon tunggu sebentar',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => Swal.showLoading(),
                background: '#1a1a1a',
                color: '#fff'
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

    const defaultMenuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardSquare02Icon },
        { id: 'users', label: 'Pengguna', icon: UserMultiple02Icon },
        { id: 'kelas', label: 'Kelas', icon: MeetingRoomIcon },
        { id: 'mapel', label: 'Mata Pelajaran', icon: BookOpen02Icon },
        { id: 'statistik_mapel', label: 'Statistik Mapel', icon: ChartHistogramIcon },
        { id: 'rekap_nilai_mapel', label: 'Rekap Nilai Mapel', icon: Download01Icon },
        { id: 'trash_soal', label: 'Soal Terhapus', icon: Delete02Icon },
        { id: 'settings', label: 'Pengaturan', icon: Settings01Icon }
    ]

    const menuItems = propMenuItems || defaultMenuItems

    const adminGroupedMenuItems = [
        {
            title: 'HOME',
            items: [{ id: 'dashboard', label: 'Dashboard', icon: DashboardSquare02Icon }]
        },
        {
            title: 'MANAJEMEN DATA',
            items: [
                { id: 'users', label: 'Pengguna', icon: UserMultiple02Icon },
                { id: 'kelas', label: 'Kelas', icon: MeetingRoomIcon },
                { id: 'mapel', label: 'Mata Pelajaran', icon: BookOpen02Icon }
            ]
        },
        {
            title: 'LAPORAN',
            items: [
                { id: 'statistik_mapel', label: 'Statistik Mapel', icon: ChartHistogramIcon },
                { id: 'rekap_nilai_mapel', label: 'Rekap Nilai Mapel', icon: Download01Icon }
            ]
        },
        {
            title: 'SISTEM',
            items: [
                { id: 'trash_soal', label: 'Soal Terhapus', icon: Delete02Icon },
                { id: 'settings', label: 'Pengaturan', icon: Settings01Icon }
            ]
        }
    ]

    const groupedMenuItems = userRole === 'admin' && !propMenuItems
        ? adminGroupedMenuItems
        : [{ title: 'MENU UTAMA', items: menuItems }]

    const handleMenuClick = (tabId) => {
        setActiveTab(tabId)
        setIsMobileMenuOpen(false)
    }

    return (
        <>
            {/* Mobile toggle button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="xl:hidden fixed top-[72px] left-4 z-50 p-2.5 rounded-xl bg-[#0085db] text-white shadow-md transition-all hover:bg-[#0071ba]"
                aria-label="Toggle menu"
            >
                {isMobileMenuOpen ? <Cancel01Icon size={22} /> : <Menu01Icon size={22} />}
            </button>

            {/* Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="xl:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar — matches template aside */}
            <aside className={`
                fixed top-0 left-0 z-40
                w-[270px] h-screen
                xl:top-[90px] xl:left-auto xl:h-[calc(100vh-110px)]
                bg-white border border-[#e7ecf0]
                shadow-[0px_2px_6px_rgba(37,83,185,0.1)]
                transition-transform duration-300
                flex flex-col
                rounded-none xl:rounded-[18px]
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
            `}>
                {/* Logo */}
                <div className="p-4 border-b border-[#e7ecf0]">
                    <a href="#" className="flex items-center gap-3">
                        <img src="/ATSLogo -trans.png" alt="Logo" className="w-10 h-auto" />
                        <div>
                            <h1 className="text-lg font-extrabold text-[#0085db] leading-tight">
                                CBT {getRoleLabel()}
                            </h1>
                            <p className="text-[11px] text-[#707a82]">Sekolah Tahfidz Al Hikmah</p>
                        </div>
                    </a>
                </div>

                {/* Nav */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <nav className="w-full flex flex-col sidebar-nav px-4 mt-5 pb-4">
                        <ul className="text-[#707a82] text-sm space-y-0.5">
                            {groupedMenuItems.map((group) => (
                                <li key={group.title}>
                                    {/* Section label */}
                                    <p className="text-xs font-bold text-[#707a82] pb-2 mt-6 first:mt-0 px-2">
                                        {group.title}
                                    </p>

                                    {group.items.map((tab) => {
                                        const Icon = tab.icon
                                        const isActive = activeTab === tab.id

                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => handleMenuClick(tab.id)}
                                                className={`
                                                    sidebar-link w-full flex items-center gap-3 px-3 py-3 my-1
                                                    rounded-[7px] transition-all duration-200 relative group text-left
                                                    ${isActive
                                                        ? 'bg-[#e5f3fb] text-[#0085db] font-semibold'
                                                        : 'text-[#707a82] hover:bg-[#f0f5f9] hover:text-[#0085db]'
                                                    }
                                                `}
                                            >
                                                <Icon size={20} className={isActive ? 'text-[#0085db]' : 'text-[#707a82] group-hover:text-[#0085db]'} />
                                                <span className="text-base">{tab.label}</span>
                                                {isActive && (
                                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0085db]" />
                                                )}
                                            </button>
                                        )
                                    })}
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                {/* Logout */}
                <div className="p-4 border-t border-[#e7ecf0]">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[7px]
                                 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white
                                 font-semibold text-sm transition-all duration-200"
                    >
                        <Logout03Icon size={18} />
                        <span>Keluar Sistem</span>
                    </button>
                </div>
            </aside>
        </>
    )
}
