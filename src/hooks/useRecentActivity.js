import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export const useRecentActivity = () => {
    const [loading, setLoading] = useState(true)
    const [activities, setActivities] = useState([])
    const [error, setError] = useState(null)

    const fetchActivity = useCallback(async () => {
        setLoading(true)
        try {
            // Fetch recent users
            const { data: recentUsers, error: usersError } = await supabase
                .from('users')
                .select('id, nama, role, kelas, mapel')
                .order('id', { ascending: false }) // Fallback ke id descng jika created_at tidak ada, tapi umumnya order by created_at lebih baik. Kita coba urutkan dari ID terakhir asumsikan serial/uuid bisa memberikan indikasi baru
                .limit(5)

            if (usersError) throw usersError

            // Fetch recent bank_soal
            const { data: recentSoalRaw, error: soalError } = await supabase
                .from('bank_soal')
                .select('id, mapel_id, guru_id, created_at')
                .order('id', { ascending: false })
                .limit(5)

            if (soalError) throw soalError
            
            let recentSoal = []
            if (recentSoalRaw && recentSoalRaw.length > 0) {
                const mapelIds = [...new Set(recentSoalRaw.map(s => s.mapel_id).filter(Boolean))]
                const guruIds = [...new Set(recentSoalRaw.map(s => s.guru_id).filter(Boolean))]
                
                const [mapelRes, guruRes] = await Promise.all([
                    mapelIds.length > 0 ? supabase.from('mapel').select('id, nama_mapel').in('id', mapelIds) : { data: [] },
                    guruIds.length > 0 ? supabase.from('users').select('id, nama').in('id', guruIds) : { data: [] }
                ])
                
                recentSoal = recentSoalRaw.map(soal => ({
                    ...soal,
                    mapel: mapelRes.data?.find(m => m.id === soal.mapel_id),
                    guru: guruRes.data?.find(g => g.id === soal.guru_id)
                }))
            }

            // Fetch recent logins
            const { data: recentLogins, error: loginsError } = await supabase
                .from('users')
                .select('id, nama, role, last_login')
                .not('last_login', 'is', null)
                .order('last_login', { ascending: false })
                .limit(5)

            if (loginsError) throw loginsError

            // Format kegiatan
            const formattedActivities = []

            if (recentSoal) {
                recentSoal.forEach((soal, index) => {
                    formattedActivities.push({
                        id: `soal-${soal.id}`,
                        type: 'soal',
                        title: 'Bank Soal Baru',
                        description: `${soal.guru?.nama || 'Guru'} menambahkan soal baru di mapel ${soal.mapel?.nama_mapel || 'tertentu'}.`,
                        // Use created_at if available, otherwise fake an older time based on index to keep them below real recent logins
                        timestamp: soal.created_at ? new Date(soal.created_at).getTime() : (new Date().getTime() - 86400000 - (index * 1000))
                    })
                })
            }

            if (recentUsers) {
                recentUsers.forEach((user, index) => {
                    let desc = `${user.nama} baru saja terdaftar sebagai ${user.role}.`
                    if (user.role === 'siswa' && user.kelas) desc = `${user.nama} terdaftar di kelas ${user.kelas}.`
                    if (user.role === 'guru' && user.mapel) desc = `${user.nama} bergabung menjadi guru mapel ${user.mapel}.`

                    formattedActivities.push({
                        id: `user-${user.id}`,
                        type: 'user',
                        title: 'Pengguna Baru terdaftar',
                        description: desc,
                        timestamp: user.created_at ? new Date(user.created_at).getTime() : (new Date().getTime() - 86400000 - 50000 - (index * 1000))
                    })
                })
            }

            if (recentLogins) {
                recentLogins.forEach(user => {
                    if (!user.last_login) return
                    formattedActivities.push({
                        id: `login-${user.id}-${new Date(user.last_login).getTime()}`,
                        type: 'login',
                        title: 'Aktivitas Login',
                        description: `${user.nama} (${user.role}) baru saja masuk ke sistem.`,
                        timestamp: new Date(user.last_login).getTime()
                    })
                })
            }

            // Sort combining all them by approximate timestamp desc
            formattedActivities.sort((a, b) => b.timestamp - a.timestamp)
            
            setActivities(formattedActivities.slice(0, 10))
        } catch (err) {
            console.error('Error fetching recent activity:', err)
            setError(err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchActivity()
    }, [fetchActivity])

    return { loading, activities, error, refetch: fetchActivity }
}
