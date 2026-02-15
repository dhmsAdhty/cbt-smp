import GlassCard from '../shared/GlassCard'

const RecentActivity = ({ users }) => (
    <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
            Aktivitas Terkini
        </h3>
        <div className="space-y-3">
            {users.slice(0, 5).map((user, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-orange-50/50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                        {user.nama?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-medium text-gray-800">{user.nama}</p>
                        <p className="text-xs text-gray-500">
                            {user.role} - Bergabung baru-baru ini
                        </p>
                    </div>
                </div>
            ))}
        </div>
    </GlassCard>
)

export default RecentActivity
