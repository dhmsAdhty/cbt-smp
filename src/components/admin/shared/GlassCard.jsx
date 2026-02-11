const GlassCard = ({ children, className = '' }) => (
    <div className={`
        backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 
        rounded-2xl shadow-2xl shadow-orange-500/10 
        border border-orange-100/50 dark:border-orange-800/30
        transition-all duration-500 hover:shadow-orange-500/20
        ${className}
    `}>
        {children}
    </div>
)

export default GlassCard
