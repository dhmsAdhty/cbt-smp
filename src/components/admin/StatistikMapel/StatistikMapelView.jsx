import { useState } from 'react'
import LoadingSpinner from '../shared/LoadingSpinner'
import { useMapelStats } from '../../../hooks/useMapelStats'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

// SummaryCard Component
const SummaryCard = ({ title, value, colorClass, iconBg, children }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
        <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl transition-colors duration-300 ${iconBg}`}>
                {children}
            </div>
            <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
                <p className="text-2xl font-bold text-slate-800 tracking-tight">{value}</p>
            </div>
        </div>
    </div>
)

// MapelBarChart Component
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg">
                <p className="text-sm font-bold text-slate-800 mb-1">{label}</p>
                <p className="text-sm font-medium text-orange-600">
                    Total: {payload[0].value} Soal
                </p>
            </div>
        );
    }
    return null;
};

const MapelBarChart = ({ data }) => {
    const palette = ['#f97316', '#fb923c', '#fdba74', '#ea580c', '#eab308', '#ca8a04', '#fed7aa', '#ffedd5']
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col w-full h-full min-h-[350px]">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800">Jumlah Soal per Mapel</h3>
                <p className="text-sm text-slate-500">Visual perbandingan jumlah bank soal aktif</p>
            </div>

            <div className="flex-1 w-full min-h-[250px]">
                {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center h-full">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <span className="text-2xl">📊</span>
                        </div>
                        <p className="text-sm font-medium text-slate-600">Belum ada data tersedia</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="namaMapel"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                            <Bar
                                dataKey="jumlahSoal"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                                animationDuration={1500}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    )
}

// KelasDistributionChart Component
const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 p-2 rounded-lg shadow-md flex items-center justify-center">
                <span className="font-semibold text-slate-800 mr-2">{payload[0].name}:</span>
                <span className="text-orange-600 font-bold">{payload[0].value} Soal</span>
            </div>
        );
    }
    return null;
};

const KelasDistributionChart = ({ data }) => {
    const classCount = new Map()
    const palette = ['#f97316', '#fb923c', '#fdba74', '#ea580c', '#eab308', '#ca8a04', '#fed7aa', '#ffedd5']

    data.forEach(item => {
        item.kelasList.forEach(kelas => {
            classCount.set(kelas, (classCount.get(kelas) || 0) + item.jumlahSoal)
        })
    })

    const pieData = Array.from(classCount.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

    if (pieData.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col w-full h-full min-h-[350px]">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Distribusi Soal per Kelas</h3>
                    <p className="text-sm text-slate-500">Penyebaran soal berdasarkan kelas</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <span className="text-2xl">🍩</span>
                    </div>
                    <p className="text-sm font-medium text-slate-600">Belum ada data kelas</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col w-full h-full min-h-[350px]">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800">Distribusi Soal per Kelas</h3>
                <p className="text-sm text-slate-500">Penyebaran soal berdasarkan kelas</p>
            </div>
            <div className="flex-1 w-full flex items-center justify-center min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={95}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            animationDuration={1500}
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={palette[index % palette.length]} className="focus:outline-none" />
                            ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                        <Legend
                            formatter={(value) => <span className="text-sm text-slate-600 font-medium">{value}</span>}
                            iconType="circle"
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{
                                paddingTop: '20px'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

// MapelCard Component
const MapelCard = ({ item, index }) => {
    const guruText = item.guruList.length > 0 ? item.guruList.join(', ') : 'Belum ada guru'

    return (
        <div
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4 group"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="flex justify-between items-start gap-3">
                <div>
                    <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-orange-600 transition-colors">{item.namaMapel}</h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"></span>
                        {item.guruList.length > 0 ? `Diampu oleh ${item.guruList.length} Guru` : 'Belum ada guru'}
                    </p>
                </div>
                <div className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-lg whitespace-nowrap shadow-sm border border-orange-100">
                    {item.jumlahSoal} Soal
                </div>
            </div>

            <div className="h-px w-full bg-slate-50" />

            <div className="space-y-3">
                <div>
                    <p className="text-xs font-medium text-slate-400 mb-1.5">Guru Pengampu:</p>
                    <p className="text-sm font-medium text-slate-700 line-clamp-1">{guruText}</p>
                </div>
                <div>
                    <p className="text-xs font-medium text-slate-400 mb-2">Kelas Terdaftar:</p>
                    <div className="flex flex-wrap gap-1.5">
                        {item.kelasList.length > 0 ? item.kelasList.map((cls, idx) => (
                            <span key={idx} className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-[11px] rounded-md font-medium">
                                {cls}
                            </span>
                        )) : (
                            <span className="text-xs text-slate-500 italic">Tidak ada kelas</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// Main View Component
export default function StatistikMapelView() {
    const { loading, mapelStats, error } = useMapelStats()
    const [searchTerm, setSearchTerm] = useState('')

    // Safety check in case mapelStats is ever undefined initially
    const stats = mapelStats || []

    const totalSoal = stats.reduce((sum, item) => sum + item.jumlahSoal, 0)
    const mapelAktif = stats.filter(item => item.jumlahSoal > 0).length
    const totalGuru = new Set(stats.flatMap(item => item.guruList || [])).size
    const totalKelas = new Set(stats.flatMap(item => item.kelasList || [])).size

    if (loading) {
        return <LoadingSpinner />
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-lg font-bold mb-1">Gagal Memuat Statistik</h3>
                <p className="text-sm opacity-80">{error}</p>
            </div>
        )
    }

    const currentDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
    })

    return (
        <div className="space-y-6 sm:space-y-8 animate-fade-in-up pb-8">
            {/* Last Updated Badge */}
            <div className="flex justify-end">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-medium text-slate-600">Diperbarui: {currentDate}</span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <SummaryCard
                    title="Total Soal Aktif"
                    value={totalSoal}
                    iconBg="bg-orange-50 group-hover:bg-orange-500 text-orange-500 group-hover:text-white"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </SummaryCard>

                <SummaryCard
                    title="Telah Ada Soal"
                    value={`${mapelAktif} Mapel`}
                    iconBg="bg-blue-50 group-hover:bg-blue-500 text-blue-500 group-hover:text-white"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </SummaryCard>

                <SummaryCard
                    title="Guru Terlibat"
                    value={totalGuru}
                    iconBg="bg-emerald-50 group-hover:bg-emerald-500 text-emerald-500 group-hover:text-white"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </SummaryCard>

                <SummaryCard
                    title="Kelas Terlibat"
                    value={totalKelas}
                    iconBg="bg-purple-50 group-hover:bg-purple-500 text-purple-500 group-hover:text-white"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                    </svg>
                </SummaryCard>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2">
                    <MapelBarChart data={stats} />
                </div>
                <div className="lg:col-span-1">
                    <KelasDistributionChart data={stats} />
                </div>
            </div>

            {/* Detail Mapel Section */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4 sm:mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Rincian Data Mapel</h3>
                        <p className="text-sm text-slate-500">Daftar lengkap statistik setiap mata pelajaran</p>
                    </div>
                    <div className="w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Cari mata pelajaran..."
                            className="w-full px-4 py-2 text-sm text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {stats.length > 0 ? (
                    (() => {
                        const filteredStats = stats.filter(item =>
                            item.namaMapel.toLowerCase().includes(searchTerm.toLowerCase())
                        );

                        if (filteredStats.length === 0) {
                            return (
                                <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center">
                                    <div className="text-4xl mb-3 opacity-50">🔍</div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-1">Tidak Ditemukan</h4>
                                    <p className="text-sm text-slate-500">Mata pelajaran dengan kata kunci "{searchTerm}" tidak ditemukan.</p>
                                </div>
                            );
                        }

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                                {filteredStats.map((item, index) => (
                                    <MapelCard key={item.id} item={item} index={index} />
                                ))}
                            </div>
                        );
                    })()
                ) : (
                    <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">📂</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-800 mb-1">Data Belum Tersedia</h4>
                        <p className="text-sm text-slate-500">Tambahkan mata pelajaran dan soal untuk memunculkan rincian di sini.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
