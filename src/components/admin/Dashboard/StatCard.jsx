const StatCard = ({ title, count, color, icon }) => {
    const colors = {
        orange: 'from-orange-500 to-orange-600',
        orangeLight: 'from-orange-400 to-orange-500',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600'
    }

    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-orange-100/50 dark:border-orange-800/30 shadow-xl shadow-orange-500/10 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity" style={{
                backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`
            }}></div>
            <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color]} text-white shadow-lg transform group-hover:scale-110 transition-transform`}>
                        {icon}
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                            {count}
                        </p>
                    </div>
                </div>
                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${colors[color]} rounded-full transform origin-left group-hover:scale-x-100 scale-x-75 transition-transform duration-700`}></div>
                </div>
            </div>
        </div>
    )
}

export default StatCard
