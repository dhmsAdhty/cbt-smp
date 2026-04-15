import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import Sidebar from '../../components/Sidebar'
import ProfileView from '../../components/siswa/Profile/ProfileView'
import {
    DashboardSquare02Icon,
    UserCircleIcon,
    BookOpen01Icon,
    Clock01Icon,
    CheckmarkCircle02Icon,
    PlayCircleIcon,
    Search01Icon,
    ArrowRight01Icon,
    StarSquareIcon,
    Calendar02Icon
} from 'hugeicons-react'
import Swal from 'sweetalert2'

export default function Siswa() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('dashboard')
    const [exams, setExams] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [studentName, setStudentName] = useState('')
    const [completedExamIds, setCompletedExamIds] = useState(new Set())

    useEffect(() => {
        fetchStudentData()
        fetchExams()
    }, [])

    const fetchStudentData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setStudentName(user.user_metadata?.nama_lengkap || 'Siswa')

        // Query langsung: ujian_jawaban yang dimiliki siswa ini, grouped by ujian_id
        const { data: answers } = await supabase
            .from('ujian_jawaban')
            .select('ujian_id')
            .eq('siswa_id', user.id)

        // Semua ujian_id yang sudah pernah dijawab siswa ini = sudah selesai
        const completed = new Set(answers?.map(a => a.ujian_id).filter(Boolean) || [])
        setCompletedExamIds(completed)
    }

    const fetchExams = async () => {
        setLoading(true)
        try {
            // Fetch semua ujian
            const { data: ujianList, error } = await supabase
                .from('ujian')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            // Ambil semua guru_id unik lalu fetch nama guru-nya sekaligus
            const guruIds = [...new Set(ujianList?.map(u => u.guru_id).filter(Boolean) || [])]
            let guruMap = {}

            if (guruIds.length > 0) {
                const { data: guruList } = await supabase
                    .from('users')
                    .select('id, nama')
                    .in('id', guruIds)

                guruList?.forEach(g => { guruMap[g.id] = g.nama })
            }

            // Gabungkan nama guru ke data ujian
            const enriched = ujianList?.map(u => ({
                ...u,
                namaGuru: guruMap[u.guru_id] || '-'
            })) || []

            setExams(enriched)
        } catch (err) {
            Swal.fire('Error', 'Gagal memuat ujian', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleStartExam = async (exam) => {
        if (completedExamIds.has(exam.id)) {
            navigate(`/dashboard/siswa/hasil/${exam.id}`)
            return
        }

        if (exam.status !== 'aktif') {
            Swal.fire('Info', 'Ujian belum dimulai', 'info')
            return
        }

        const confirm = await Swal.fire({
            title: `Mulai ujian ${exam.judul}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Mulai',
            cancelButtonText: 'Batal'
        })

        if (confirm.isConfirmed) {
            navigate(`/dashboard/siswa/ujian/${exam.id}`)
        }
    }

    const filteredExams = exams.filter(e =>
        e.judul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.mata_pelajaran?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const formatWaktu = (dateStr) => {
        if (!dateStr) return null
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    }

    const ExamCard = ({ exam }) => {
        const isCompleted = completedExamIds.has(exam.id)
        const namaGuru = exam.namaGuru || '-'
        const waktuMulai = formatWaktu(exam.waktu_mulai)
        const waktuSelesai = formatWaktu(exam.waktu_selesai)

        return (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm relative">
                {/* Status */}
                <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold
          ${isCompleted ? 'bg-green-100 text-green-700'
                        : exam.status === 'aktif' ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500'}
        `}>
                    {isCompleted ? 'SELESAI' : exam.status.toUpperCase()}
                </span>

                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                    {isCompleted
                        ? <StarSquareIcon className="w-7 h-7 text-yellow-500" />
                        : <BookOpen01Icon className="w-7 h-7 text-blue-600" />}
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {exam.judul}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    {exam.mata_pelajaran}
                </p>

                <div className="space-y-2 text-sm text-gray-600 mb-6">
                    {/* Durasi */}
                    <div className="flex items-center gap-2">
                        <Clock01Icon className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>{exam.durasi_menit} Menit</span>
                    </div>
                    {/* Nama Guru */}
                    <div className="flex items-center gap-2">
                        <UserCircleIcon className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="truncate">{namaGuru}</span>
                    </div>
                    {/* Waktu Mulai - Selesai */}
                    {(waktuMulai || waktuSelesai) && (
                        <div className="flex items-start gap-2">
                            <Calendar02Icon className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                            <div className="text-xs leading-relaxed">
                                {waktuMulai && <div><span className="text-gray-400">Mulai: </span>{waktuMulai}</div>}
                                {waktuSelesai && <div><span className="text-gray-400">Selesai: </span>{waktuSelesai}</div>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Button */}
                <button
                    onClick={() => handleStartExam(exam)}
                    disabled={!isCompleted && exam.status === 'selesai'}
                    className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2
            ${isCompleted
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : exam.status === 'aktif'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
          `}
                >
                    {isCompleted ? 'Lihat Nilai' : exam.status === 'aktif' ? 'Mulai Ujian' : 'Tidak Tersedia'}
                    <ArrowRight01Icon size={16} />
                </button>
            </div>
        )
    }

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardSquare02Icon },
        { id: 'profile', label: 'Profil Saya', icon: UserCircleIcon }
    ]

    return (
        <div className="min-h-screen bg-[#f0f5f9]">
            {/* Top Strip */}
            <div className="sticky top-0 z-50 py-[15px] px-6 bg-[linear-gradient(90deg,_#0f0533_0%,_#1b0a5c_100%)]">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                    <p className="text-white text-sm font-semibold tracking-wide">CBT Siswa Panel</p>
                    <span className="text-blue-200 text-xs">Sekolah Tahfidz Al Hikmah</span>
                </div>
            </div>

            <div className="flex p-5 xl:pr-0">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    menuItems={menuItems}
                    themeColor="blue"
                    userRole="siswa"
                />

                <div className="w-full lg:ml-[270px] xl:px-6 px-0">
                    <main className="h-full max-w-full">
                        <div className="p-0 flex flex-col gap-6">
                            {/* Header */}
                            <header className="bg-white shadow-[0px_2px_6px_rgba(37,83,185,0.1)] rounded-[18px] w-full text-sm py-4 px-6 border border-[#e7ecf0]">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div>
                                        <h1 className="text-xl font-semibold text-[#111c2d]">
                                            {activeTab === 'profile' ? 'Profil Saya' : 'Dashboard Siswa'}
                                        </h1>
                                        <p className="text-[#707a82] text-sm mt-0.5">Selamat datang di ruang ujian CBT</p>
                                    </div>
                                    <span className="inline-flex w-fit px-3 py-1.5 rounded-full bg-[#dffff3] text-[#4bd08b] text-xs font-semibold">
                                        Siswa
                                    </span>
                                </div>
                            </header>

                            {activeTab === 'profile' ? (
                                <ProfileView />
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-[#111c2d]">
                                                Halo, {studentName}
                                            </h2>
                                            <p className="text-[#707a82] text-sm">Selamat datang di ruang ujian</p>
                                        </div>

                                        <div className="relative w-full md:w-80">
                                            <Search01Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#707a82]" size={18} />
                                            <input
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                placeholder="Cari ujian..."
                                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#e7ecf0] rounded-[7px] outline-none focus:ring-2 focus:ring-[#0085db]/20 focus:border-[#0085db] text-sm text-[#111c2d]"
                                            />
                                        </div>
                                    </div>

                                    {loading ? (
                                        <p className="text-[#707a82] text-sm">Memuat ujian...</p>
                                    ) : filteredExams.length ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredExams.map(exam => (
                                                <ExamCard key={exam.id} exam={exam} />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-[#707a82] py-20 text-sm">
                                            Tidak ada ujian tersedia
                                        </p>
                                    )}
                                </div>
                            )}

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
