const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-64">
        <div className="relative">
            <div className="w-20 h-20 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full animate-pulse"></div>
            </div>
        </div>
        <p className="mt-4 text-orange-600 dark:text-orange-400 font-medium">Memuat data...</p>
    </div>
)

export default LoadingSpinner
