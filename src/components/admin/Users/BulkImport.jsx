import { useBulkImport } from '../../../hooks/useBulkImport'

const BulkImport = ({ onSuccess }) => {
    const { importProgress, downloadTemplateExcel, handleBulkImport } = useBulkImport(onSuccess)

    return (
        <div className="mb-6 p-4 bg-[#e5f3fb]/50 border border-[#0085db]/20 rounded-xl">
            <p className="text-sm font-semibold text-center text-[#0085db] mb-3">Import Bulk Users</p>
            <div className="space-y-2">
                <button
                    type="button"
                    onClick={downloadTemplateExcel}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#0085db]/30 text-[#0085db] rounded-lg hover:bg-[#e5f3fb] transition-all text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Template
                </button>
                <label className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0085db] hover:bg-[#0071ba] text-white rounded-lg cursor-pointer transition-all text-sm shadow-sm">
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
                    <div className="flex justify-between text-xs text-[#0085db] mb-1">
                        <span>Importing...</span>
                        <span>{importProgress.current} / {importProgress.total}</span>
                    </div>
                    <div className="w-full bg-[#e5f3fb] rounded-full h-2">
                        <div
                            className="bg-[#0085db] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default BulkImport
