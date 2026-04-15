import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LoadingSpinner from '../shared/LoadingSpinner'
import GlassCard from '../shared/GlassCard'
import { useMapelStats } from '../../../hooks/useMapelStats'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { 
    BookOpen02Icon, 
    NoteEditIcon, 
    UserMultiple02Icon, 
    MeetingRoomIcon, 
    Search01Icon, 
    Calendar02Icon, 
    ChartHistogramIcon,
    PieChartIcon
} from 'hugeicons-react'

// =====================
// Component: SummaryCard
// =====================
const SummaryCard = ({ title, value, subtitle, colorClass, iconBg, delay, children }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
    >
        <GlassCard className="h-full overflow-hidden group">
            <div className="p-6 relative">
                {/* Decorative Background Blob */}
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150 ${iconBg.split(' ')[0]}`} />
                
                <div className="flex items-start gap-4">
                    <div className={`p-4 rounded-2xl transition-all duration-300 shadow-sm ${iconBg}`}>
                        {children}
                    </div>
                    <div className="flex-1 relative z-10">
                        <h3 className="text-sm font-semibold text-gray-500 mb-1">{title}</h3>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">{value}</p>
                        {subtitle && <p className="text-xs font-medium text-gray-400 mt-1">{subtitle}</p>}
                    </div>
                </div>
            </div>
        </GlassCard>
    </motion.div>
)

// =====================
// Custom Tooltips
// =====================
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-[#e7ecf0] p-4 rounded-xl shadow-md">
                <p className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0085db]"></span>
                    {label}
                </p>
                <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-600 flex justify-between gap-4">
                        <span>Total Soal:</span>
                        <span className="font-bold text-gray-900">{payload[0].value}</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
}

const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-[#e7ecf0] p-3 rounded-xl shadow-md flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
                    <span className="font-bold text-gray-800">{payload[0].name}</span>
                </div>
                <div className="flex justify-between items-center text-sm gap-4">
                    <span className="text-gray-500">Jumlah Soal</span>
                    <span className="font-bold text-gray-900">{payload[0].value}</span>
                </div>
            </div>
        );
    }
    return null;
}

// =====================
// Charts
// =====================
const MapelBarChart = ({ data }) => {
    const palette = ['#0085db', '#46caeb', '#0071ba', '#3cacc8', '#4bd08b', '#40b176', '#5f686f', '#111c2d']
    
    return (
        <GlassCard className="h-full min-h-[380px] flex flex-col">
            <div className="p-6 border-b border-gray-100/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-[#e5f3fb] to-[#e1f5fa] rounded-lg text-[#0085db]">
                        <ChartHistogramIcon size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Distribusi per Mata Pelajaran</h3>
                        <p className="text-xs text-gray-500">Grafik perbandingan total soal aktif</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 flex flex-col w-full h-[300px]">
                {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <ChartHistogramIcon size={32} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Belum ada data tersedia</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                {palette.map((color, idx) => (
                                    <linearGradient key={`colorUv${idx}`} id={`colorUv${idx}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={1}/>
                                        <stop offset="95%" stopColor={color} stopOpacity={0.6}/>
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} strokeOpacity={0.5} stroke="#e7ecf0" />
                            <XAxis
                                dataKey="namaMapel"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                                dx={-10}
                            />
                            <Tooltip cursor={{ fill: 'rgba(229, 243, 251, 0.8)' }} content={<CustomTooltip />} />
                            <Bar
                                dataKey="jumlahSoal"
                                radius={[8, 8, 4, 4]}
                                barSize={40}
                                animationDuration={1500}
                                animationEasing="ease-out"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`url(#colorUv${index % palette.length})`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </GlassCard>
    )
}

const KelasDistributionChart = ({ data }) => {
    const classCount = new Map()
    // Golden-Orange theme palette
    const palette = ['#0085db', '#46caeb', '#0071ba', '#3cacc8', '#4bd08b', '#40b176', '#5f686f', '#111c2d']

    data.forEach(item => {
        item.kelasList.forEach(kelas => {
            classCount.set(kelas, (classCount.get(kelas) || 0) + item.jumlahSoal)
        })
    })

    const pieData = Array.from(classCount.entries())
        .map(([name, value], idx) => ({ name, value, fill: palette[idx % palette.length] }))
        .sort((a, b) => b.value - a.value)

    return (
        <GlassCard className="h-full min-h-[380px] flex flex-col">
            <div className="p-6 border-b border-gray-100/50 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#e5f3fb] to-[#e1f5fa] rounded-lg text-[#0085db]">
                    <PieChartIcon size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Distribusi Kelas</h3>
                    <p className="text-xs text-gray-500">Penyebaran soal berdasarkan kelas</p>
                </div>
            </div>

            <div className="flex-1 p-4 w-full flex items-center justify-center min-h-[250px]">
                {pieData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <PieChartIcon size={32} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Belum ada data kelas</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <defs>
                                {pieData.map((entry, index) => (
                                    <linearGradient key={`pieGradient${index}`} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor={entry.fill} stopOpacity={1}/>
                                        <stop offset="100%" stopColor={entry.fill} stopOpacity={0.7}/>
                                    </linearGradient>
                                ))}
                            </defs>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={105}
                                paddingAngle={6}
                                dataKey="value"
                                stroke="rgba(255,255,255,0.7)"
                                strokeWidth={2}
                                animationDuration={1500}
                                animationEasing="ease-out"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`url(#pieGradient${index})`} className="outline-none" />
                                ))}
                            </Pie>
                            <Tooltip content={<PieTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        </GlassCard>
    )
}

// =====================
// Data Card (Detail Mapel)
// =====================
const MapelCard = ({ item, delay = 0 }) => {
    const guruText = item.guruList.length > 0 ? item.guruList.join(', ') : 'Belum ada guru'
    
    // Progress Bar Calcs
    const pgPercent = item.jumlahSoal > 0 ? Math.round((item.jumlahPG / item.jumlahSoal) * 100) : 0;
    const essayPercent = item.jumlahSoal > 0 ? Math.round((item.jumlahEssay / item.jumlahSoal) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="flex h-full"
        >
            <GlassCard className="w-full flex flex-col p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group hover:border-[#0085db]/20">
                {/* Header info */}
                <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-full bg-[#e5f3fb] flex items-center justify-center text-[#0085db] group-hover:scale-110 transition-transform">
                                <BookOpen02Icon size={16} />
                            </div>
                            <h4 className="font-bold text-lg text-gray-800 line-clamp-1 group-hover:text-[#0085db] transition-colors">
                                {item.namaMapel}
                            </h4>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                             <div className="px-3 py-1 bg-[#0085db] text-white text-xs font-bold rounded-lg whitespace-nowrap shadow-sm">
                                {item.jumlahSoal} Soal
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px border-b border-dashed border-gray-200 w-full mb-4" />

                {/* Progress Bar PG vs Essay */}
                <div className="mb-5">
                    <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-[#0085db] block"></span> Pilihan Ganda ({item.jumlahPG})</span>
                        <span className="flex items-center gap-1.5">Essay ({item.jumlahEssay}) <span className="w-2 h-2 rounded-sm bg-[#46caeb] block"></span></span>
                    </div>
                    <div className="flex w-full h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div style={{ width: `${pgPercent}%` }} className="bg-[#0085db] transition-all duration-1000" />
                        <div style={{ width: `${essayPercent}%` }} className="bg-[#46caeb] transition-all duration-1000" />
                    </div>
                </div>

                {/* Details Section */}
                <div className="space-y-4 flex-1">
                    {/* Teachers */}
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <UserMultiple02Icon size={14} className="text-gray-400" />
                            <p className="text-xs font-medium text-gray-500">Guru Pengampu:</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 line-clamp-2">{guruText}</p>
                    </div>

                    {/* Classes */}
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-1.5 mb-2">
                            <MeetingRoomIcon size={14} className="text-gray-400" />
                            <p className="text-xs font-medium text-gray-500">Kelas Terdaftar:</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {item.kelasList.length > 0 ? (
                                item.kelasList.map((cls, idx) => (
                                    <span key={idx} className="px-2.5 py-1 bg-white border border-gray-200 text-gray-600 text-xs rounded-md shadow-xs font-medium">
                                        {cls}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-gray-400 italic">Tidak ada kelas bertaut</span>
                            )}
                        </div>
                    </div>
                </div>
            </GlassCard>
        </motion.div>
    )
}

// =====================
// Main Dashboard View
// =====================
export default function StatistikMapelView() {
    const { loading, mapelStats, error } = useMapelStats()
    const [searchTerm, setSearchTerm] = useState('')

    // Safety checks
    const stats = mapelStats || []

    const totalSoal = stats.reduce((sum, item) => sum + item.jumlahSoal, 0)
    const totalPG = stats.reduce((sum, item) => sum + (item.jumlahPG || 0), 0)
    const totalEssay = stats.reduce((sum, item) => sum + (item.jumlahEssay || 0), 0)
    const mapelAktif = stats.filter(item => item.jumlahSoal > 0).length
    const totalGuru = new Set(stats.flatMap(item => item.guruList || [])).size
    const totalKelas = new Set(stats.flatMap(item => item.kelasList || [])).size

    const filteredStats = useMemo(() => {
        return stats.filter(item =>
            item.namaMapel.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [stats, searchTerm]);

    if (loading) return <LoadingSpinner />

    if (error) {
        return (
            <div className="bg-red-50/80 backdrop-blur-md border border-red-200 text-red-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4 text-red-500">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Gagal Memuat Statistik</h3>
                <p className="text-sm font-medium text-red-600/80 max-w-md">{error}</p>
            </div>
        )
    }

    const currentDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
    })

    return (
        <div className="space-y-6 sm:space-y-8 pb-8">
            {/* Header & Date Badge */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Analitik Sistem</h2>
                    <p className="text-sm font-medium text-gray-500 mt-1">Pantau perkembangan bank soal harian</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-100 rounded-xl shadow-sm">
                    <Calendar02Icon size={16} className="text-[#0085db]" />
                    <span className="text-xs font-semibold text-gray-600">{currentDate}</span>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                <SummaryCard
                    title="Total Bank Soal"
                    value={totalSoal}
                    subtitle={`${totalPG} Pilihan Ganda • ${totalEssay} Essay`}
                    iconBg="bg-[#0085db] text-white"
                    delay={0.1}
                >
                    <NoteEditIcon size={28} />
                </SummaryCard>

                <SummaryCard
                    title="Mata Pelajaran Aktif"
                    value={mapelAktif}
                    subtitle={`Dari total ${stats.length} Mata Pelajaran`}
                    iconBg="bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-blue-500/30"
                    delay={0.2}
                >
                    <BookOpen02Icon size={28} />
                </SummaryCard>

                <SummaryCard
                    title="Guru Terlibat"
                    value={totalGuru}
                    subtitle="Membuat soal ke dalam bank"
                    iconBg="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-500/30"
                    delay={0.3}
                >
                    <UserMultiple02Icon size={28} />
                </SummaryCard>

                <SummaryCard
                    title="Kelas Terikat"
                    value={totalKelas}
                    subtitle="Total kelas yang diajarkan"
                    iconBg="bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-purple-500/30"
                    delay={0.4}
                >
                    <MeetingRoomIcon size={28} />
                </SummaryCard>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="lg:col-span-2"
                >
                    <MapelBarChart data={stats} />
                </motion.div>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                    className="lg:col-span-1"
                >
                    <KelasDistributionChart data={stats} />
                </motion.div>
            </div>

            {/* Mapel Cards Grid */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="pt-4"
            >
                <GlassCard className="p-6 sm:p-8">
                    {/* Header Input */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Rincian Data Subjek</h3>
                            <p className="text-sm text-gray-500 mt-1">Daftar lengkap statistik setiap mata pelajaran beserta rasionya.</p>
                        </div>
                        <div className="w-full sm:w-72 relative">
                            <Search01Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari mata pelajaran..."
                                className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0085db]/20 focus:border-[#0085db] transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Cards Content */}
                    <AnimatePresence mode="popLayout">
                        {filteredStats.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                                {filteredStats.map((item, index) => (
                                    <MapelCard key={item.id} item={item} delay={0.1 * (index % 10)} />
                                ))}
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-16 px-4 bg-white/50 border border-dashed border-gray-200 rounded-2xl"
                            >
                                <div className="p-4 bg-gray-50 rounded-full mb-3">
                                    <Search01Icon size={32} className="text-gray-300" />
                                </div>
                                <h4 className="text-lg font-bold text-gray-800 mb-1">Data Tidak Ditemukan</h4>
                                <p className="text-sm text-gray-500 max-w-md text-center">
                                    {stats.length > 0 ? `Mata pelajaran dengan kata kunci "${searchTerm}" tidak ditemukan.` : 'Tidak ada mata pelajaran yang telah terdaftar di database.'}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </GlassCard>
            </motion.div>
        </div>
    )
}
