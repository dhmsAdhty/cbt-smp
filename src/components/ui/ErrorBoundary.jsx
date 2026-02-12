import React from 'react'
import { Alert02Icon, RefreshIcon } from 'hugeicons-react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo)
        this.setState({ errorInfo })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
                    <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Alert02Icon size={40} className="text-red-600 dark:text-red-400" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Terjadi Kesalahan
                            </h2>

                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Maaf, aplikasi mengalami gangguan. Silakan coba muat ulang halaman.
                            </p>

                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6 text-left overflow-auto max-h-40">
                                <p className="text-xs font-mono text-red-500 break-words">
                                    {this.state.error && this.state.error.toString()}
                                </p>
                            </div>

                            <button
                                onClick={() => window.location.reload()}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-red-600/20"
                            >
                                <RefreshIcon size={20} />
                                <span>Muat Ulang Halaman</span>
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
