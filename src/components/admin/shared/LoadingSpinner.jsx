const LoadingSpinner = ({ color = 'orange' }) => {
    const colors = {
        orange: {
            border: 'border-orange-200 border-t-orange-600',
            pulse: 'bg-orange-500/20',
            text: 'text-orange-600',
        },
        blue: {
            border: 'border-blue-200 border-t-blue-600',
            pulse: 'bg-blue-500/20',
            text: 'text-blue-600',
        },
    }
    const c = colors[color] || colors.orange

    return (
        <div className="flex flex-col items-center justify-center h-64">
            <div className="relative">
                <div className={`w-20 h-20 border-4 ${c.border} rounded-full animate-spin`}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-10 h-10 ${c.pulse} rounded-full animate-pulse`}></div>
                </div>
            </div>
            <p className={`mt-4 ${c.text} font-medium`}>Memuat data...</p>
        </div>
    )
}

export default LoadingSpinner

