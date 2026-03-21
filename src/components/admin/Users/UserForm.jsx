import { useState } from 'react'
import { supabase, supabaseUrl, supabaseKey } from '../../../lib/supabaseClient'
import { createClient } from '@supabase/supabase-js'
import Swal from 'sweetalert2'
import Select from '../../ui/Select'

const UserForm = ({ kelasList, mapelList, onSuccess }) => {
    const [formData, setFormData] = useState({
        email: '', password: '', nama: '', role: 'siswa', mapel: '', kelas: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.password || formData.password.length < 6) {
            Swal.fire({
                icon: 'error',
                title: 'Password Tidak Valid',
                text: 'Password minimal 6 karakter',
                confirmButtonColor: '#f97316',
                background: '#1a1a1a',
                color: '#fff',
                iconColor: '#f97316'
            })
            return
        }

        Swal.fire({
            title: 'Menyimpan data...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading()
            }
        })

        try {
            // Simpan session admin saat ini sebelum membuat user baru
            const { data: currentSession } = await supabase.auth.getSession()
            const adminSession = currentSession.session

            // Buat client sementara yang tidak persist session
            const tempSupabase = createClient(supabaseUrl, supabaseKey, {
                auth: { popups: false, persistSession: false, detectSessionInUrl: false, autoRefreshToken: false }
            })

            const { data: authData, error: authError } = await tempSupabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    emailRedirectTo: window.location.origin,
                    data: {
                        nama: formData.nama,
                        role: formData.role
                    }
                }
            })

            if (authError) throw authError
            if (!authData.user) throw new Error('Gagal membuat akun auth')

            const { error: insertError } = await supabase.from('users').insert({
                id: authData.user.id,
                email: formData.email,
                nama: formData.nama,
                role: formData.role,
                kelas: formData.role === 'siswa' ? formData.kelas : null,
                mapel: formData.role === 'guru' ? formData.mapel : null
            })

            if (insertError) {
                console.error('Insert error:', insertError)
                throw insertError
            }

            // Restore session admin agar tetap login di dashboard admin
            if (adminSession) {
                await supabase.auth.setSession({
                    access_token: adminSession.access_token,
                    refresh_token: adminSession.refresh_token
                })
            }

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'User berhasil ditambahkan',
                showConfirmButton: false,
                timer: 1500,
                background: '#1a1a1a',
                color: '#fff',
                iconColor: '#f97316'
            })

            setFormData({ email: '', password: '', nama: '', role: 'siswa', mapel: '', kelas: '' })
            if (onSuccess) onSuccess()
        } catch (err) {
            console.error('Error adding user:', err)
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: err.message || 'Gagal menambahkan user',
                confirmButtonColor: '#f97316',
                background: '#1a1a1a',
                color: '#fff',
                iconColor: '#f97316'
            })
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                    required
                    type="email"
                    placeholder="user@sekolah.com"
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input
                    required
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    value={formData.nama}
                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                    required
                    type="password"
                    placeholder="Minimal 6 karakter"
                    minLength={6}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
            </div>

            <Select
                label="Role"
                value={formData.role}
                onChange={(value) => setFormData({ ...formData, role: value })}
                options={[
                    { value: 'siswa', label: 'Siswa' },
                    { value: 'guru', label: 'Guru' },
                    { value: 'admin', label: 'Admin' }
                ]}
            />

            {formData.role === 'siswa' && (
                <Select
                    label="Kelas"
                    value={formData.kelas}
                    onChange={(value) => setFormData({ ...formData, kelas: value })}
                    placeholder="Pilih Kelas"
                    options={kelasList.map(k => ({ value: k.nama_kelas, label: k.nama_kelas }))}
                />
            )}

            {formData.role === 'guru' && (
                <Select
                    label="Mata Pelajaran"
                    value={formData.mapel}
                    onChange={(value) => setFormData({ ...formData, mapel: value })}
                    placeholder="Pilih Mapel"
                    options={mapelList.map(m => ({ value: m.nama_mapel, label: m.nama_mapel }))}
                />
            )}

            <button
                type="submit"
                className="w-full bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all transform hover:-translate-y-0.5"
            >
                Tambah User
            </button>
        </form>
    )
}

export default UserForm
