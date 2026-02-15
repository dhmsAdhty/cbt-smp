import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
// import { useAdminData } from '../../hooks/useAdminData' // No longer needed here
import LoadingSpinner from '../../components/admin/shared/LoadingSpinner'
import DashboardView from '../../components/admin/Dashboard/DashboardView'
import UsersView from '../../components/admin/Users/UsersView'
import KelasView from '../../components/admin/Kelas/KelasView'
import MapelView from '../../components/admin/Mapel/MapelView'
import SettingsView from '../../components/admin/Settings/SettingsView'

export default function Admin() {
    const [activeTab, setActiveTab] = useState('dashboard')
    const [isVisible, setIsVisible] = useState(false)
    // const { loading, stats, dataList, refetch } = useAdminData() // Removed

    useEffect(() => {
        setIsVisible(true)
    }, [])

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardView />

            case 'users':
                return <UsersView />

            case 'kelas':
                return <KelasView />

            case 'mapel':
                return <MapelView />

            case 'settings':
                return <SettingsView />

            default:
                return <DashboardView />
        }
    }

    const getPageTitle = () => {
        const titles = {
            dashboard: 'Dashboard Admin',
            users: 'Manajemen Users',
            kelas: 'Manajemen Kelas',
            mapel: 'Manajemen Mata Pelajaran',
            settings: 'Pengaturan Akun'
        }
        return titles[activeTab] || 'Dashboard Admin'
    }

    const getPageDescription = () => {
        const descriptions = {
            dashboard: 'Selamat datang di panel admin CBT',
            users: 'Kelola data pengguna sistem',
            kelas: 'Kelola data kelas',
            mapel: 'Kelola data mata pelajaran',
            settings: 'Kelola profil dan pengaturan akun Anda'
        }
        return descriptions[activeTab] || 'Selamat datang di panel admin CBT'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Sidebar */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole="admin" />

            {/* Main Content */}
            <main className={`
                relative z-10 flex-1 p-6 lg:p-10 overflow-y-auto
                lg:ml-80
                transition-all duration-700 delay-200
                ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
            `}>
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 bg-clip-text text-transparent mb-2">
                                {getPageTitle()}
                            </h1>
                            <p className="text-gray-600">
                                {getPageDescription()}
                            </p>
                        </div>
                    </header>

                    {/* Content */}
                    {renderContent()}
                </div>
            </main>
        </div>
    )
}