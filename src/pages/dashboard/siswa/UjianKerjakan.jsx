import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { useExamSecurity } from '../../../hooks/useExamSecurity'
import Swal from 'sweetalert2'
import {
    Clock01Icon,
    ArrowLeft01Icon,
    ArrowRight01Icon,
    CheckmarkCircle02Icon,
    Menu01Icon,
    Cancel01Icon,
    LockKeyIcon
} from 'hugeicons-react'

export default function UjianKerjakan() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [ujian, setUjian] = useState(null)
    const [soalList, setSoalList] = useState([])
    const [currentSoalIndex, setCurrentSoalIndex] = useState(0)
    const [jawaban, setJawaban] = useState({}) // { soal_id: jawaban_value }
    const [timeLeft, setTimeLeft] = useState(0)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [studentId, setStudentId] = useState(null)
    const [violationCount, setViolationCount] = useState(0)

    // Exam security features
    const {
        securityEvents,
        tabSwitchCount,
        timeSpent,
        isVisible
    } = useExamSecurity({
        enableCopyPasteBlock: true,
        enableTabSwitchTracking: true,
        enableTimeTracking: true,
        enableFullscreen: true,
        onTabSwitch: (event) => {
            // Escalating warnings based on tab switch count
            const count = tabSwitchCount + 1

            if (count === 1) {
                // First warning
                Swal.fire({
                    icon: 'warning',
                    title: '⚠️ Peringatan Pertama',
                    html: `
                        <p style="margin-bottom: 12px;"><strong>Anda telah berpindah tab ${count} kali!</strong></p>
                        <p style="margin-bottom: 12px;">Untuk keamanan ujian, mohon:</p>
                        <ul style="text-align: left; margin-left: 20px; margin-bottom: 12px;">
                            <li>Jangan berpindah tab/window</li>
                            <li>Fokus pada soal ujian</li>
                            <li>Semua aktivitas dicatat sistem</li>
                        </ul>
                        <p style="color: #dc2626; font-weight: bold;">Jika berpindah tab 3 kali, ujian akan otomatis dikumpulkan!</p>
                    `,
                    confirmButtonText: 'Mengerti',
                    confirmButtonColor: '#f59e0b',
                    timer: 5000,
                    timerProgressBar: true
                })
            } else if (count === 2) {
                // Final warning
                Swal.fire({
                    icon: 'error',
                    title: '🚨 Peringatan Terakhir!',
                    html: `
                        <p style="margin-bottom: 12px; font-size: 18px;"><strong>Tab Switch: ${count}x / 3x</strong></p>
                        <p style="color: #dc2626; font-weight: bold; margin-bottom: 12px;">
                            BAHAYA! 1 kali lagi ujian akan otomatis dikumpulkan!
                        </p>
                        <p>Tetap fokus di halaman ujian ini. Jangan berpindah tab!</p>
                    `,
                    confirmButtonText: 'Saya Mengerti',
                    confirmButtonColor: '#dc2626',
                    allowOutsideClick: false,
                    allowEscapeKey: false
                })
            } else if (count >= 3) {
                // Auto submit
                Swal.fire({
                    icon: 'error',
                    title: '❌ Ujian Otomatis Dikumpulkan',
                    html: `
                        <p style="margin-bottom: 12px;"><strong>Anda telah melanggar aturan ujian!</strong></p>
                        <p style="margin-bottom: 12px;">Berpindah tab: <strong>${count} kali</strong></p>
                        <p style="color: #dc2626; font-weight: bold;">
                            Ujian akan dikumpulkan dengan jawaban yang sudah Anda isi.
                        </p>
                    `,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#dc2626',
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then(() => {
                    // Auto submit exam
                    handleSubmit(true)
                })
            }
        }
    })

    useEffect(() => {
        fetchUserAndExam()
    }, [id])

    useEffect(() => {
        if (timeLeft > 0 && !loading) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        handleSubmit(true) // Auto submit
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
            return () => clearInterval(timer)
        }
    }, [timeLeft, loading])


    const fetchUserAndExam = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                navigate('/')
                return
            }
            setStudentId(user.id)

            // 1. Fetch Exam Details
            const { data: examData, error: examError } = await supabase
                .from('ujian')
                .select('*')
                .eq('id', id)
                .single()

            if (examError) throw examError
            setUjian(examData)

            // Set duration in seconds (simple implementation, ideally check started_at)
            // For now just using full duration. In real app, check if student already started.
            setTimeLeft(examData.durasi_menit * 60)

            // 2. Fetch Questions (ordered by urutan)
            const { data: soalData, error: soalError } = await supabase
                .from('ujian_soal')
                .select(`
                    id,
                    urutan,
                    soal:bank_soal (
                        id,
                        pertanyaan,
                        tipe_soal,
                        opsi_jawaban,
                        gambar_url
                    )
                `)
                .eq('ujian_id', id)
                .order('urutan', { ascending: true })

            if (soalError) throw soalError
            if (soalError) throw soalError
            setSoalList(soalData.map(item => item.soal))

        } finally {
            setLoading(false)
        }
    }

    const handleAnswerChange = (soalId, value) => {
        setJawaban(prev => ({
            ...prev,
            [soalId]: value
        }))
    }

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const handleSubmit = async (auto = false) => {
        const result = !auto ? await Swal.fire({
            title: 'Kumpulkan Ujian?',
            text: 'Pastikan semua jawaban sudah terisi. Anda tidak bisa mengubahnya setelah dikumpulkan.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563EB',
            cancelButtonColor: '#EF4444',
            confirmButtonText: 'Ya, Kumpulkan',
            cancelButtonText: 'Batal'
        }) : { isConfirmed: true }

        if (result.isConfirmed) {
            Swal.fire({
                title: 'Menyimpan Jawaban...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            })

            try {
                // Prepare specific inserts
                // Note: We need to know if answer is correct. 
                // Security Note: In a real secure app, grading should happen on server (Edge Function) 
                // or RLS should prevent students seeing is_correct. 
                // Here we fetch keys to grade client-side for simplicity as per requirements context.

                // Fetch keys for grading (Mocking grading on submission)
                // Ideally this happens on creating 'ujian_jawaban' via database trigger or function.
                // We will just insert the raw answer. Teacher/Admin dashboard calculates score.
                // Wait... RekapNilaiView calculates based on 'is_correct'. So we need to set it here?
                // Or fetch keys now?

                // Let's fetch keys secretly just for submission logic
                const { data: keys } = await supabase
                    .from('bank_soal')
                    .select('id, kunci_jawaban')
                    .in('id', soalList.map(s => s.id))

                const keyMap = {}
                keys?.forEach(k => keyMap[k.id] = k.kunci_jawaban)

                const answersPayload = Object.entries(jawaban).map(([soalId, val]) => {
                    const soal = soalList.find(s => s.id == soalId) // Use loose equality for safety or convert both to string
                    let isCorrect = false
                    if (soal?.tipe_soal === 'pilihan_ganda') {
                        isCorrect = val === keyMap[soal.id]
                    }

                    return {
                        ujian_id: id, // Include exam ID to track which exam this answer belongs to
                        soal_id: soal.id,
                        siswa_id: studentId,
                        jawaban_siswa: typeof val === 'object' ? JSON.stringify(val) : String(val),
                        is_correct: isCorrect
                    }
                })

                // Check if 'ujian_jawaban' is the right table. 
                // Based on RekapNilaiView, it uses 'ujian_jawaban'.

                if (answersPayload.length > 0) {
                    const { error } = await supabase
                        .from('ujian_jawaban')
                        .insert(answersPayload)

                    if (error) throw error
                }

                await Swal.fire({
                    title: 'Ujian Selesai!',
                    text: 'Jawaban Anda telah berhasil disimpan.',
                    icon: 'success',
                    confirmButtonText: 'Kembali ke Dashboard'
                })
                navigate('/dashboard/siswa')

            } catch (error) {
                console.error('Submit error:', error)
                Swal.fire('Error', 'Gagal menyimpan jawaban. Coba lagi.', 'error')
            }
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!ujian || soalList.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-800">Ujian Tidak Ditemukan</h2>
                    <button onClick={() => navigate('/dashboard/siswa')} className="mt-4 text-blue-600 hover:underline">
                        Kembali
                    </button>
                </div>
            </div>
        )
    }

    const currentSoal = soalList[currentSoalIndex]

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row h-screen overflow-hidden font-sans">
            {/* Mobile Header */}
            <div className="md:hidden bg-white p-4 border-b border-gray-200 flex justify-between items-center z-20">
                <div className="font-bold text-gray-800 truncate max-w-[200px]">{ujian.judul}</div>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? <Cancel01Icon /> : <Menu01Icon />}
                </button>
            </div>

            {/* Main Content (Soal) */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 hidden md:block">{ujian.judul}</h1>
                        <p className="text-sm text-gray-500">
                            Soal No. <span className="font-bold text-blue-600 text-lg">{currentSoalIndex + 1}</span>
                            <span className="mx-1">/</span>
                            {soalList.length}
                        </p>
                    </div>

                    <div className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg
                        ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}
                    `}>
                        <Clock01Icon size={20} />
                        {formatTime(timeLeft)}
                    </div>
                </header>

                {/* Security Indicator */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-100 px-6 py-2">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-green-700">
                            <span className="text-lg">🛡️</span>
                            <span className="font-medium">Mode Ujian Aman Aktif</span>
                            <span className="text-xs text-green-600">• Copy/Paste Diblokir</span>
                        </div>
                        {tabSwitchCount > 0 && (
                            <div className="text-orange-600 text-xs font-medium">
                                ⚠️ Tab Switch: {tabSwitchCount}x
                            </div>
                        )}
                    </div>
                </div>

                {/* Question Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[400px]">
                        <div className="mb-6">
                            {currentSoal.gambar_url && (
                                <img
                                    src={currentSoal.gambar_url}
                                    alt="Soal"
                                    className="max-h-64 rounded-lg border border-gray-100 mb-6 object-contain"
                                />
                            )}
                            <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
                                {currentSoal.pertanyaan}
                            </p>
                        </div>

                        <div className="space-y-4">
                            {currentSoal.tipe_soal === 'pilihan_ganda' ? (
                                currentSoal.opsi_jawaban?.map((opsi, idx) => (
                                    <label
                                        key={idx}
                                        className={`
                                            flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                                            ${jawaban[currentSoal.id] === opsi.label
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-100 hover:border-blue-200 bg-white hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2
                                            ${jawaban[currentSoal.id] === opsi.label
                                                ? 'border-blue-600 bg-blue-600 text-white'
                                                : 'border-gray-300 text-gray-500'
                                            }
                                        `}>
                                            {opsi.label}
                                        </div>
                                        <input
                                            type="radio"
                                            name={`soal-${currentSoal.id}`}
                                            value={opsi.label}
                                            checked={jawaban[currentSoal.id] === opsi.label}
                                            onChange={() => handleAnswerChange(currentSoal.id, opsi.label)}
                                            className="hidden"
                                        />
                                        <span className="text-gray-700 font-medium">{opsi.text}</span>
                                    </label>
                                ))
                            ) : (
                                <textarea
                                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all min-h-[200px]"
                                    placeholder="Tulis jawaban Anda di sini..."
                                    value={jawaban[currentSoal.id] || ''}
                                    onChange={(e) => handleAnswerChange(currentSoal.id, e.target.value)}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Navigation */}
                <footer className="bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                    <button
                        onClick={() => setCurrentSoalIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentSoalIndex === 0}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100"
                    >
                        <ArrowLeft01Icon size={20} />
                        <span className="hidden sm:inline">Sebelumnya</span>
                    </button>

                    {currentSoalIndex === soalList.length - 1 ? (
                        <button
                            onClick={() => handleSubmit()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all transform hover:-translate-y-0.5"
                        >
                            <span>Selesai & Kumpulkan</span>
                            <CheckmarkCircle02Icon size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentSoalIndex(prev => Math.min(soalList.length - 1, prev + 1))}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
                        >
                            <span className="hidden sm:inline">Selanjutnya</span>
                            <ArrowRight01Icon size={20} />
                        </button>
                    )}
                </footer>
            </main>

            {/* Sidebar Navigation (Questions List) */}
            <aside className={`
                fixed inset-y-0 right-0 z-30 w-72 bg-white border-l border-gray-200 shadow-2xl transform transition-duration-300 ease-in-out
                md:relative md:translate-x-0 md:shadow-none
                ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="p-6 h-full flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Navigasi Soal</h3>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-4 gap-3">
                            {soalList.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setCurrentSoalIndex(idx)
                                        setIsSidebarOpen(false)
                                    }}
                                    className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all border-2
                                        ${currentSoalIndex === idx
                                            ? 'border-blue-600 text-blue-600 bg-blue-50 scale-105 shadow-md'
                                            : jawaban[soalList[idx].id]
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 space-y-3 pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="w-4 h-4 rounded bg-green-500"></div>
                            <span>Sudah Dijawab</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="w-4 h-4 rounded bg-blue-50 border-2 border-blue-600"></div>
                            <span>Sedang Dikerjakan</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="w-4 h-4 rounded border-2 border-gray-200"></div>
                            <span>Belum Dijawab</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}
        </div>
    )
}
