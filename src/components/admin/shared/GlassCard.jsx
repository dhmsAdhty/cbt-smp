// Matches template .card style
const GlassCard = ({ children, className = '' }) => (
    <div className={`
        bg-white
        rounded-[18px]
        border border-[#e7ecf0]
        shadow-[0px_2px_6px_rgba(37,83,185,0.1)]
        ${className}
    `}>
        {children}
    </div>
)

export default GlassCard
