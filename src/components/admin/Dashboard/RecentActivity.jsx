import GlassCard from '../shared/GlassCard'
import { useRecentActivity } from '../../../hooks/useRecentActivity'
import { BookOpen01Icon, UserIcon, Login03Icon } from 'hugeicons-react'

const RecentActivity = () => {
    const { activities, loading } = useRecentActivity()

    return (
        <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                Aktivitas Terkini
            </h3>
            
            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            ) : activities.length > 0 ? (
                <div className="space-y-3">
                    {activities.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-4 p-3 rounded-xl bg-orange-50/50 hover:bg-orange-100/50 transition-colors">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
                                activity.type === 'soal' 
                                    ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                                    : activity.type === 'login'
                                    ? 'bg-gradient-to-br from-green-400 to-green-600'
                                    : 'bg-gradient-to-br from-orange-400 to-orange-600'
                            }`}>
                                {activity.type === 'soal' ? <BookOpen01Icon size={20} /> : activity.type === 'login' ? <Login03Icon size={20} /> : <UserIcon size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-800 truncate">{activity.title}</p>
                                <p className="text-xs text-gray-600 w-full line-clamp-2">
                                    {activity.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-sm text-gray-500 py-6">
                    Belum ada aktivitas.
                </div>
            )}
        </GlassCard>
    )
}

export default RecentActivity
