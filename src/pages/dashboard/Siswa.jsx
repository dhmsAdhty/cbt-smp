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
    StarSquareIcon
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

        const { data: answers } = await supabase
            .from('ujian_jawaban')
            .select('soal_id')
            .eq('siswa_id', user.id)

        const { data: exams } = await supabase
            .from('ujian')
            .select('id')

        const answeredIds = new Set(answers?.map(a => a.soal_id) || [])
        const completed = new Set()

        for (const exam of exams || []) {
            const { data: soal } = await supabase
                .from('ujian_soal')
                .select('soal_id')
                .eq('ujian_id', exam.id)

            const soalIds = soal?.map(s => s.soal_id) || []
            if (soalIds.length && soalIds.every(id => answeredIds.has(id))) {
                completed.add(exam.id)
            }
        }

        setCompletedExamIds(completed)
    }

    const fetchExams = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('ujian')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            Swal.fire('Error', 'Gagal memuat ujian', 'error')
        } else {
            setExams(data || [])
        }
        setLoading(false)
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

    const ExamCard = ({ exam }) => {
        const isCompleted = completedExamIds.has(exam.id)

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
                    <div className="flex items-center gap-2">
                        <Clock01Icon className="w-4 h-4" />
                        {exam.durasi_menit} Menit
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckmarkCircle02Icon className="w-4 h-4" />
                        {exam.guru?.nama_lengkap || 'Guru'}
                    </div>
                </div>

                {/* BUTTON – HOVER ONLY */}
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
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                menuItems={menuItems}
                themeColor="blue"
                userRole="siswa"
            />

            <main className="flex-1 p-6 lg:ml-80">
                {activeTab === 'profile' ? (
                    <ProfileView />
                ) : (
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800">
                                    Halo, {studentName}
                                </h2>
                                <p className="text-gray-500">Selamat datang di ruang ujian</p>
                            </div>

                            <div className="relative w-full md:w-80">
                                <Search01Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Cari ujian..."
                                    className="w-full pl-12 pr-4 py-3 border rounded-xl outline-none"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <p className="text-gray-500">Memuat ujian...</p>
                        ) : filteredExams.length ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredExams.map(exam => (
                                    <ExamCard key={exam.id} exam={exam} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-20">
                                Tidak ada ujian tersedia
                            </p>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
