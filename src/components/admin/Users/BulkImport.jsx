import { useBulkImport } from '../../../hooks/useBulkImport'

const BulkImport = ({ onSuccess }) => {
    const { importProgress, downloadTemplate, downloadTemplateExcel, handleBulkImport } = useBulkImport(onSuccess)

    return (
        <div className="mb-6 p-4 bg-orange-50/50 border border-orange-200/50 rounded-xl">
            <p className="text-sm font-semibold text-center text-orange-700 mb-3">Import Bulk Users</p>
            <div className="space-y-2">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={downloadTemplate}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-all text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        CSV
                    </button>
                    <button
                        type="button"
                        onClick={downloadTemplateExcel}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-green-300 text-green-600 rounded-lg hover:bg-green-50 transition-all text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Excel
                    </button>
                </div>
                    </svg>
                    Upload CSV / Excel File
                    <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleBulkImport}
                        className="hidden"
                        disabled={importProgress.isImporting}
                    />
                </label>
            </div>
            {importProgress.isImporting && (
                <div className="mt-3">
                    <div className="flex justify-between text-xs text-orange-600 mb-1">
                        <span>Importing...</span>
                        <span>{importProgress.current} / {importProgress.total}</span>
                    </div>
                    <div className="w-full bg-orange-200 rounded-full h-2">
                        <div
                            className="bg-linear-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default BulkImport
