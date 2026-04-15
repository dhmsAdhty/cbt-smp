import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import * as XLSX from 'xlsx'
import {
    Search01Icon,
    Download01Icon,
    ChartHistogramIcon,
    UserIcon
} from 'hugeicons-react'
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    CartesianGrid,
    Tooltip,
    Cell
} from 'recharts'
import Swal from 'sweetalert2'
import GlassCard from '../shared/GlassCard'
import LoadingSpinner from '../shared/LoadingSpinner'
import Select from '../../ui/Select'

const RekapNilaiMapelView = () => {
    const [loading, setLoading] = useState(true)
    const [mapelLoading, setMapelLoading] = useState(true)
    const [mapelList, setMapelList] = useState([])
    const [selectedMapelId, setSelectedMapelId] = useState('')
    const [rows, setRows] = useState([])
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchMapelList()
    }, [])

    useEffect(() => {
        if (!selectedMapelId) {
            setRows([])
            setLoading(false)
            return
        }

        fetchRekapPerMapel(selectedMapelId)
    }, [selectedMapelId])

    const withTimeout = (promise, ms, label) => {
        return Promise.race([
            promise,
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Timeout ${label} > ${ms}ms`)), ms)
            })
        ])
    }

    const fetchMapelList = async () => {
        try {
            setMapelLoading(true)
            const startedAt = Date.now()
            console.log('[RekapAdmin] start fetchMapelList')

            const { data, error } = await withTimeout(
                supabase.from('mapel').select('id, nama_mapel').order('nama_mapel', { ascending: true }),
                15000,
                'mapel-list'
            )

            if (error) throw error
            setMapelList(data || [])

            console.log('[RekapAdmin] initial query done', {
                durationMs: Date.now() - startedAt,
                mapelCount: data?.length || 0
            })

            setLoading(false)
        } catch (error) {
            console.error('Error fetching mapel list:', error)
            Swal.fire('Error', 'Gagal memuat daftar mata pelajaran', 'error')
        } finally {
            setMapelLoading(false)
        }
    }

    const fetchRekapPerMapel = async (mapelId) => {
        try {
            setLoading(true)
            const startedAt = Date.now()
            console.log('[RekapAdmin] start fetchRekapPerMapel', { mapelId })

            const { data: soalList, error: soalError } = await withTimeout(
                supabase.from('bank_soal').select('id').eq('mapel_id', mapelId).is('deleted_at', null),
                15000,
                'soal-per-mapel'
            )

            if (soalError) throw soalError
            if (!soalList || soalList.length === 0) {
                setRows([])
                return
            }

            const soalIds = soalList.map((s) => s.id)
            console.log('[RekapAdmin] querying ujian_jawaban by selected mapel', {
                mapelId,
                soalIdsCount: soalIds.length
            })

            const { data: answers, error: answersError } = await withTimeout(
                supabase
                    .from('ujian_jawaban')
                    .select('siswa_id, soal_id, is_correct')
                    .in('soal_id', soalIds),
                20000,
                'answers-by-soal-ids-per-mapel'
            )

            console.log('[RekapAdmin] answers query done', {
                durationMs: Date.now() - startedAt,
                answersCount: answers?.length || 0,
                answersError: answersError?.message || null
            })

            if (answersError) throw answersError

            if (!answers || answers.length === 0) {
                setRows([])
                return
            }

            const studentIds = [...new Set(answers.map((ans) => ans.siswa_id).filter(Boolean))]
            console.log('[RekapAdmin] querying users by studentIds', {
                studentIdsCount: studentIds.length
            })

            const { data: studentList, error: studentError } = await withTimeout(
                supabase
                    .from('users')
                    .select('id, nama, kelas')
                    .in('id', studentIds),
                15000,
                'students-by-ids'
            )

            console.log('[RekapAdmin] users query done', {
                durationMs: Date.now() - startedAt,
                studentListCount: studentList?.length || 0,
                studentError: studentError?.message || null
            })

            if (studentError) throw studentError

            const selectedMapel = mapelList.find((m) => String(m.id) === String(mapelId))
            const selectedMapelName = selectedMapel?.nama_mapel || 'Mapel'

            const studentMap = {}
            studentList?.forEach((s) => {
                studentMap[s.id] = {
                    nama: s.nama || 'Tanpa Nama',
                    kelas: s.kelas || '-'
                }
            })

            const grouped = {}
            answers.forEach((ans) => {
                const student = studentMap[ans.siswa_id]

                if (!student) return

                const key = `${mapelId}_${ans.siswa_id}`
                if (!grouped[key]) {
                    grouped[key] = {
                        mapelId,
                        namaMapel: selectedMapelName,
                        studentId: ans.siswa_id,
                        namaSiswa: student.nama,
                        kelas: student.kelas,
                        answeredCount: 0,
                        correctCount: 0
                    }
                }

                grouped[key].answeredCount += 1
                if (ans.is_correct) grouped[key].correctCount += 1
            })

            const compiled = Object.values(grouped)
                .map((item) => ({
                    ...item,
                    nilai: item.answeredCount > 0 ? Number(((item.correctCount / item.answeredCount) * 100).toFixed(1)) : 0
                }))
                .sort((a, b) => b.nilai - a.nilai)

            setRows(compiled)
            console.log('[RekapAdmin] completed', {
                durationMs: Date.now() - startedAt,
                groupedRows: compiled.length,
                mapelId
            })
        } catch (error) {
            console.error('Error fetching admin rekap nilai mapel:', error)
            Swal.fire('Error', 'Gagal memuat rekap nilai mapel terpilih', 'error')
        } finally {
            setLoading(false)
            console.log('[RekapAdmin] loading=false')
        }
    }

    const filteredRows = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase()
        if (!keyword) return rows

        return rows.filter((row) =>
            row.namaSiswa?.toLowerCase().includes(keyword) ||
            row.kelas?.toLowerCase().includes(keyword)
        )
    }, [rows, searchTerm])

    const chartData = useMemo(() => {
        if (rows.length === 0) return []

        const sorted = [...rows].sort((a, b) => b.nilai - a.nilai)
        const top = sorted[0]
        const low = sorted[sorted.length - 1]

        return [
            {
                namaMapel: top?.namaMapel || '-',
                tertinggi: top?.nilai || 0,
                terendah: low?.nilai || 0,
                siswaTertinggi: top?.namaSiswa || '-',
                siswaTerendah: low?.namaSiswa || '-'
            }
        ]
    }, [rows])

    const handleExport = () => {
        if (!selectedMapelId) {
            Swal.fire('Info', 'Pilih mata pelajaran terlebih dahulu', 'info')
            return
        }

        const exportRows = rows.map((row) => ({
            'Mata Pelajaran': row.namaMapel,
            'Nama Siswa': row.namaSiswa,
            'Kelas': row.kelas,
            'Jawaban Benar': row.correctCount,
            'Total Jawaban': row.answeredCount,
            'Nilai': row.nilai,
            'Status': row.nilai >= 70 ? 'LULUS' : 'REMEDIAL'
        }))

        const summaryRows = chartData.map((item) => ({
            'Mata Pelajaran': item.namaMapel,
            'Siswa Tertinggi': item.siswaTertinggi,
            'Nilai Tertinggi': item.tertinggi,
            'Siswa Terendah': item.siswaTerendah,
            'Nilai Terendah': item.terendah
        }))

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportRows), 'Rekap Nilai Semua')
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Ringkasan TertinggiTerendah')
        const mapelName = mapelList.find((m) => String(m.id) === String(selectedMapelId))?.nama_mapel || 'mapel'
        XLSX.writeFile(wb, `rekap-${mapelName}-${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const selectedMapelName = mapelList.find((m) => String(m.id) === String(selectedMapelId))?.nama_mapel || '-'

    const mapelOptions = mapelList.map((mapel) => ({
        value: String(mapel.id),
        label: mapel.nama_mapel
    }))

    const topRow = rows.length > 0 ? [...rows].sort((a, b) => b.nilai - a.nilai)[0] : null
    const lowRow = rows.length > 0 ? [...rows].sort((a, b) => a.nilai - b.nilai)[0] : null

    const scoreCompareData = rows.length > 0
        ? [
            { label: 'Tertinggi', nilai: topRow?.nilai || 0, nama: topRow?.namaSiswa || '-' },
            { label: 'Terendah', nilai: lowRow?.nilai || 0, nama: lowRow?.namaSiswa || '-' }
        ]
        : []

    if (mapelLoading) {
        return (
            <div className="py-14">
                <LoadingSpinner text="Memuat daftar mapel..." />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-[70]">
                <GlassCard className="p-5 relative z-[80]">
                    <Select
                        label="Pilih Mata Pelajaran (Wajib)"
                        value={selectedMapelId}
                        onChange={setSelectedMapelId}
                        options={mapelOptions}
                        placeholder="-- Pilih Mapel --"
                        variant="blue"
                    />
                </GlassCard>
                <GlassCard className="p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-[#e5f3fb] text-[#0085db]">
                            <UserIcon size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-[#5f686f]">Total Rekap Siswa-Mapel</p>
                            <p className="text-2xl font-bold text-[#111c2d]">{rows.length}</p>
                        </div>
                    </div>
                </GlassCard>
                <GlassCard className="p-5">
                    <button
                        disabled={!selectedMapelId || rows.length === 0}
                        onClick={handleExport}
                        className="w-full h-full min-h-[72px] rounded-xl bg-linear-to-r from-[#0085db] to-[#0071ba] enabled:hover:from-[#0071ba] enabled:hover:to-[#00639f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                        <Download01Icon size={18} />
                        <span>Export Rekap Mapel Terpilih</span>
                    </button>
                </GlassCard>
            </div>

            {!selectedMapelId ? (
                <GlassCard className="p-6 text-sm text-[#5f686f]">
                    Pilih mata pelajaran terlebih dahulu untuk menampilkan tabel rekap nilai, grafik tertinggi/terendah, dan tombol export.
                </GlassCard>
            ) : loading ? (
                <div className="py-10">
                    <LoadingSpinner text="Memuat rekap mapel terpilih..." />
                </div>
            ) : (
                <>

            <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-4 text-[#111c2d]">
                    <ChartHistogramIcon size={18} />
                    <h3 className="font-bold">Grafik Nilai Tertinggi & Terendah Mapel Terpilih</h3>
                </div>

                {chartData.length === 0 ? (
                    <p className="text-sm text-gray-500">Belum ada data nilai untuk divisualisasikan.</p>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                        <div className="rounded-2xl border border-[#e7ecf0] bg-white p-3 h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <defs>
                                        <linearGradient id="topScoreGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.95} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.65} />
                                        </linearGradient>
                                        <linearGradient id="lowScoreGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.95} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.65} />
                                        </linearGradient>
                                    </defs>
                                    <Pie
                                        data={scoreCompareData}
                                        dataKey="nilai"
                                        nameKey="label"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={52}
                                        outerRadius={90}
                                        paddingAngle={6}
                                        stroke="rgba(255,255,255,0.9)"
                                        strokeWidth={2}
                                    >
                                        {scoreCompareData.map((entry, i) => (
                                            <Cell key={`score-${i}`} fill={entry.label === 'Tertinggi' ? 'url(#topScoreGradient)' : 'url(#lowScoreGradient)'} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            borderRadius: '12px',
                                            border: '1px solid #e5e7eb',
                                            fontSize: '12px'
                                        }}
                                        formatter={(value, _name, props) => [`${value} (${props.payload.nama})`, `Nilai ${props.payload.label}`]}
                                        labelFormatter={() => `Mapel: ${selectedMapelName}`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="rounded-2xl border border-[#e7ecf0] bg-gradient-to-br from-[#f0f5f9] to-white p-4 flex flex-col justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-[#707a82] mb-1">Mapel Aktif</p>
                                <p className="text-lg font-bold text-[#111c2d] mb-4">{selectedMapelName}</p>

                                <div className="space-y-3">
                                    <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-3">
                                        <p className="text-xs font-semibold text-green-700 mb-1">SISWA TERTINGGI</p>
                                        <p className="text-base font-bold text-gray-800">{topRow?.namaSiswa || '-'}</p>
                                        <p className="text-sm text-gray-600">Nilai: <span className="font-semibold text-green-700">{topRow?.nilai ?? '-'}</span></p>
                                    </div>
                                    <div className="rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 p-3">
                                        <p className="text-xs font-semibold text-red-700 mb-1">SISWA TERENDAH</p>
                                        <p className="text-base font-bold text-gray-800">{lowRow?.namaSiswa || '-'}</p>
                                        <p className="text-sm text-gray-600">Nilai: <span className="font-semibold text-red-700">{lowRow?.nilai ?? '-'}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </GlassCard>

            <GlassCard className="p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <h3 className="font-bold text-[#111c2d]">Tabel Rekap Nilai Siswa pada Mapel Terpilih</h3>
                    <div className="relative w-full md:w-80">
                        <Search01Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari siswa atau kelas..."
                            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#e7ecf0] bg-[#f0f5f9] focus:ring-2 focus:ring-[#0085db]/20 focus:border-[#0085db] outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-[#f0f5f9] text-[#5f686f]">
                                <th className="px-3 py-3 text-left font-semibold">Mapel</th>
                                <th className="px-3 py-3 text-left font-semibold">Nama Siswa</th>
                                <th className="px-3 py-3 text-left font-semibold">Kelas</th>
                                <th className="px-3 py-3 text-center font-semibold">Benar</th>
                                <th className="px-3 py-3 text-center font-semibold">Total</th>
                                <th className="px-3 py-3 text-center font-semibold">Nilai</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-3 py-8 text-center text-[#707a82]">Data belum tersedia.</td>
                                </tr>
                            ) : (
                                filteredRows.map((row) => (
                                    <tr key={`${row.mapelId}_${row.studentId}`} className="border-b border-[#eef2f6] hover:bg-[#f8fbfe]">
                                        <td className="px-3 py-3 font-medium text-[#111c2d]">{row.namaMapel}</td>
                                        <td className="px-3 py-3 text-[#5f686f]">{row.namaSiswa}</td>
                                        <td className="px-3 py-3 text-[#5f686f]">{row.kelas}</td>
                                        <td className="px-3 py-3 text-center text-[#5f686f]">{row.correctCount}</td>
                                        <td className="px-3 py-3 text-center text-[#5f686f]">{row.answeredCount}</td>
                                        <td className="px-3 py-3 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${row.nilai >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {row.nilai}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
                </>
            )}
        </div>
    )
}

export default RekapNilaiMapelView
