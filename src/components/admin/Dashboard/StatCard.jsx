// Matches template color palette from tailwind.config.js
const StatCard = ({ title, count, color, icon }) => {
    const colors = {
        orange: { bg: 'bg-[#0085db]', light: 'bg-[#e5f3fb]', text: 'text-[#0085db]' },
        orangeLight: { bg: 'bg-[#46caeb]', light: 'bg-[#e1f5fa]', text: 'text-[#46caeb]' },
        green: { bg: 'bg-[#4bd08b]', light: 'bg-[#dffff3]', text: 'text-[#4bd08b]' },
        purple: { bg: 'bg-[#5a6a85]', light: 'bg-[#e6ecf1]', text: 'text-[#5a6a85]' }
    }

    const c = colors[color] || colors.orange

    return (
        <div className="bg-white rounded-[18px] border border-[#e7ecf0] shadow-[0px_2px_6px_rgba(37,83,185,0.1)] p-6">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${c.bg} flex items-center justify-center text-white shrink-0`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-[#707a82] font-medium">{title}</p>
                    <p className="text-2xl font-bold text-[#111c2d] mt-0.5">{count}</p>
                </div>
            </div>
        </div>
    )
}

export default StatCard
