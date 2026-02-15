const ActionButton = ({ onClick, label, icon, variant = 'primary', disabled = false }) => {
    const variants = {
        primary: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40',
        secondary: 'bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white shadow-lg shadow-orange-400/30 hover:shadow-xl hover:shadow-orange-400/40',
        outline: 'border-2 border-orange-500 text-orange-600 hover:bg-orange-50'
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-semibold 
                transition-all transform hover:-translate-y-0.5
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                ${variants[variant]}
            `}
        >
            {icon}
            <span>{label}</span>
        </button>
    )
}

export default ActionButton
