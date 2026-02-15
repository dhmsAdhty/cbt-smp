import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../../components/Sidebar'
import {
    DashboardSquare02Icon,
    BookOpen02Icon,
    CheckmarkCircle02Icon,
    Settings01Icon,
    PresentationBarChart02Icon,
    Clock02Icon
} from 'hugeicons-react'
import { supabase } from '../../lib/supabaseClient'
import BankSoalView from '../../components/guru/BankSoal/BankSoalView'
import UjianView from '../../components/guru/Ujian/UjianView'
import RekapNilaiView from '../../components/guru/RekapNilai/RekapNilaiView'
import SettingsView from '../../components/guru/Settings/SettingsView'

export default function Guru() {
    const [activeTab, setActiveTab] = useState('dashboard')
    const [greeting, setGreeting] = useState('')
    const [stats, setStats] = useState({
        totalSoal: 0,
        ujianBerlangsung: 0,
        ujianMendatang: 0,
        totalSiswa: 0
    })

    useEffect(() => {
        updateGreeting()
        fetchStats()
    }, [])

    const updateGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting('Selamat Pagi')
        else if (hour < 15) setGreeting('Selamat Siang')
        else if (hour < 18) setGreeting('Selamat Sore')
        else setGreeting('Selamat Malam')
    }

    const fetchStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: guruData } = await supabase
                .from('users')
                .select('mapel')
                .eq('id', user.id)
                .single()

            if (!guruData?.mapel) return

            const { data: mapelData } = await supabase
                .from('mapel')
                .select('id')
                .eq('nama_mapel', guruData.mapel)
                .single()

            if (!mapelData) return

            const [{ count: totalSoal }, { count: ujianBerlangsung }, { count: ujianMendatang }, { data: siswaList }] = await Promise.all([
                supabase.from('bank_soal').select('*', { count: 'exact', head: true }).eq('mapel_id', mapelData.id),
                supabase.from('ujian').select('*', { count: 'exact', head: true }).eq('mapel_id', mapelData.id).eq('status', 'aktif'),
                supabase.from('ujian').select('*', { count: 'exact', head: true }).eq('mapel_id', mapelData.id).eq('status', 'draft'),
                supabase.from('users').select('id').eq('role', 'siswa')
            ])

            setStats({
                totalSoal: totalSoal || 0,
                ujianBerlangsung: ujianBerlangsung || 0,
                ujianMendatang: ujianMendatang || 0,
                totalSiswa: siswaList?.length || 0
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardSquare02Icon },
        { id: 'bank_soal', label: 'Bank Soal', icon: BookOpen02Icon },
        { id: 'ujian', label: 'Ujian', icon: PresentationBarChart02Icon },
        { id: 'rekap_nilai', label: 'Rekap Nilai', icon: CheckmarkCircle02Icon },
        { id: 'settings', label: 'Pengaturan', icon: Settings01Icon }
    ]

    const StatCard = ({ icon: Icon, label, value, color }) => (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className={`p-2.5 rounded-lg bg-gradient-to-br ${color} w-fit mb-3`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    )

    const QuickActionCard = ({ icon: Icon, title, onClick, color }) => (
        <button
            onClick={onClick}
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all text-left w-full group"
        >
            <div className={`p-2.5 rounded-lg bg-gradient-to-br ${color} w-fit mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
        </button>
    )

    const pageVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
        exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: "easeIn" } }
    }

    const renderContent = () => {
        const content = (() => {
            switch (activeTab) {
                case 'dashboard':
                    return (
                        <div className="space-y-6">
                            {/* Welcome Section */}
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
                                <h2 className="text-2xl font-bold mb-2">{greeting}, Guru!</h2>
                                <p className="text-blue-100">
                                    Anda memiliki {stats.ujianBerlangsung} ujian aktif dan {stats.ujianMendatang} ujian draft.
                                </p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard
                                    icon={BookOpen02Icon}
                                    label="Total Soal"
                                    value={stats.totalSoal}
                                    color="from-blue-500 to-blue-600"
                                />
                                <StatCard
                                    icon={PresentationBarChart02Icon}
                                    label="Ujian Aktif"
                                    value={stats.ujianBerlangsung}
                                    color="from-green-500 to-green-600"
                                />
                                <StatCard
                                    icon={Clock02Icon}
                                    label="Ujian Draft"
                                    value={stats.ujianMendatang}
                                    color="from-orange-500 to-orange-600"
                                />
                                <StatCard
                                    icon={DashboardSquare02Icon}
                                    label="Total Siswa"
                                    value={stats.totalSiswa}
                                    color="from-purple-500 to-purple-600"
                                />
                            </div>

                            {/* Quick Actions */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Menu Cepat</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    <QuickActionCard
                                        icon={BookOpen02Icon}
                                        title="Bank Soal"
                                        onClick={() => setActiveTab('bank_soal')}
                                        color="from-blue-500 to-blue-600"
                                    />
                                    <QuickActionCard
                                        icon={PresentationBarChart02Icon}
                                        title="Ujian"
                                        onClick={() => setActiveTab('ujian')}
                                        color="from-green-500 to-green-600"
                                    />
                                    <QuickActionCard
                                        icon={CheckmarkCircle02Icon}
                                        title="Rekap Nilai"
                                        onClick={() => setActiveTab('rekap_nilai')}
                                        color="from-purple-500 to-purple-600"
                                    />
                                </div>
                            </div>
                        </div>
                    )

                case 'bank_soal':
                    return <BankSoalView />
                case 'ujian':
                    return <UjianView />
                case 'rekap_nilai':
                    return <RekapNilaiView />
                case 'settings':
                    return <SettingsView />
                default:
                    return null
            }
        })()

        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                >
                    {content}
                </motion.div>
            </AnimatePresence>
        )
    }

    const pageTitle = {
        dashboard: 'Dashboard',
        bank_soal: 'Bank Soal',
        ujian: 'Ujian',
        rekap_nilai: 'Rekap Nilai',
        settings: 'Pengaturan'
    }[activeTab] || 'Dashboard'

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                menuItems={menuItems}
                themeColor="blue"
                userRole="guru"
            />

            <main className="flex-1 p-6 lg:p-8 overflow-y-auto lg:ml-80">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                            {pageTitle}
                        </h1>
                    </div>
                    {renderContent()}
                </div>
            </main>
        </div>
    )
}