import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../../lib/supabaseClient'
import * as XLSX from 'xlsx'
import {
    Search01Icon,
    Download01Icon,
    CheckmarkCircle02Icon,
    Cancel01Icon,
    ViewIcon,
    ArrowLeft01Icon
} from 'hugeicons-react'
import Swal from 'sweetalert2'

const RekapNilaiView = () => {
    const [rekapData, setRekapData] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [mapelDetails, setMapelDetails] = useState(null)

    // State untuk halaman detail
    const [detailMode, setDetailMode] = useState(false)
    const [selectedAnswerData, setSelectedAnswerData] = useState(null)

    useEffect(() => {
        fetchRekapData()
    }, [])



    const fetchRekapData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: guruData } = await supabase
                .from('users')
                .select('mapel')
                .eq('id', user.id)
                .single()

            if (!guruData?.mapel) {
                setLoading(false)
                return
            }

            const { data: mapelData } = await supabase
                .from('mapel')
                .select('*')
                .eq('nama_mapel', guruData.mapel)
                .single()

            setMapelDetails(mapelData)

            const { data: mapelSoal } = await supabase
                .from('bank_soal')
                .select('id')
                .eq('mapel_id', mapelData.id)
                .is('deleted_at', null)

            const soalIds = mapelSoal?.map(s => s.id) || []
            console.log('📚 Mapel soal:', { mapelId: mapelData.id, totalSoal: soalIds.length, soalIds })

            if (soalIds.length === 0) {
                console.log('⚠️ No soal found for this mapel')
                setRekapData([])
                setLoading(false)
                return
            }

            let query = supabase
                .from('ujian_jawaban')
                .select('siswa_id, soal_id, ujian_id, is_correct')

            // Use filter approach instead of in() to avoid Supabase issues
            if (soalIds.length > 0) {
                query = query.in('soal_id', soalIds)
            }

            const { data: answers, error: answersError } = await query

            if (answersError) {
                console.error('❌ Error fetching answers:', answersError)
                throw answersError
            }

            console.log('📝 Answers found:', answers?.length || 0)

            console.log('🔍 Rekap Debug:', {
                soalIds: soalIds.length,
                answers: answers?.length || 0,
                mapelId: mapelData.id
            })

            const studentIds = [...new Set(answers?.map(a => a.siswa_id) || [])]
            const ujianIds = [...new Set(answers?.map(a => a.ujian_id).filter(Boolean) || [])]

            if (studentIds.length === 0) {
                setRekapData([])
                setLoading(false)
                return
            }

            const [{ data: students }, { data: ujianList }] = await Promise.all([
                supabase.from('users').select('id, nama, kelas').in('id', studentIds),
                supabase.from('ujian').select('id, judul').in('id', ujianIds)
            ])

            const studentMap = {}
            students?.forEach(s => studentMap[s.id] = { nama: s.nama || 'Tidak diketahui', kelas: s.kelas || 'Umum' })

            const ujianMap = {}
            ujianList?.forEach(u => ujianMap[u.id] = u.judul || 'Ujian')

            const studentScores = {}
            answers.forEach(ans => {
                const student = studentMap[ans.siswa_id]
                if (!student) return

                const key = `${ans.siswa_id}_${ans.ujian_id || 'unknown'}`
                if (!studentScores[key]) {
                    studentScores[key] = {
                        studentId: ans.siswa_id,
                        nama: student.nama,
                        kelas: student.kelas,
                        ujianId: ans.ujian_id,
                        judulUjian: ans.ujian_id ? (ujianMap[ans.ujian_id] || 'Ujian Tidak Ditemukan') : 'Ujian Lama',
                        answeredCount: 0,
                        correctCount: 0
                    }
                }
                studentScores[key].answeredCount += 1
                if (ans.is_correct) studentScores[key].correctCount += 1
            })

            const formattedData = Object.values(studentScores).map(s => ({
                ...s,
                nilai: s.answeredCount > 0 ? ((s.correctCount / s.answeredCount) * 100).toFixed(1) : 0
            }))

            console.log('✅ Setting rekap data:', { totalRows: formattedData.length, data: formattedData })
            setRekapData(formattedData)
        } catch (error) {
            console.error('Error fetching rekap:', error)
            Swal.fire('Error', 'Gagal memuat rekap nilai', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleViewAnswers = async (row) => {
        try {
            setLoading(true)

            let query = supabase
                .from('ujian_jawaban')
                .select('soal_id, jawaban_siswa, is_correct')
                .eq('siswa_id', row.studentId)

            if (row.ujianId) query = query.eq('ujian_id', row.ujianId)

            const { data: answers } = await query
            if (!answers || answers.length === 0) {
                Swal.fire('Info', 'Tidak ada data jawaban ditemukan', 'info')
                return
            }

            const soalIds = answers.map(a => a.soal_id)
            const { data: soalList } = await supabase
                .from('bank_soal')
                .select('id, pertanyaan, opsi_jawaban, kunci_jawaban, tipe_soal')
                .in('id', soalIds)
                .is('deleted_at', null)

            const detailedAnswers = answers.map(ans => {
                const soal = soalList?.find(s => s.id === ans.soal_id)
                return {
                    ...ans,
                    pertanyaan: soal?.pertanyaan,
                    opsi_jawaban: soal?.opsi_jawaban,
                    kunci_jawaban: soal?.kunci_jawaban,
                    tipe_soal: soal?.tipe_soal
                }
            })

            setSelectedAnswerData({
                studentName: row.nama,
                examTitle: row.judulUjian,
                kelas: row.kelas,
                score: row.nilai,
                answers: detailedAnswers
            })

            // Switch ke mode detail dengan animasi
            setDetailMode(true)

        } catch (error) {
            console.error('Error fetching answers:', error)
            Swal.fire('Error', 'Gagal memuat detail jawaban', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleExport = () => {
        const rows = filteredData.map(row => ({
            'Nama Siswa': row.nama,
            'Kelas': row.kelas,
            'Ujian': row.judulUjian,
            'Jawaban Benar': row.correctCount,
            'Total Soal': row.answeredCount,
            'Nilai': parseFloat(row.nilai),
            'Status': parseFloat(row.nilai) >= 70 ? 'LULUS' : 'REMEDIAL'
        }))

        const ws = XLSX.utils.json_to_sheet(rows)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Rekap Nilai')
        XLSX.writeFile(wb, `rekap-nilai-${mapelDetails?.nama_mapel || 'mapel'}-${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const handleDeleteResult = async (studentId, studentName, ujianId) => {
        const result = await Swal.fire({
            title: 'Hapus Hasil Ujian?',
            text: `Yakin ingin menghapus hasil ujian ${studentName}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        })

        if (result.isConfirmed) {
            try {
                let query = supabase
                    .from('ujian_jawaban')
                    .delete()
                    .eq('siswa_id', studentId)

                // Jika ada ujianId, hapus spesifik ujian tersebut
                if (ujianId) {
                    query = query.eq('ujian_id', ujianId)
                    console.log('🗑️ Deleting by ujianId:', ujianId)
                } else {
                    // Fallback: hapus berdasarkan soal mapel
                    const { data: mapelSoal } = await supabase
                        .from('bank_soal')
                        .select('id')
                        .eq('mapel_id', mapelDetails.id)
                        .is('deleted_at', null)

                    const soalIds = mapelSoal?.map(s => s.id) || []

                    if (soalIds.length > 0) {
                        query = query.in('soal_id', soalIds)
                        console.log('🗑️ Deleting by soalIds:', soalIds)
                    } else {
                        // Tidak ada filter valid → batalkan agar tidak delete semua data siswa
                        Swal.fire('Gagal', 'Tidak ada soal mapel ditemukan, tidak bisa menghapus.', 'error')
                        return
                    }
                }

                // Tambah .select() agar Supabase mengembalikan row yang terhapus
                const { data: deletedRows, error } = await query.select()

                if (error) {
                    console.error('❌ Delete error:', error)
                    throw error
                }

                console.log('✅ Deleted rows:', deletedRows?.length ?? 0, deletedRows)

                if (!deletedRows || deletedRows.length === 0) {
                    // Tidak ada baris yang terhapus — kemungkinan RLS memblokir atau filter salah
                    console.warn('⚠️ Tidak ada row yang terhapus. Cek RLS atau filter query.')
                    Swal.fire('Perhatian', 'Data tidak terhapus. Kemungkinan ada masalah izin di database.', 'warning')
                    return
                }

                setRekapData([]) // Clear UI langsung
                await fetchRekapData() // Fetch ulang setelah delete selesai

                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: 'Hasil ujian berhasil dihapus',
                    timer: 1500,
                    showConfirmButton: false
                })
            } catch (error) {
                console.error('Error deleting result:', error)
                Swal.fire('Error', 'Gagal menghapus hasil ujian', 'error')
            }
        }
    }

    const handleBackToList = () => {
        setDetailMode(false)
        setTimeout(() => setSelectedAnswerData(null), 300) // Clear setelah animasi
    }

    const filteredData = rekapData.filter(item =>
        item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kelas?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Animasi variants
    const pageVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
        exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: "easeIn" } }
    }

    const listItemVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        hover: { scale: 1.01, transition: { duration: 0.2 } }
    }

    const tableRowVariants = {
        initial: { opacity: 0, y: 10 },
        animate: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.03,
                duration: 0.3,
                ease: "easeOut"
            }
        }),
        hover: {
            backgroundColor: "rgba(59, 130, 246, 0.05)",
            transition: { duration: 0.2 }
        }
    }

    const breadcrumbVariants = {
        initial: { opacity: 0, y: -10 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    }

    const headerVariants = {
        initial: { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } }
    }

    const questionVariants = {
        initial: { opacity: 0, x: -20 },
        animate: (i) => ({
            opacity: 1,
            x: 0,
            transition: {
                delay: i * 0.05,
                duration: 0.4,
                ease: "easeOut"
            }
        })
    }

    // Halaman Detail dengan Animasi
    if (detailMode && selectedAnswerData) {
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key="detail"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    className="space-y-6"
                >
                    {/* Breadcrumb dengan Animasi */}
                    <motion.div
                        variants={breadcrumbVariants}
                        className="flex items-center gap-2 text-sm"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05, x: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleBackToList}
                            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
                        >
                            <ArrowLeft01Icon size={18} />
                            <span>Rekap Nilai</span>
                        </motion.button>
                        <span className="text-gray-400">/</span>
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-900 dark:text-white font-semibold"
                        >
                            {selectedAnswerData.studentName}
                        </motion.span>
                        <span className="text-gray-400">/</span>
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-gray-600 dark:text-gray-400"
                        >
                            {selectedAnswerData.examTitle}
                        </motion.span>
                    </motion.div>

                    {/* Header Detail dengan Animasi */}
                    <motion.div
                        variants={headerVariants}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                    >
                        <motion.div
                            initial={{ backgroundPosition: "0% 0%" }}
                            animate={{ backgroundPosition: "100% 100%" }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="bg-linear-to-r from-blue-600 to-blue-700 p-6 text-white"
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <motion.h2
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-2xl font-bold mb-3"
                                    >
                                        {selectedAnswerData.examTitle}
                                    </motion.h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <span className="text-blue-100">Nama Siswa</span>
                                            <p className="font-semibold text-white text-lg">{selectedAnswerData.studentName}</p>
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <span className="text-blue-100">Kelas</span>
                                            <p className="font-semibold text-white text-lg">{selectedAnswerData.kelas}</p>
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            <span className="text-blue-100">Nilai Akhir</span>
                                            <motion.p
                                                initial={{ scale: 0.8 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                                                className="font-bold text-white text-3xl"
                                            >
                                                {selectedAnswerData.score}
                                            </motion.p>
                                        </motion.div>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.3)" }}
                                    whileTap={{ scale: 0.95 }}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    onClick={() => {
                                        const rows = selectedAnswerData.answers.map((ans, idx) => ({
                                            'No': idx + 1,
                                            'Pertanyaan': ans.pertanyaan || 'N/A',
                                            'Tipe': ans.tipe_soal === 'pilihan_ganda' ? 'Pilihan Ganda' : 'Essay',
                                            'Jawaban Siswa': ans.jawaban_siswa || '-',
                                            'Kunci Jawaban': ans.kunci_jawaban || '-',
                                            'Status': ans.is_correct ? 'BENAR' : 'SALAH'
                                        }))
                                        const ws = XLSX.utils.json_to_sheet(rows)
                                        const wb = XLSX.utils.book_new()
                                        XLSX.utils.book_append_sheet(wb, ws, 'Detail Jawaban')
                                        XLSX.writeFile(wb, `jawaban-${selectedAnswerData.studentName}-${selectedAnswerData.examTitle}.xlsx`)
                                    }}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all font-semibold"
                                >
                                    <Download01Icon size={18} />
                                    <span>Export Jawaban</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Daftar Jawaban dengan Animasi Stagger */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Detail Jawaban ({selectedAnswerData.answers.length} Soal)
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            <AnimatePresence>
                                {selectedAnswerData.answers.map((ans, index) => (
                                    <motion.div
                                        key={index}
                                        custom={index}
                                        variants={questionVariants}
                                        initial="initial"
                                        animate="animate"
                                        whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.02)" }}
                                        className="p-6 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <motion.span
                                                    initial={{ scale: 0.8 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: 0.1 + index * 0.05 }}
                                                    className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-300"
                                                >
                                                    {index + 1}
                                                </motion.span>
                                                <motion.span
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.15 + index * 0.05 }}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold ${ans.tipe_soal === 'pilihan_ganda'
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                        }`}
                                                >
                                                    {ans.tipe_soal === 'pilihan_ganda' ? 'Pilihan Ganda' : 'Essay'}
                                                </motion.span>
                                            </div>
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.2 + index * 0.05, type: "spring" }}
                                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${ans.is_correct
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}
                                            >
                                                {ans.is_correct ? (
                                                    <>
                                                        <CheckmarkCircle02Icon size={16} />
                                                        <span>BENAR</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Cancel01Icon size={16} />
                                                        <span>SALAH</span>
                                                    </>
                                                )}
                                            </motion.div>
                                        </div>

                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.25 + index * 0.05 }}
                                            className="text-gray-800 dark:text-gray-200 font-medium mb-4 ml-10"
                                        >
                                            {ans.pertanyaan || 'Pertanyaan tidak tersedia'}
                                        </motion.p>

                                        {ans.tipe_soal === 'pilihan_ganda' && ans.opsi_jawaban && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 + index * 0.05 }}
                                                className="ml-10 space-y-2"
                                            >
                                                {(() => {
                                                    try {
                                                        const parsedOpsi = typeof ans.opsi_jawaban === 'string'
                                                            ? JSON.parse(ans.opsi_jawaban)
                                                            : ans.opsi_jawaban

                                                        const opsiArray = Array.isArray(parsedOpsi)
                                                            ? parsedOpsi
                                                            : Object.entries(parsedOpsi).map(([k, v]) => ({ label: k, text: v }))

                                                        return opsiArray.map((opsi, idx) => {
                                                            const isKunci = opsi.label === ans.kunci_jawaban
                                                            const isJawabanSiswa = String(opsi.label) === String(ans.jawaban_siswa)

                                                            return (
                                                                <motion.div
                                                                    key={idx}
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: 0.35 + index * 0.05 + idx * 0.02 }}
                                                                    whileHover={{ scale: 1.01, x: 2 }}
                                                                    className={`p-3 rounded-lg text-sm ${isKunci
                                                                        ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
                                                                        : isJawabanSiswa
                                                                            ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'
                                                                            : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
                                                                        }`}
                                                                >
                                                                    <span className="font-bold mr-2">{opsi.label}.</span>
                                                                    {opsi.text || opsi.value}
                                                                    {isKunci && (
                                                                        <motion.span
                                                                            initial={{ scale: 0 }}
                                                                            animate={{ scale: 1 }}
                                                                            transition={{ delay: 0.4 + index * 0.05 + idx * 0.02 }}
                                                                            className="ml-3 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full"
                                                                        >
                                                                            Kunci
                                                                        </motion.span>
                                                                    )}
                                                                    {isJawabanSiswa && !isKunci && (
                                                                        <motion.span
                                                                            initial={{ scale: 0 }}
                                                                            animate={{ scale: 1 }}
                                                                            transition={{ delay: 0.4 + index * 0.05 + idx * 0.02 }}
                                                                            className="ml-3 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full"
                                                                        >
                                                                            Dipilih
                                                                        </motion.span>
                                                                    )}
                                                                </motion.div>
                                                            )
                                                        })
                                                    } catch (e) {
                                                        return <p className="text-red-500 text-xs">Error menampilkan opsi</p>
                                                    }
                                                })()}
                                            </motion.div>
                                        )}

                                        {ans.tipe_soal === 'essay' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 + index * 0.05 }}
                                                className="ml-10 space-y-3"
                                            >
                                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                                        ✏️ Jawaban Siswa
                                                    </p>
                                                    <motion.p
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: 0.35 + index * 0.05 }}
                                                        className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap"
                                                    >
                                                        {ans.jawaban_siswa || '-'}
                                                    </motion.p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        )
    }

    // Halaman List Rekap dengan Animasi
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="list"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                className="space-y-6"
            >
                {/* Toolbar dengan Animasi */}
                <motion.div
                    variants={listItemVariants}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col md:flex-row gap-4 items-center justify-between"
                >
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search01Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <motion.input
                            whileFocus={{ scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                            type="text"
                            placeholder="Cari siswa atau kelas..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {mapelDetails && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2.5 rounded-xl font-semibold text-sm border border-blue-100 dark:border-blue-800"
                        >
                            {mapelDetails.nama_mapel}
                        </motion.div>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleExport}
                        disabled={filteredData.length === 0}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none"
                    >
                        <Download01Icon size={18} />
                        <span>Export Excel</span>
                    </motion.button>
                </motion.div>

                {loading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-center p-12"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="rounded-full h-12 w-12 border-b-2 border-blue-600"
                        />
                    </motion.div>
                ) : filteredData.length === 0 ? (
                    <motion.div
                        variants={listItemVariants}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-center py-16"
                    >
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-gray-500 dark:text-gray-400"
                        >
                            Belum ada data nilai ujian.
                        </motion.p>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={listItemVariants}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Nama Siswa</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Kelas</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Ujian</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Jawaban Benar</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Nilai</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    <AnimatePresence>
                                        {filteredData.map((row, index) => (
                                            <motion.tr
                                                key={index}
                                                custom={index}
                                                variants={tableRowVariants}
                                                initial="initial"
                                                animate="animate"
                                                whileHover="hover"
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    {row.nama}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                    {row.kelas}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    {row.judulUjian}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-400">
                                                    {row.correctCount} / {row.answeredCount}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <motion.span
                                                        whileHover={{ scale: 1.1 }}
                                                        className={`
                                                            px-3 py-1.5 rounded-full text-sm font-bold inline-block
                                                            ${parseFloat(row.nilai) >= 70
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
                                                        `}
                                                    >
                                                        {row.nilai}
                                                    </motion.span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {parseFloat(row.nilai) >= 70 ? (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ delay: index * 0.03 }}
                                                            className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400"
                                                        >
                                                            <CheckmarkCircle02Icon size={16} />
                                                            <span className="text-xs font-bold">LULUS</span>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ delay: index * 0.03 }}
                                                            className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400"
                                                        >
                                                            <Cancel01Icon size={16} />
                                                            <span className="text-xs font-bold">REMEDIAL</span>
                                                        </motion.div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <motion.button
                                                            whileHover={{ scale: 1.1, backgroundColor: "#2563eb", color: "#ffffff" }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => handleViewAnswers(row)}
                                                            className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all"
                                                            title="Lihat Detail Jawaban"
                                                        >
                                                            <ViewIcon size={18} />
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1, backgroundColor: "#dc2626", color: "#ffffff" }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => handleDeleteResult(row.studentId, row.nama, row.ujianId)}
                                                            className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all"
                                                            title="Hapus hasil ujian"
                                                        >
                                                            <Cancel01Icon size={18} />
                                                        </motion.button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    )
}

export default RekapNilaiView