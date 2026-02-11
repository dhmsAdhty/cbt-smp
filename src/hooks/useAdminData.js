import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export const useAdminData = () => {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ users: 0, guru: 0, siswa: 0, mapel: 0, kelas: 0 })
    const [dataList, setDataList] = useState({ users: [], kelas: [], mapel: [] })

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: users } = await supabase.from('users').select('*')
            const { data: kelas } = await supabase.from('kelas').select('*')
            const { data: mapel } = await supabase.from('mapel').select('*')

            setDataList({
                users: users || [],
                kelas: kelas || [],
                mapel: mapel || []
            })

            setStats({
                users: users?.length || 0,
                guru: users?.filter(u => u.role === 'guru').length || 0,
                siswa: users?.filter(u => u.role === 'siswa').length || 0,
                mapel: mapel?.length || 0,
                kelas: kelas?.length || 0
            })
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    return {
        loading,
        stats,
        dataList,
        refetch: fetchData
    }
}
