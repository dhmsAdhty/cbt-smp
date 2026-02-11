import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Swal from 'sweetalert2'
import {
    DashboardSquare02Icon,
    UserMultiple02Icon,
    MeetingRoomIcon,
    BookOpen02Icon,
    Logout03Icon,
    Menu01Icon,
    Cancel01Icon,
    Settings01Icon
} from 'hugeicons-react'

export default function Sidebar({ activeTab, setActiveTab }) {
    const navigate = useNavigate()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'Yakin ingin keluar?',
            text: 'Anda akan kembali ke halaman login',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Keluar',
            cancelButtonText: 'Batal',
            background: '#1a1a1a',
            color: '#fff',
            iconColor: '#f97316'
        })

        if (result.isConfirmed) {
            await supabase.auth.signOut()
            navigate('/')
        }
    }

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardSquare02Icon },
        { id: 'users', label: 'Pengguna', icon: UserMultiple02Icon },
        { id: 'kelas', label: 'Kelas', icon: MeetingRoomIcon },
        { id: 'mapel', label: 'Mata Pelajaran', icon: BookOpen02Icon },
        { id: 'settings', label: 'Pengaturan', icon: Settings01Icon }
    ]

    const handleMenuClick = (tabId) => {
        setActiveTab(tabId)
        setIsMobileMenuOpen(false)
    }

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105"
                aria-label="Toggle menu"
            >
                {isMobileMenuOpen ? <Cancel01Icon size={24} /> : <Menu01Icon size={24} />}
            </button>

            {/* Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-40
                w-80 h-screen
                bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl 
                border-r border-orange-100/50 dark:border-orange-800/30 
                shadow-2xl shadow-orange-500/10
                transition-all duration-500 ease-in-out
                flex flex-col
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-8 flex-1 flex flex-col overflow-y-auto">
                    {/* Logo Area */}
                    <div className="flex items-center gap-4 mb-10">
                        <div>
                            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                                CBT ADMIN
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Sekolah Tahfidz AL HIKMAH</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-2 flex-1">
                        <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 px-4">
                            Menu Utama
                        </p>
                        {menuItems.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleMenuClick(tab.id)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3.5 rounded-xl 
                                        transition-all duration-300 relative group
                                        ${isActive
                                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                                            : 'hover:bg-orange-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                                        }
                                    `}
                                >
                                    <div className={`
                                        transition-transform duration-300
                                        ${isActive ? 'scale-110' : 'group-hover:scale-110'}
                                    `}>
                                        <Icon size={20} />
                                    </div>
                                    <span className="font-medium flex-1 text-left">{tab.label}</span>

                                    {isActive && (
                                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                    )}

                                    {/* Active Indicator */}
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                                    )}
                                </button>
                            )
                        })}
                    </nav>

                    {/* Logout Button */}
                    <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl 
                                     bg-gradient-to-r from-red-500 to-red-600 
                                     hover:from-red-600 hover:to-red-700 
                                     text-white font-medium 
                                     shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 
                                     transition-all duration-300 transform hover:-translate-y-0.5 
                                     group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            <Logout03Icon size={20} className="relative z-10" />
                            <span className="relative z-10">Keluar Sistem</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}