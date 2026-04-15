import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import DashboardView from '../../components/admin/Dashboard/DashboardView'
import UsersView from '../../components/admin/Users/UsersView'
import KelasView from '../../components/admin/Kelas/KelasView'
import MapelView from '../../components/admin/Mapel/MapelView'
import StatistikMapelView from '../../components/admin/StatistikMapel/StatistikMapelView'
import SettingsView from '../../components/admin/Settings/SettingsView'
import TrashBankSoalView from '../../components/admin/TrashBankSoal/TrashBankSoalView'
import RekapNilaiMapelView from '../../components/admin/RekapNilaiMapel/RekapNilaiMapelView'

const PAGE_META = {
    dashboard:        { title: 'Dashboard Admin',              desc: 'Selamat datang di panel admin CBT' },
    users:            { title: 'Manajemen Users',              desc: 'Kelola data pengguna sistem' },
    kelas:            { title: 'Manajemen Kelas',              desc: 'Kelola data kelas' },
    mapel:            { title: 'Manajemen Mata Pelajaran',     desc: 'Kelola data mata pelajaran' },
    statistik_mapel:  { title: 'Statistik Mata Pelajaran',     desc: 'Pantau jumlah soal, kelas, dan guru per mapel' },
    trash_soal:       { title: 'Soal Terhapus',                desc: 'Kelola dan pulihkan soal yang telah dihapus' },
    rekap_nilai_mapel:{ title: 'Rekap Nilai Semua Mapel',      desc: 'Lihat rekap nilai seluruh siswa di seluruh mapel' },
    settings:         { title: 'Pengaturan Akun',              desc: 'Kelola profil dan pengaturan akun Anda' },
}

export default function Admin() {
    const [activeTab, setActiveTab] = useState('dashboard')
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => { setIsVisible(true) }, [])

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':         return <DashboardView />
            case 'users':             return <UsersView />
            case 'kelas':             return <KelasView />
            case 'mapel':             return <MapelView />
            case 'statistik_mapel':   return <StatistikMapelView />
            case 'trash_soal':        return <TrashBankSoalView />
            case 'rekap_nilai_mapel': return <RekapNilaiMapelView />
            case 'settings':          return <SettingsView />
            default:                  return <DashboardView />
        }
    }

    const meta = PAGE_META[activeTab] || PAGE_META.dashboard

    return (
        <div className="min-h-screen bg-[#f0f5f9] text-[#111c2d]">
            {/* Top Strip — matches template gradient */}
            <div className="sticky top-0 z-50 py-[15px] px-6 bg-[linear-gradient(90deg,_#0f0533_0%,_#1b0a5c_100%)]">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                    <p className="text-white text-sm font-semibold tracking-wide">CBT Admin Panel</p>
                    <span className="text-blue-200 text-xs">Sekolah Tahfidz Al Hikmah</span>
                </div>
            </div>

            {/* Main wrapper — matches template #main-wrapper */}
            <div className="flex p-5 xl:pr-0">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole="admin" />

                {/* Page wrapper — matches template .page-wrapper */}
                <div className={`w-full lg:ml-[270px] xl:px-6 px-0 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <main className="h-full max-w-full">
                        <div className="p-0 flex flex-col gap-6">

                            {/* Header — matches template header */}
                            <header className="bg-white shadow-[0px_2px_6px_rgba(37,83,185,0.1)] rounded-[18px] w-full text-sm py-4 px-6 border border-[#e7ecf0]">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div>
                                        <h1 className="text-xl font-semibold text-[#111c2d]">{meta.title}</h1>
                                        <p className="text-[#707a82] text-sm mt-0.5">{meta.desc}</p>
                                    </div>
                                    <span className="inline-flex w-fit px-3 py-1.5 rounded-full bg-[#e5f3fb] text-[#0085db] text-xs font-semibold">
                                        Administrator
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
