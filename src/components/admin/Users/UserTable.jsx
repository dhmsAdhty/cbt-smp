import { useState, useEffect } from 'react'

const UserTable = ({
    users,
    totalUsers,
    currentPage,
    itemsPerPage,
    searchQuery,
    onPageChange,
    onSearchChange,
    onViewUser
}) => {
    const [localSearch, setLocalSearch] = useState(searchQuery)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== searchQuery) {
                onSearchChange(localSearch)
                onPageChange(1) // Reset ke halaman 1 tiap kali pencarian berubah
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [localSearch, searchQuery, onSearchChange, onPageChange])

    const totalPages = Math.ceil((totalUsers || 0) / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage

    const goToPage = (page) => {
        onPageChange(Math.max(1, Math.min(page, totalPages)))
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Cari nama, email, role, kelas, atau mapel..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                </div>
                <div className="text-sm text-gray-600">
                    {totalUsers} user{totalUsers !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left p-4 text-sm font-semibold text-gray-700">Nama</th>
                            <th className="text-left p-4 text-sm font-semibold text-gray-700">Role</th>
                            <th className="text-left p-4 text-sm font-semibold text-gray-700">Kelas/Mapel</th>
                            <th className="text-left p-4 text-sm font-semibold text-gray-700">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map((user) => (
                                <tr key={user.id} className="border-b border-gray-100 hover:bg-orange-50/50 transition-colors">
                                    <td className="p-4 text-sm text-gray-800 font-medium">{user.nama}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'guru' ? 'bg-orange-100 text-orange-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {user.kelas || user.mapel || '-'}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => onViewUser(user)}
                                            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transform hover:-translate-y-0.5"
                                        >
                                            Lihat
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-500">
                                    {searchQuery ? 'Tidak ada user yang sesuai dengan pencarian' : 'Belum ada user'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalUsers)} dari {totalUsers} user
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                ) {
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => goToPage(page)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${page === currentPage
                                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                                                : 'bg-gray-100 text-gray-700 hover:bg-orange-100'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                } else if (
                                    page === currentPage - 2 ||
                                    page === currentPage + 2
                                ) {
                                    return <span key={page} className="px-2 text-gray-400">...</span>
                                }
                                return null
                            })}
                        </div>

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default UserTable
