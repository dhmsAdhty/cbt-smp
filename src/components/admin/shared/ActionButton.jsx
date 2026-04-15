const ActionButton = ({ onClick, label, icon, variant = 'primary', disabled = false }) => {
    const variants = {
        primary: 'bg-[#0085db] hover:bg-[#0071ba] text-white shadow-sm',
        secondary: 'bg-[#46caeb] hover:bg-[#3cacc8] text-white shadow-sm',
        outline: 'border-2 border-[#0085db] text-[#0085db] hover:bg-[#e5f3fb]'
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
