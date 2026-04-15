import GlassCard from '../shared/GlassCard'
import { useRecentActivity } from '../../../hooks/useRecentActivity'
import { BookOpen01Icon, UserIcon, Login03Icon } from 'hugeicons-react'

const RecentActivity = () => {
    const { activities, loading } = useRecentActivity()

    return (
        <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-[#111c2d] mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#0085db] rounded-full"></span>
                Aktivitas Terkini
            </h3>
            
            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0085db]"></div>
                </div>
            ) : activities.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {activities.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-4 p-3 rounded-xl bg-[#f0f5f9] hover:bg-[#e5f3fb] transition-colors border border-[#e7ecf0]">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
                                activity.type === 'soal' 
                                    ? 'bg-gradient-to-br from-[#46caeb] to-[#0085db]'
                                    : activity.type === 'login'
                                    ? 'bg-gradient-to-br from-[#4bd08b] to-[#40b176]'
                                    : 'bg-gradient-to-br from-[#0085db] to-[#0071ba]'
                            }`}>
                                {activity.type === 'soal' ? <BookOpen01Icon size={20} /> : activity.type === 'login' ? <Login03Icon size={20} /> : <UserIcon size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-[#111c2d] truncate">{activity.title}</p>
                                <p className="text-xs text-[#5f686f] w-full line-clamp-2">
                                    {activity.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-sm text-[#707a82] py-6">
                    Belum ada aktivitas.
                </div>
            )}
        </GlassCard>
    )
}

export default RecentActivity
