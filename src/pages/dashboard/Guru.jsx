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

const PAGE_META = {
    dashboard:   { title: 'Dashboard Guru',  desc: 'Selamat datang di panel guru CBT' },
    bank_soal:   { title: 'Bank Soal',        desc: 'Kelola soal ujian mata pelajaran Anda' },
    ujian:       { title: 'Ujian',            desc: 'Buat dan kelola ujian siswa' },
    rekap_nilai: { title: 'Rekap Nilai',      desc: 'Lihat rekap nilai siswa' },
    settings:    { title: 'Pengaturan',       desc: 'Kelola profil dan pengaturan akun Anda' },
}

export default function Guru() {
    const [activeTab, setActiveTab] = useState('dashboard')
    const [isVisible, setIsVisible] = useState(false)
    const [greeting, setGreeting] = useState('')
    const [stats, setStats] = useState({
        totalSoal: 0,
        ujianBerlangsung: 0,
        ujianMendatang: 0,
        totalSiswa: 0
    })

    useEffect(() => {
        setIsVisible(true)
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
                .from('users').select('mapel').eq('id', user.id).single()

            if (!guruData?.mapel) return

            const { data: mapelData } = await supabase
                .from('mapel').select('id').eq('nama_mapel', guruData.mapel).single()

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
        { id: 'dashboard',   label: 'Dashboard',    icon: DashboardSquare02Icon },
        { id: 'bank_soal',   label: 'Bank Soal',    icon: BookOpen02Icon },
        { id: 'ujian',       label: 'Ujian',        icon: PresentationBarChart02Icon },
        { id: 'rekap_nilai', label: 'Rekap Nilai',  icon: CheckmarkCircle02Icon },
        { id: 'settings',    label: 'Pengaturan',   icon: Settings01Icon }
    ]

    const StatItem = ({ icon: Icon, label, value, bg }) => (
        <div className="bg-white rounded-[18px] border border-[#e7ecf0] shadow-[0px_2px_6px_rgba(37,83,185,0.1)] p-6">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center text-white shrink-0`}>
                    <Icon size={20} />
                </div>
                <div>
                    <p className="text-sm text-[#707a82]">{label}</p>
                    <p className="text-2xl font-bold text-[#111c2d]">{value}</p>
                </div>
            </div>
        </div>
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
                            {/* Welcome banner */}
                            <div className="bg-[linear-gradient(90deg,_#0085db_0%,_#46caeb_100%)] rounded-[18px] p-6 text-white shadow-[0px_2px_6px_rgba(37,83,185,0.1)]">
                                <h2 className="text-xl font-bold mb-1">{greeting}, Guru!</h2>
                                <p className="text-blue-100 text-sm">
                                    {stats.ujianBerlangsung} ujian aktif &bull; {stats.ujianMendatang} ujian draft
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatItem icon={BookOpen02Icon}           label="Total Soal"   value={stats.totalSoal}         bg="bg-[#0085db]" />
                                <StatItem icon={PresentationBarChart02Icon} label="Ujian Aktif" value={stats.ujianBerlangsung}  bg="bg-[#4bd08b]" />
                                <StatItem icon={Clock02Icon}              label="Ujian Draft"  value={stats.ujianMendatang}    bg="bg-[#f8c076]" />
                                <StatItem icon={DashboardSquare02Icon}    label="Total Siswa"  value={stats.totalSiswa}        bg="bg-[#5a6a85]" />
                            </div>

                            {/* Quick actions */}
                            <div>
                                <h3 className="text-base font-semibold text-[#111c2d] mb-4">Menu Cepat</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                        { id: 'bank_soal', label: 'Bank Soal', icon: BookOpen02Icon, bg: 'bg-[#0085db]' },
                                        { id: 'ujian', label: 'Ujian', icon: PresentationBarChart02Icon, bg: 'bg-[#4bd08b]' },
                                        { id: 'rekap_nilai', label: 'Rekap Nilai', icon: CheckmarkCircle02Icon, bg: 'bg-[#5a6a85]' },
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className="bg-white rounded-[18px] border border-[#e7ecf0] shadow-[0px_2px_6px_rgba(37,83,185,0.1)] p-6 text-left hover:shadow-md transition-all group"
                                        >
                                            <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                                                <item.icon size={18} />
                                            </div>
                                            <h3 className="font-semibold text-[#111c2d] text-sm">{item.label}</h3>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                case 'bank_soal':   return <BankSoalView />
                case 'ujian':       return <UjianView />
                case 'rekap_nilai': return <RekapNilaiView />
                case 'settings':    return <SettingsView />
                default:            return null
            }
        })()

        return (
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial="initial" animate="animate" exit="exit" variants={pageVariants}>
                    {content}
                </motion.div>
            </AnimatePresence>
        )
    }

    const meta = PAGE_META[activeTab] || PAGE_META.dashboard

    return (
        <div className="min-h-screen bg-[#f0f5f9] text-[#111c2d]">
            {/* Top Strip */}
            <div className="sticky top-0 z-50 py-[15px] px-6 bg-[linear-gradient(90deg,_#0f0533_0%,_#1b0a5c_100%)]">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                    <p className="text-white text-sm font-semibold tracking-wide">CBT Guru Panel</p>
                    <span className="text-blue-200 text-xs">Sekolah Tahfidz Al Hikmah</span>
                </div>
            </div>

            <div className="flex p-5 xl:pr-0">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    menuItems={menuItems}
                    themeColor="blue"
                    userRole="guru"
                />

                <div className={`w-full lg:ml-[270px] xl:px-6 px-0 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <main className="h-full max-w-full">
                        <div className="p-0 flex flex-col gap-6">
                            {/* Header */}
                            <header className="bg-white shadow-[0px_2px_6px_rgba(37,83,185,0.1)] rounded-[18px] w-full text-sm py-4 px-6 border border-[#e7ecf0]">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div>
                                        <h1 className="text-xl font-semibold text-[#111c2d]">{meta.title}</h1>
                                        <p className="text-[#707a82] text-sm mt-0.5">{meta.desc}</p>
                                    </div>
                                    <span className="inline-flex w-fit px-3 py-1.5 rounded-full bg-[#e5f3fb] text-[#0085db] text-xs font-semibold">
                                        Guru
                                    </span>
                                </div>
                            </header>

                            {renderContent()}

                            <footer>
                                <p className="text-sm text-[#707a82] font-normal p-3 text-center">
                                    CBT &copy; {new Date().getFullYear()} Sekolah Tahfidz Al Hikmah
                                </p>
                            </footer>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}