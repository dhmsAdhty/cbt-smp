import { useState, useEffect } from 'react'
import LoadingSpinner from '../shared/LoadingSpinner'
import { supabase } from '../../../lib/supabaseClient'
import Swal from 'sweetalert2'
import GlassCard from '../shared/GlassCard'
import BulkImport from './BulkImport'
import UserForm from './UserForm'
import UserTable from './UserTable'
import Select from '../../ui/Select'

const UsersView = () => {
    const [users, setUsers] = useState([])
    const [kelasList, setKelasList] = useState([])
    const [mapelList, setMapelList] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState({})
    const [isLoading, setIsLoading] = useState(true)

    const fetchData = async () => {
        setIsLoading(true)
        try {
            // Fetch users, kelas, mapel
            const { data: usersData, error: usersError } = await supabase.from('users').select('*')
            const { data: kelasData } = await supabase.from('kelas').select('*')
            const { data: mapelData } = await supabase.from('mapel').select('*')

            if (usersError) throw usersError

            setUsers(usersData || [])
            setKelasList(kelasData || [])
            setMapelList(mapelData || [])
        } catch (error) {
            console.error('Error fetching data:', error)
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleViewUser = (user) => {
        setSelectedUser(user)
        setEditData({
            nama: user.nama,
            email: user.email,
            role: user.role,
            kelas: user.kelas || '',
            mapel: user.mapel || ''
        })
        setIsEditing(false)
    }

    const handleCloseModal = () => {
        setSelectedUser(null)
        setIsEditing(false)
        setEditData({})
    }

    const handleUpdate = async () => {
        try {
            // Update users table
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    nama: editData.nama,
                    email: editData.email,
                    role: editData.role,
                    kelas: editData.role === 'siswa' ? editData.kelas : null,
                    mapel: editData.role === 'guru' ? editData.mapel : null
                })
                .eq('id', selectedUser.id)

            if (updateError) throw updateError

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Data user berhasil diperbarui',
                showConfirmButton: false,
                timer: 1500,
                background: '#1a1a1a',
                color: '#fff'
            })

            handleCloseModal()
            await fetchData()
            // if (onRefresh) onRefresh()
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.message,
                confirmButtonColor: '#f97316',
                background: '#1a1a1a',
                color: '#fff'
            })
        }
    }

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Hapus User?',
            text: `Yakin ingin menghapus ${selectedUser.nama}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
            background: '#1a1a1a',
            color: '#fff'
        })

        if (result.isConfirmed) {
            try {
                const { error } = await supabase.from('users').delete().eq('id', selectedUser.id)
                if (error) throw error

                Swal.fire({
                    icon: 'success',
                    title: 'Terhapus!',
                    text: 'User berhasil dihapus',
                    showConfirmButton: false,
                    timer: 1500,
                    background: '#1a1a1a',
                    color: '#fff'
                })

                handleCloseModal()
                await fetchData()
                // if (onRefresh) onRefresh()
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.message,
                    confirmButtonColor: '#f97316',
                    background: '#1a1a1a',
                    color: '#fff'
                })
            }
        }
    }

    if (isLoading) return <LoadingSpinner />

    return (
        <>
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Form Tambah User */}
                <GlassCard className="p-6 lg:col-span-1">
                    <div className="flex items-center gap-3 mb-6">
                        <h3 className="font-bold text-xl text-gray-800 dark:text-white">Tambah User Baru</h3>
                    </div>

                    <BulkImport onSuccess={fetchData} />

                    <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

                    <UserForm
                        kelasList={kelasList}
                        mapelList={mapelList}
                        onSuccess={fetchData}
                    />
                </GlassCard>

                {/* Tabel Users */}
                <GlassCard className="p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-xl text-gray-800 dark:text-white">
                            Daftar Users ({users.length})
                        </h3>
                    </div>

                    <UserTable
                        users={users}
                        onViewUser={handleViewUser}
                    />
                </GlassCard>
            </div>

            {/* Modal Detail User */}
            {selectedUser && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center text-white text-2xl font-bold">
                                        {selectedUser.nama?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{selectedUser.nama}</h2>
                                        <p className="text-orange-100">{selectedUser.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {!isEditing ? (
                                // View Mode
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-orange-50/50 dark:bg-gray-800/50 rounded-xl">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Nama Lengkap</p>
                                            <p className="font-semibold text-gray-800 dark:text-white">{selectedUser.nama}</p>
                                        </div>
                                        <div className="p-4 bg-orange-50/50 dark:bg-gray-800/50 rounded-xl">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
                                            <p className="font-semibold text-gray-800 dark:text-white">{selectedUser.email}</p>
                                        </div>
                                        <div className="p-4 bg-orange-50/50 dark:bg-gray-800/50 rounded-xl">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Role</p>
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${selectedUser.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                                selectedUser.role === 'guru' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                                                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                }`}>
                                                {selectedUser.role}
                                            </span>
                                        </div>
                                        <div className="p-4 bg-orange-50/50 dark:bg-gray-800/50 rounded-xl">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                                {selectedUser.role === 'siswa' ? 'Kelas' : selectedUser.role === 'guru' ? 'Mata Pelajaran' : 'Kelas/Mapel'}
                                            </p>
                                            <p className="font-semibold text-gray-800 dark:text-white">
                                                {selectedUser.kelas || selectedUser.mapel || '-'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all transform hover:-translate-y-0.5"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl font-semibold shadow-lg shadow-orange-600/30 hover:shadow-xl hover:shadow-orange-600/40 transition-all transform hover:-translate-y-0.5"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </>
                            ) : (
                                // Edit Mode
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Lengkap</label>
                                            <input
                                                type="text"
                                                value={editData.nama}
                                                onChange={(e) => setEditData({ ...editData, nama: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={editData.email}
                                                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                            />
                                        </div>
                                        <Select
                                            label="Role"
                                            value={editData.role}
                                            onChange={(value) => setEditData({ ...editData, role: value })}
                                            options={[
                                                { value: 'siswa', label: 'Siswa' },
                                                { value: 'guru', label: 'Guru' },
                                                { value: 'admin', label: 'Admin' }
                                            ]}
                                        />
                                        {editData.role === 'siswa' && (
                                            <Select
                                                label="Kelas"
                                                value={editData.kelas}
                                                onChange={(value) => setEditData({ ...editData, kelas: value })}
                                                placeholder="Pilih Kelas"
                                                options={kelasList?.map(k => ({ value: k.nama_kelas, label: k.nama_kelas })) || []}
                                            />
                                        )}
                                        {editData.role === 'guru' && (
                                            <Select
                                                label="Mata Pelajaran"
                                                value={editData.mapel}
                                                onChange={(value) => setEditData({ ...editData, mapel: value })}
                                                placeholder="Pilih Mapel"
                                                options={mapelList?.map(m => ({ value: m.nama_mapel, label: m.nama_mapel })) || []}
                                            />
                                        )}
                                    </div>

                                    {/* Edit Action Buttons */}
                                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={handleUpdate}
                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all transform hover:-translate-y-0.5"
                                        >
                                            Simpan
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false)
                                                setEditData({
                                                    nama: selectedUser.nama,
                                                    email: selectedUser.email,
                                                    role: selectedUser.role,
                                                    kelas: selectedUser.kelas || '',
                                                    mapel: selectedUser.mapel || ''
                                                })
                                            }}
                                            className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all transform hover:-translate-y-0.5"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default UsersView
