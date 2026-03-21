import { useState } from 'react'
import { supabase, supabaseUrl, supabaseKey } from '../lib/supabaseClient'
import { createClient } from '@supabase/supabase-js'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'

export const useBulkImport = (onSuccess) => {
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0, isImporting: false })
    const [importResults, setImportResults] = useState({ success: [], failed: [] })

    const downloadTemplateExcel = () => {
        const data = [
            { nama: 'John Doe', email: 'john@sekolah.com', password: 'password123', role: 'siswa', kelas: 'X-A', mapel: '' },
            { nama: 'Jane Smith', email: 'jane@sekolah.com', password: 'password123', role: 'guru', kelas: '', mapel: 'Matematika' },
            { nama: 'Admin User', email: 'admin@sekolah.com', password: 'admin123', role: 'admin', kelas: '', mapel: '' }
        ]

        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')
        XLSX.writeFile(workbook, 'template_import_users.xlsx')
    }

    const processUsersInBatch = async (users) => {
        setImportProgress({ current: 0, total: users.length, isImporting: true })
        setImportResults({ success: [], failed: [] })

        const batchSize = 10
        const results = { success: [], failed: [] }

        // Simpan session admin saat ini
        const { data: currentSession } = await supabase.auth.getSession()
        const adminSession = currentSession.session

        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize)

            await Promise.all(batch.map(async (user) => {
                try {
                    const password = user.password || 'sekolah123'

                    // Buat client sementara yang tidak persist session
                    const tempSupabase = createClient(supabaseUrl, supabaseKey, {
                        auth: { popups: false, persistSession: false, detectSessionInUrl: false, autoRefreshToken: false }
                    })

                    const { data: authData, error: authError } = await tempSupabase.auth.signUp({
                        email: user.email.trim(),
                        password: password,
                        options: {
                            emailRedirectTo: window.location.origin,
                            data: {
                                nama: user.nama,
                                role: user.role || 'siswa'
                            }
                        }
                    })

                    if (authError) throw authError
                    if (!authData.user) throw new Error('Gagal membuat akun auth')

                    const { error: insertError } = await supabase.from('users').insert({
                        id: authData.user.id,
                        email: user.email.trim(),
                        nama: user.nama,
                        role: user.role || 'siswa',
                        kelas: user.role === 'siswa' ? user.kelas : null,
                        mapel: user.role === 'guru' ? user.mapel : null
                    })

                    if (insertError) throw insertError

                    results.success.push({ nama: user.nama, email: user.email })
                } catch (error) {
                    results.failed.push({
                        nama: user.nama,
                        email: user.email,
                        error: error.message
                    })
                }

                setImportProgress(prev => ({ ...prev, current: prev.current + 1 }))
            }))

            if (i + batchSize < users.length) {
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }

        // Restore session admin agar tetap login di dashboard admin
        if (adminSession) {
            await supabase.auth.setSession({
                access_token: adminSession.access_token,
                refresh_token: adminSession.refresh_token
            })
        }

        setImportProgress({ current: 0, total: 0, isImporting: false })
        setImportResults(results)

        showImportResults(results)
        if (onSuccess) onSuccess()
    }

    const showImportResults = (results) => {
        const successCount = results.success.length
        const failedCount = results.failed.length

        let html = `
            <div class="text-left space-y-4">
                <div class="p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
                    <p class="text-green-400 font-semibold">✅ Berhasil: ${successCount} users</p>
                </div>
        `

        if (failedCount > 0) {
            html += `
                <div class="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                    <p class="text-red-400 font-semibold">❌ Gagal: ${failedCount} users</p>
                    <div class="mt-2 max-h-40 overflow-y-auto text-xs text-gray-300">
                        ${results.failed.map(f => `<p>• ${f.nama} (${f.email}): ${f.error}</p>`).join('')}
                    </div>
                </div>
            `
        }

        html += '</div>'

        Swal.fire({
            title: 'Hasil Import',
            html: html,
            icon: successCount > 0 ? 'success' : 'error',
            confirmButtonColor: '#f97316',
            background: '#1a1a1a',
            color: '#fff',
            width: '600px'
        })
    }

    const parseExcelFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = e.target.result
                    const workbook = XLSX.read(data, { type: 'array' })
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
                    const users = XLSX.utils.sheet_to_json(firstSheet)
                    resolve(users)
                } catch (error) {
                    reject(error)
                }
            }
            reader.onerror = reject
            reader.readAsArrayBuffer(file)
        })
    }

    const handleBulkImport = (event) => {
        const file = event.target.files[0]
        if (!file) return

        parseExcelFile(file)
            .then(users => {
                const filteredUsers = users.filter(row => row.nama && row.email)

                if (filteredUsers.length === 0) {
                    Swal.fire({
                        icon: 'error',
                        title: 'File Kosong',
                        text: 'File tidak berisi data yang valid. Pastikan kolom "nama" dan "email" ada.',
                        confirmButtonColor: '#f97316',
                        background: '#1a1a1a',
                        color: '#fff'
                    })
                    event.target.value = ''
                    return
                }

                Swal.fire({
                    title: 'Konfirmasi Import',
                    html: `Anda akan mengimport <strong>${filteredUsers.length} users</strong>.<br/>Proses ini mungkin memakan waktu beberapa menit.<br/><br/>Lanjutkan?`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#f97316',
                    cancelButtonColor: '#6b7280',
                    confirmButtonText: 'Ya, Import',
                    cancelButtonText: 'Batal',
                    background: '#1a1a1a',
                    color: '#fff'
                }).then(result => {
                    if (result.isConfirmed) {
                        processUsersInBatch(filteredUsers)
                    }
                    event.target.value = ''
                })
            })
            .catch((error) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error Parsing Excel',
                    text: error.message,
                    confirmButtonColor: '#f97316',
                    background: '#1a1a1a',
                    color: '#fff'
                })
                event.target.value = ''
            })
    }

    return {
        importProgress,
        importResults,
        downloadTemplateExcel,
        handleBulkImport
    }
}
