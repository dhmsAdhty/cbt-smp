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
                        className="w-full pl-10 pr-4 py-2.5 bg-[#f0f5f9] border border-[#e7ecf0] rounded-xl focus:ring-2 focus:ring-[#0085db]/20 focus:border-[#0085db] transition-all"
                    />
                </div>
                <div className="text-sm text-[#5f686f] font-medium">
                    {totalUsers} user{totalUsers !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-[#e7ecf0]">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#e7ecf0] bg-[#f0f5f9]">
                            <th className="text-left p-4 text-xs font-bold text-[#5f686f] uppercase tracking-wide">Nama</th>
                            <th className="text-left p-4 text-xs font-bold text-[#5f686f] uppercase tracking-wide">Role</th>
                            <th className="text-left p-4 text-xs font-bold text-[#5f686f] uppercase tracking-wide">Kelas/Mapel</th>
                            <th className="text-left p-4 text-xs font-bold text-[#5f686f] uppercase tracking-wide">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map((user) => (
                                <tr key={user.id} className="border-b border-[#eef2f6] hover:bg-[#f8fbfe] transition-colors">
                                    <td className="p-4 text-sm text-[#111c2d] font-semibold">{user.nama}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'guru' ? 'bg-[#e5f3fb] text-[#0085db]' :
                                                'bg-[#dffff3] text-[#40b176]'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-[#5f686f]">
                                        {user.kelas || user.mapel || '-'}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => onViewUser(user)}
                                            className="px-4 py-2 bg-gradient-to-r from-[#0085db] to-[#0071ba] hover:from-[#0071ba] hover:to-[#00639f] text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                                        >
                                            Lihat
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-[#707a82]">
                                    {searchQuery ? 'Tidak ada user yang sesuai dengan pencarian' : 'Belum ada user'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-[#e7ecf0]">
                    <div className="text-sm text-[#5f686f]">
                        Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalUsers)} dari {totalUsers} user
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 rounded-lg bg-[#f0f5f9] text-[#5f686f] hover:bg-[#e5f3fb] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                                ? 'bg-gradient-to-r from-[#0085db] to-[#0071ba] text-white shadow-sm'
                                                : 'bg-[#f0f5f9] text-[#5f686f] hover:bg-[#e5f3fb]'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                } else if (
                                    page === currentPage - 2 ||
                                    page === currentPage + 2
                                ) {
                                    return <span key={page} className="px-2 text-[#707a82]">...</span>
                                }
                                return null
                            })}
                        </div>

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 rounded-lg bg-[#f0f5f9] text-[#5f686f] hover:bg-[#e5f3fb] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
