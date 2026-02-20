import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import {
    CheckmarkCircle02Icon,
    Cancel01Icon,
    ArrowLeft01Icon,
    BookOpen01Icon
} from 'hugeicons-react'

export default function HasilUjian() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [ujian, setUjian] = useState(null)
    const [stats, setStats] = useState({
        score: 0,
        correct: 0,
        wrong: 0,
        total: 0,
        answered: 0
    })

    useEffect(() => {
        fetchResult()
    }, [id])

    const fetchResult = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                navigate('/')
                return
            }

            // 1. Fetch Exam Details
            const { data: examData, error: examError } = await supabase
                .from('ujian')
                .select('*')
                .eq('id', id)
                .single()

            if (examError) throw examError
            setUjian(examData)

            // 2. Fetch Total Questions count
            const { count: totalQuestions, error: countError } = await supabase
                .from('ujian_soal')
                .select('*', { count: 'exact', head: true })
                .eq('ujian_id', id)

            if (countError) throw countError

            // 3. Fetch Student Answers
            // Note: We need to filter by student_id and question IDs related to this exam.
            // A safer way is to fetch answers where soal_id is in (select id from bank_soal where id in (select soal_id from ujian_soal where ujian_id = ...))
            // But for simplicity/speed, we fetch all answers for this student and filter effectively,
            // OR better: join with bank_soal?
            // Actually, we can fetch `ujian_jawaban` filtered by `siswa_id`.
            // BUT identifying which answers belong to THIS exam requires joining.
            // Since we don't have `ujian_id` in `ujian_jawaban` (based on previous steps), we must rely on `soal_id`.

            // Get list of soal_ids for this exam first
            const { data: soalIdsData } = await supabase
                .from('ujian_soal')
                .select('soal_id')
                .eq('ujian_id', id)

            const soalIds = soalIdsData?.map(s => s.soal_id) || []

            if (soalIds.length === 0) {
                setStats({ score: 0, correct: 0, wrong: 0, total: 0, answered: 0 })
                return
            }

            // Fetch soal details to filter out deleted ones
            const { data: soalDetails } = await supabase
                .from('bank_soal')
                .select('id')
                .in('id', soalIds)
                .is('deleted_at', null)

            const activesoalIds = soalDetails?.map(s => s.id) || []

            const { data: answers, error: answerError } = await supabase
                .from('ujian_jawaban')
                .select('*')
                .eq('siswa_id', user.id)
                .in('soal_id', activesoalIds)

            if (answerError) throw answerError

            // Calculate Stats
            const correctCount = answers.filter(a => a.is_correct).length
            const wrongCount = answers.filter(a => a.is_correct === false).length // explicitly false, not null
            // For essay, is_correct might be null.

            // Simple Score Calculation: (Correct / Total) * 100
            // This assumes equal weight for now unless we fetch weights.
            const finalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

            setStats({
                score: finalScore,
                correct: correctCount,
                wrong: wrongCount, // This might include Essays waiting for grade if we treat !true as wrong in simple view
                total: totalQuestions,
                answered: answers.length
            })

        } catch (error) {
            console.error('Error fetching result:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!ujian) return null

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/dashboard/siswa')}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors group"
                >
                    <ArrowLeft01Icon size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Kembali ke Dashboard</span>
                </button>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-linear-to-r from-blue-600 to-blue-700 p-8 text-white">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold mb-1">{ujian.judul}</h1>
                                <p className="text-blue-100">{ujian.mata_pelajaran}</p>
                            </div>
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                <CheckmarkCircle02Icon size={32} className="text-white" />
                            </div>
                        </div>

                        {/* Score Display */}
                        <div className="bg-white rounded-xl p-6 text-center">
                            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Nilai Akhir</div>
                            <div className={`text-5xl font-black mb-1 ${stats.score >= 75 ? 'text-green-500' :
                                    stats.score >= 50 ? 'text-yellow-500' :
                                        'text-red-500'
                                }`}>
                                {stats.score}
                            </div>
                            <div className="text-gray-400 text-sm font-medium">dari 100 poin</div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="p-8">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Rincian Hasil</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Correct Answers */}
                            <div className="bg-green-50 rounded-xl p-5 border border-green-100 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckmarkCircle02Icon size={24} className="text-green-600" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-green-700">{stats.correct}</div>
                                        <div className="text-xs text-green-600 font-semibold uppercase tracking-wide">Jawaban Benar</div>
                                    </div>
                                </div>
                            </div>

                            {/* Wrong Answers */}
                            <div className="bg-red-50 rounded-xl p-5 border border-red-100 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                        <Cancel01Icon size={24} className="text-red-600" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-red-700">{stats.wrong}</div>
                                        <div className="text-xs text-red-600 font-semibold uppercase tracking-wide">Jawaban Salah</div>
                                    </div>
                                </div>
                            </div>

                            {/* Total Questions */}
                            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                        <BookOpen01Icon size={24} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-blue-700">
                                            {stats.answered} <span className="text-sm text-blue-400 font-normal">/ {stats.total}</span>
                                        </div>
                                        <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Total Soal</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <button
                                onClick={() => navigate('/dashboard/siswa')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                            >
                                <span>Kembali ke Dashboard</span>
                                <ArrowLeft01Icon size={18} className="rotate-180" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
