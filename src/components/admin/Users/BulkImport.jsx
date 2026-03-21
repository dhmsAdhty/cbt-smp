import { useBulkImport } from '../../../hooks/useBulkImport'

const BulkImport = ({ onSuccess }) => {
    const { importProgress, downloadTemplateExcel, handleBulkImport } = useBulkImport(onSuccess)

    return (
        <div className="mb-6 p-4 bg-orange-50/50 border border-orange-200/50 rounded-xl">
            <p className="text-sm font-semibold text-center text-orange-700 mb-3">Import Bulk Users</p>
            <div className="space-y-2">
                <button
                    type="button"
                    onClick={downloadTemplateExcel}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-all text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Template
                </button>
                <label className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg cursor-pointer transition-all text-sm shadow-lg shadow-orange-500/30">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Excel File
                    <input
                        type="file"
                        accept=".xlsx,.xls"
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
