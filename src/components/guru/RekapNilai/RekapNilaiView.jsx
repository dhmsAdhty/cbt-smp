import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import {
    Search01Icon,
    Download01Icon,
    CheckmarkCircle02Icon,
    Cancel01Icon
} from 'hugeicons-react'
import GlassCard from '../../admin/shared/GlassCard'
import LoadingSpinner from '../../admin/shared/LoadingSpinner'
import ActionButton from '../../admin/shared/ActionButton'
import Swal from 'sweetalert2'

const RekapNilaiView = () => {
    const [rekapData, setRekapData] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [mapelDetails, setMapelDetails] = useState(null)

    useEffect(() => {
        fetchRekapData()
    }, [])

    const fetchRekapData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Get guru's mapel
            const { data: guruData, error: guruError } = await supabase
                .from('users')
                .select('mapel')
                .eq('id', user.id)
                .single()

            if (guruError) throw guruError
            if (!guruData?.mapel) {
                setLoading(false)
                return
            }

            // 2. Get mapel details (id, name)
            const { data: mapelData, error: mapelError } = await supabase
                .from('mapel')
                .select('*')
                .eq('nama_mapel', guruData.mapel)
                .single()

            if (mapelError) throw mapelError
            setMapelDetails(mapelData)

            // 3. Get all students who have taken exams for this mapel
            // Need a better way to aggregate, but for now fetch raw answers
            // Optimization: In a real app, uses a materialized view or specific 'ujian_session' table

            const { data: answers, error: answersError } = await supabase
                .from('ujian_jawaban')
                .select(`
                    id,
                    is_correct,
                    siswa:users!siswa_id(nama, kelas),
                    soal:bank_soal!soal_id(bobot, mapel_id)
                `)
                .eq('soal.mapel_id', mapelData.id)

            if (answersError) throw answersError

            // Process data to calculate scores per student
            const studentScores = {}

            answers.forEach(ans => {
                if (!ans.siswa || !ans.soal) return // Skip invalid data

                const siswaName = ans.siswa.nama
                const siswaKelas = ans.siswa.kelas || 'Umum'
                const key = `${siswaName}-${siswaKelas}`

                if (!studentScores[key]) {
                    studentScores[key] = {
                        nama: siswaName,
                        kelas: siswaKelas,
                        totalBobot: 0,
                        earnedBobot: 0,
                        answeredCount: 0,
                        correctCount: 0
                    }
                }

                studentScores[key].totalBobot += ans.soal.bobot
                studentScores[key].answeredCount += 1

                if (ans.is_correct) {
                    studentScores[key].earnedBobot += ans.soal.bobot
                    studentScores[key].correctCount += 1
                }
            })

            const formattedData = Object.values(studentScores).map(s => ({
                ...s,
                nilai: s.totalBobot > 0 ? ((s.earnedBobot / s.totalBobot) * 100).toFixed(1) : 0
            }))

            setRekapData(formattedData)

        } catch (error) {
            console.error('Error fetching rekap:', error)
            Swal.fire('Error', 'Gagal memuat rekap nilai', 'error')
        } finally {
            setLoading(false)
        }
    }

    const filteredData = rekapData.filter(item =>
        item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kelas.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleExport = () => {
        // Simple CSV Export
        const headers = ['Nama Siswa', 'Kelas', 'Benar', 'Total Soal', 'Nilai']
        const csvContent = [
            headers.join(','),
            ...filteredData.map(row => [
                `"${row.nama}"`,
                `"${row.kelas}"`,
                row.correctCount,
                row.answeredCount,
                row.nilai
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `rekap-nilai-${mapelDetails?.nama_mapel}-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Toolbar */}
            <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari siswa atau kelas..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {mapelDetails && (
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold text-sm">
                        Mapel: {mapelDetails.nama_mapel}
                    </div>
                )}
                <ActionButton
                    variant="outline"
                    icon={Download01Icon}
                    onClick={handleExport}
                    disabled={filteredData.length === 0}
                >
                    Export CSV
                </ActionButton>
            </GlassCard>

            {loading ? (
                <div className="flex justify-center p-12">
                    <LoadingSpinner />
                </div>
            ) : filteredData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">Belum ada data nilai ujian.</p>
                </div>
            ) : (
                <GlassCard className="overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kelas</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Jawaban Benar</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Nilai Akhir</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredData.map((row, index) => (
                                <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {row.nama}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                        {row.kelas}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-400">
                                        {row.correctCount} / {row.answeredCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`
                                            px-3 py-1 rounded-full text-sm font-bold
                                            ${parseFloat(row.nilai) >= 75
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'}
                                        `}>
                                            {row.nilai}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {parseFloat(row.nilai) >= 75 ? (
                                            <div className="flex items-center justify-center gap-1 text-green-600">
                                                <CheckmarkCircle02Icon size={16} />
                                                <span className="text-xs font-bold">LULUS</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-1 text-red-500">
                                                <Cancel01Icon size={16} />
                                                <span className="text-xs font-bold">REMEDIAL</span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </GlassCard>
            )}
        </div>
    )
}

export default RekapNilaiView
