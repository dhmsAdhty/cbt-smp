import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export const useMapelStats = () => {
    const [loading, setLoading] = useState(true)
    const [mapelStats, setMapelStats] = useState([])
    const [error, setError] = useState('')

    const fetchStats = useCallback(async () => {
        setLoading(true)
        setError('')

        try {
            const [
                { data: mapelData, error: mapelError },
                { data: soalData, error: soalError },
                { data: kelasData, error: kelasError },
                { data: usersData, error: usersError }
            ] = await Promise.all([
                supabase.from('mapel').select('id, nama_mapel').order('nama_mapel', { ascending: true }),
                supabase.from('bank_soal').select('id, mapel_id, kelas_id, guru_id, deleted_at'),
                supabase.from('kelas').select('id, nama_kelas'),
                supabase.from('users').select('id, nama, role, mapel')
            ])

            if (mapelError) throw mapelError
            if (soalError) throw soalError
            if (kelasError) throw kelasError
            if (usersError) throw usersError

            const kelasMap = new Map((kelasData || []).map(k => [k.id, k.nama_kelas]))
            const userMap = new Map((usersData || []).map(u => [u.id, u]))
            const guruByMapelName = new Map()

            ;(usersData || []).forEach(user => {
                if (user.role !== 'guru' || !user.mapel) return
                if (!guruByMapelName.has(user.mapel)) guruByMapelName.set(user.mapel, new Set())
                guruByMapelName.get(user.mapel).add(user.nama)
            })

            const aggregated = (mapelData || []).map(mapel => {
                const activeSoal = (soalData || []).filter(
                    soal => soal.mapel_id === mapel.id && soal.deleted_at === null
                )

                const kelasSet = new Set()
                const guruSet = new Set()

                activeSoal.forEach(soal => {
                    if (soal.kelas_id && kelasMap.has(soal.kelas_id)) {
                        kelasSet.add(kelasMap.get(soal.kelas_id))
                    }

                    if (soal.guru_id && userMap.has(soal.guru_id)) {
                        guruSet.add(userMap.get(soal.guru_id).nama)
                    }
                })

                // Fallback: jika soal belum punya guru_id, ambil guru berdasarkan mapel di profil guru.
                if (guruSet.size === 0 && guruByMapelName.has(mapel.nama_mapel)) {
                    guruByMapelName.get(mapel.nama_mapel).forEach(namaGuru => guruSet.add(namaGuru))
                }

                return {
                    id: mapel.id,
                    namaMapel: mapel.nama_mapel,
                    jumlahSoal: activeSoal.length,
                    kelasList: Array.from(kelasSet).sort((a, b) => a.localeCompare(b)),
                    guruList: Array.from(guruSet).sort((a, b) => a.localeCompare(b))
                }
            })

            setMapelStats(aggregated)
        } catch (err) {
            console.error('Error fetching mapel stats:', err)
            setError(err.message || 'Gagal mengambil statistik mapel')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    return {
        loading,
        mapelStats,
        error,
        refetch: fetchStats
    }
}
