import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import {
    DashboardSquare02Icon,
    BookOpen02Icon,
    CheckmarkCircle02Icon,
    Settings01Icon,
    PresentationBarChart02Icon,
    Clock02Icon,
    StarAward01Icon,
    Appointment01Icon,
    ArrowRight01Icon,
    FilterIcon,
    Notification03Icon
} from 'hugeicons-react'
import BankSoalView from '../../components/guru/BankSoal/BankSoalView'
import UjianView from '../../components/guru/Ujian/UjianView'
import RekapNilaiView from '../../components/guru/RekapNilai/RekapNilaiView'
import SettingsView from '../../components/admin/Settings/SettingsView'

export default function Guru() {
    const [activeTab, setActiveTab] = useState('dashboard')
    const [isVisible, setIsVisible] = useState(false)
    const [greeting, setGreeting] = useState('')
    const [currentTime, setCurrentTime] = useState('')
    const [stats, setStats] = useState({
        totalSoal: 0,
        ujianBerlangsung: 0,
        ujianMendatang: 0,
        rataRataNilai: 0,
        totalSiswa: 0
    })

    useEffect(() => {
        setIsVisible(true)
        updateGreeting()
        fetchStats()

        // Update waktu setiap detik
        const timer = setInterval(() => {
            const now = new Date()
            setCurrentTime(now.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }))
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    const updateGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting('Selamat Pagi')
        else if (hour < 15) setGreeting('Selamat Siang')
        else if (hour < 18) setGreeting('Selamat Sore')
        else setGreeting('Selamat Malam')
    }

    const fetchStats = async () => {
        // Simulasi fetch data
        setStats({
            totalSoal: 234,
            ujianBerlangsung: 3,
            ujianMendatang: 5,
            rataRataNilai: 84.5,
            totalSiswa: 45
        })
    }

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardSquare02Icon },
        { id: 'bank_soal', label: 'Bank Soal', icon: BookOpen02Icon },
        { id: 'ujian', label: 'Manajemen Ujian', icon: PresentationBarChart02Icon },
        { id: 'rekap_nilai', label: 'Rekap Nilai', icon: CheckmarkCircle02Icon },
        { id: 'settings', label: 'Pengaturan', icon: Settings01Icon }
    ]

    const StatCard = ({ icon: Icon, label, value, trend, color, delay }) => (
        <div
            className="relative group animate-slide-up transition-all duration-700 ease-out opacity-0 animate-fade-in"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>

            <div className="relative p-5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl 
                          border border-gray-100 dark:border-gray-800 
                          shadow-lg shadow-blue-500/5
                          hover:shadow-xl hover:shadow-blue-500/10 
                          transition-all duration-500 hover:-translate-y-1
                          group-hover:border-blue-200/50 dark:group-hover:border-blue-800/50">

                <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500`}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>

                    {trend && (
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-lg
                            ${trend > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {trend > 0 ? '+' : ''}{trend}%
                        </span>
                    )}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {value}
                </h3>
            </div>
        </div>
    )

    const QuickActionCard = ({ icon: Icon, title, description, onClick, color, delay }) => (
        <div
            className={`
                group relative cursor-pointer animate-slide-up
                transition-all duration-700 ease-out
                opacity-0 animate-fade-in
            `}
            style={{ animationDelay: `${delay}ms` }}
            onClick={onClick}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/30 dark:from-gray-900/50 dark:to-gray-800/30 
                          backdrop-blur-xl rounded-2xl border border-white/50 dark:border-gray-800/50
                          shadow-2xl shadow-blue-500/10
                          group-hover:shadow-2xl group-hover:shadow-blue-500/30
                          group-hover:-translate-y-2 transition-all duration-500">

                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-blue-600/5 
                              rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                <div className="relative p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div className={`
                            p-3 rounded-xl bg-gradient-to-br ${color} 
                            shadow-lg shadow-blue-500/30
                            group-hover:scale-110 transition-all duration-500
                            group-hover:rotate-12
                        `}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>

                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center
                                      group-hover:bg-blue-500 group-hover:scale-110 transition-all duration-500">
                            <ArrowRight01Icon className="w-5 h-5 text-blue-500 group-hover:text-white transition-colors duration-500" />
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                </div>
            </div>
        </div>
    )

    const ActivityItem = ({ icon: Icon, title, time, status, color }) => (
        <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-blue-50/50 dark:hover:bg-gray-800/50 
                      transition-all duration-300 group">
            <div className={`
                p-2.5 rounded-lg bg-gradient-to-br ${color}
                shadow-lg shadow-blue-500/20
                group-hover:scale-110 transition-transform duration-300
            `}>
                <Icon className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1">
                <p className="font-semibold text-gray-800 dark:text-white">{title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{time}</p>
            </div>

            <span className={`
                px-2.5 py-1 text-xs font-semibold rounded-lg
                ${status === 'selesai' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    status === 'berlangsung' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}
            `}>
                {status}
            </span>
        </div>
    )

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-8">
                        {/* Welcome Section */}
                        <div className="relative bg-gradient-to-r from-blue-500/10 via-blue-600/5 to-transparent 
                                      dark:from-blue-500/20 dark:via-blue-600/10 dark:to-transparent 
                                      rounded-3xl p-8 overflow-hidden group">

                            {/* Animated Background */}
                            <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl 
                                              animate-pulse-slow"></div>
                                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl 
                                              animate-pulse-slower"></div>
                            </div>

                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 
                                                      bg-clip-text text-transparent">
                                            {greeting}!
                                        </h2>
                                        <span className="px-3 py-1.5 bg-blue-500/20 text-blue-700 dark:text-blue-400 
                                                       rounded-full text-sm font-medium border border-blue-500/30">
                                            Guru
                                        </span>
                                    </div>

                                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                                        Hari ini Anda memiliki <span className="font-bold text-blue-600 dark:text-blue-400">
                                            {stats.ujianBerlangsung} ujian</span> berlangsung dan
                                        <span className="font-bold text-blue-600 dark:text-blue-400"> {stats.ujianMendatang} ujian</span> mendatang.
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3 px-4 py-2 bg-white/80 dark:bg-gray-800/80 
                                                  backdrop-blur-xl rounded-xl border border-blue-100/50 dark:border-blue-800/30">
                                        <Clock02Icon className="w-5 h-5 text-blue-500" />
                                        <span className="text-xl font-bold text-gray-800 dark:text-white">
                                            {currentTime || '00:00:00'}
                                        </span>
                                    </div>

                                    <div className="relative">
                                        <button className="relative p-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl 
                                                       rounded-xl border border-blue-100/50 dark:border-blue-800/30
                                                       hover:bg-blue-500 hover:text-white transition-all duration-300
                                                       group">
                                            <Notification03Icon className="w-5 h-5 text-blue-500 group-hover:text-white" />
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full 
                                                           border-2 border-white dark:border-gray-900 text-[10px] 
                                                           flex items-center justify-center text-white font-bold">
                                                3
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                            <StatCard
                                icon={BookOpen02Icon}
                                label="Total Soal"
                                value={stats.totalSoal}
                                trend={12}
                                color="from-blue-500 to-blue-600"
                                delay={100}
                            />
                            <StatCard
                                icon={PresentationBarChart02Icon}
                                label="Ujian Berlangsung"
                                value={stats.ujianBerlangsung}
                                trend={25}
                                color="from-blue-500 to-blue-600"
                                delay={200}
                            />
                            <StatCard
                                icon={Clock02Icon}
                                label="Ujian Mendatang"
                                value={stats.ujianMendatang}
                                trend={-8}
                                color="from-purple-500 to-purple-600"
                                delay={300}
                            />
                            <StatCard
                                icon={CheckmarkCircle02Icon}
                                label="Rata-rata Nilai"
                                value={stats.rataRataNilai}
                                trend={5}
                                color="from-green-500 to-green-600"
                                delay={400}
                            />
                            <StatCard
                                icon={Appointment01Icon}
                                label="Total Siswa"
                                value={stats.totalSiswa}
                                color="from-yellow-500 to-yellow-600"
                                delay={500}
                            />
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <QuickActionCard
                                icon={BookOpen02Icon}
                                title="Bank Soal"
                                description="234 soal tersedia dalam 12 kategori"
                                onClick={() => setActiveTab('bank_soal')}
                                color="from-blue-500 to-blue-600"
                                delay={100}
                            />
                            <QuickActionCard
                                icon={PresentationBarChart02Icon}
                                title="Manajemen Ujian"
                                description="3 ujian berlangsung, 5 ujian mendatang"
                                onClick={() => setActiveTab('ujian')}
                                color="from-blue-500 to-blue-600"
                                delay={200}
                            />
                            <QuickActionCard
                                icon={StarAward01Icon}
                                title="Rekap Nilai"
                                description="45 siswa, rata-rata nilai 84.5"
                                onClick={() => setActiveTab('rekap_nilai')}
                                color="from-purple-500 to-purple-600"
                                delay={300}
                            />
                        </div>

                        {/* Recent Activity & Schedule */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Recent Activity */}
                            <div className="lg:col-span-2">
                                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl 
                                              border border-gray-100 dark:border-gray-800 p-6
                                              shadow-2xl shadow-blue-500/5">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 
                                                     bg-clip-text text-transparent flex items-center gap-2">
                                            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                                            Aktivitas Terkini
                                        </h3>
                                        <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 
                                                         font-medium flex items-center gap-1 group">
                                            Lihat Semua
                                            <ArrowRight01Icon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <ActivityItem
                                            icon={CheckmarkCircle02Icon}
                                            title="Ujian Matematika selesai"
                                            time="5 menit yang lalu"
                                            status="selesai"
                                            color="from-green-500 to-green-600"
                                        />
                                        <ActivityItem
                                            icon={PresentationBarChart02Icon}
                                            title="Ujian Fisika dimulai"
                                            time="10 menit yang lalu"
                                            status="berlangsung"
                                            color="from-blue-500 to-blue-600"
                                        />
                                        <ActivityItem
                                            icon={BookOpen02Icon}
                                            title="Soal baru ditambahkan"
                                            time="25 menit yang lalu"
                                            status="tambah"
                                            color="from-blue-500 to-blue-600"
                                        />
                                        <ActivityItem
                                            icon={Appointment01Icon}
                                            title="5 siswa mengerjakan ujian"
                                            time="1 jam yang lalu"
                                            status="aktif"
                                            color="from-purple-500 to-purple-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Upcoming Schedule */}
                            <div>
                                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl 
                                              border border-gray-100 dark:border-gray-800 p-6
                                              shadow-2xl shadow-blue-500/5 h-full">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 
                                                     bg-clip-text text-transparent flex items-center gap-2">
                                            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                                            Jadwal Hari Ini
                                        </h3>
                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 
                                                       text-blue-700 dark:text-blue-400 rounded-lg text-xs font-bold">
                                            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { time: '08:00', subject: 'Matematika', class: 'X IPA 1', students: 28 },
                                            { time: '10:00', subject: 'Fisika', class: 'XI IPA 2', students: 32 },
                                            { time: '13:00', subject: 'Kimia', class: 'XII IPA 1', students: 25 },
                                            { time: '15:00', subject: 'Biologi', class: 'X IPA 2', students: 30 }
                                        ].map((schedule, idx) => (
                                            <div key={idx} className="group">
                                                <div className="flex items-start gap-3 p-3 rounded-xl 
                                                              hover:bg-blue-50/50 dark:hover:bg-gray-800/50 
                                                              transition-all duration-300">
                                                    <div className="px-3 py-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 
                                                                  border border-blue-500/30 rounded-lg text-center min-w-[70px]">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Jam</p>
                                                        <p className="font-bold text-blue-600 dark:text-blue-400">{schedule.time}</p>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 
                                                                    dark:group-hover:text-blue-400 transition-colors">
                                                            {schedule.subject}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {schedule.class} • {schedule.students} siswa
                                                        </p>
                                                    </div>
                                                </div>
                                                {idx < 3 && <div className="border-b border-gray-100 dark:border-gray-800 mx-3"></div>}
                                            </div>
                                        ))}
                                    </div>

                                    <button className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 
                                                     hover:from-blue-600 hover:to-blue-700 text-white rounded-xl 
                                                     font-semibold shadow-lg shadow-blue-500/30 
                                                     hover:shadow-xl hover:shadow-blue-500/40 
                                                     transition-all duration-300 transform hover:-translate-y-0.5
                                                     flex items-center justify-center gap-2">
                                        <Clock02Icon className="w-5 h-5" />
                                        Lihat Jadwal Lengkap
                                    </button>
                                </div>
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
    }

    const getPageTitle = () => {
        const titles = {
            dashboard: 'Dashboard Guru',
            bank_soal: 'Bank Soal',
            ujian: 'Manajemen Ujian',
            rekap_nilai: 'Rekap Nilai Siswa',
            settings: 'Pengaturan Akun'
        }
        return titles[activeTab] || 'Dashboard Guru'
    }

    const getPageDescription = () => {
        const descriptions = {
            dashboard: 'Kelola pembelajaran dan pantau perkembangan siswa',
            bank_soal: 'Buat dan kelola bank soal mata pelajaran Anda',
            ujian: 'Atur jadwal dan sesi ujian untuk siswa',
            rekap_nilai: 'Lihat dan analisis hasil ujian siswa',
            settings: 'Atur profil dan preferensi akun Anda'
        }
        return descriptions[activeTab] || 'Selamat datang di panel guru'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 
                      dark:from-gray-900 dark:via-gray-800 dark:to-blue-950/30 
                      flex relative overflow-hidden">

            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200 dark:bg-blue-900/30 
                              rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-300 dark:bg-blue-800/30 
                              rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                              w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full 
                              mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-grid-blue-100/20 dark:bg-grid-blue-900/10 
                          [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                menuItems={menuItems}
                themeColor="blue"
                userRole="guru"
            />

            {/* Main Content */}
            <main className={`
                relative z-10 flex-1 p-6 lg:p-10 overflow-y-auto
                md:ml-80
                transition-all duration-700 delay-200
                ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
            `}>
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 
                                             bg-clip-text text-transparent">
                                    {getPageTitle()}
                                </h1>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 ml-4">
                                {getPageDescription()}
                            </p>
                        </div>

                        {activeTab === 'dashboard' && (
                            <div className="flex items-center gap-3">
                                <button className="px-4 py-2.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl 
                                               rounded-xl border border-gray-200 dark:border-gray-700 
                                               shadow-lg hover:shadow-xl transition-all duration-300
                                               flex items-center gap-2 group">
                                    <FilterIcon className="w-5 h-5 text-blue-500 group-hover:rotate-180 transition-transform duration-500" />
                                    <span className="text-gray-700 dark:text-gray-300">Filter</span>
                                </button>
                                <button className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 
                                               hover:from-blue-600 hover:to-blue-700 text-white rounded-xl 
                                               font-semibold shadow-lg shadow-blue-500/30 
                                               hover:shadow-xl hover:shadow-blue-500/40 
                                               transition-all duration-300 transform hover:-translate-y-0.5
                                               flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>Buat Ujian Baru</span>
                                </button>
                            </div>
                        )}
                    </header>

                    {/* Dynamic Content */}
                    {renderContent()}
                </div>
            </main>
        </div>
    )
}