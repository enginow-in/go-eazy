/**
 * FileUploadList — reusable UI for per-file upload progress.
 *
 * Props:
 *   fileStates  — array from useFileUpload().fileStates
 *   onRetry(id) — called when user clicks Retry on a failed file
 *   compact     — if true, renders a slimmer variant (for documents)
 */
import React from 'react'
import { CheckCircle2, XCircle, RefreshCw, Upload, Loader2 } from 'lucide-react'

const STATUS_CONFIG = {
  pending: {
    label: 'Waiting…',
    badgeClass: 'bg-gray-100 text-gray-500',
    icon: <Upload size={12} className="opacity-60" />,
    barClass: 'bg-gray-300',
    trackClass: 'bg-gray-100',
  },
  uploading: {
    label: 'Uploading',
    badgeClass: 'bg-blue-100 text-blue-600',
    icon: <Loader2 size={12} className="animate-spin" />,
    barClass: 'bg-gradient-to-r from-blue-400 to-[#CA3433]',
    trackClass: 'bg-blue-50',
  },
  success: {
    label: 'Done',
    badgeClass: 'bg-green-100 text-green-600',
    icon: <CheckCircle2 size={12} />,
    barClass: 'bg-gradient-to-r from-green-400 to-green-500',
    trackClass: 'bg-green-50',
  },
  error: {
    label: 'Failed',
    badgeClass: 'bg-red-100 text-[#CA3433]',
    icon: <XCircle size={12} />,
    barClass: 'bg-red-400',
    trackClass: 'bg-red-50',
  },
}

const FileRow = ({ entry, onRetry, compact }) => {
  const cfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending

  return (
    <div
      className={`rounded-xl border transition-all duration-300 ${
        entry.status === 'error'
          ? 'border-red-200 bg-red-50/40'
          : entry.status === 'success'
          ? 'border-green-100 bg-green-50/30'
          : 'border-gray-100 bg-white'
      } ${compact ? 'px-3 py-2.5' : 'px-4 py-3'}`}
    >
      {/* Top row: name + badge + retry */}
      <div className="flex items-center gap-2 mb-2">
        {/* File name */}
        <span
          className={`flex-1 font-medium text-gray-800 truncate ${compact ? 'text-xs' : 'text-sm'}`}
          title={entry.name}
        >
          {entry.name}
        </span>

        {/* Size */}
        {entry.sizeLabel && (
          <span className="text-[10px] text-gray-400 font-medium shrink-0">
            {entry.sizeLabel}
          </span>
        )}

        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${cfg.badgeClass}`}
        >
          {cfg.icon}
          {cfg.label}
        </span>

        {/* Retry button */}
        {entry.status === 'error' && onRetry && (
          <button
            type="button"
            onClick={() => onRetry(entry.id)}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#CA3433] text-white text-[10px] font-bold hover:bg-[#ac2d2c] active:scale-95 transition-all"
          >
            <RefreshCw size={10} />
            Retry
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className={`w-full h-1.5 rounded-full overflow-hidden ${cfg.trackClass}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${cfg.barClass}`}
          style={{ width: `${entry.progress}%` }}
        />
      </div>

      {/* Error message */}
      {entry.status === 'error' && entry.errorMsg && (
        <p className="mt-1.5 text-[10px] text-red-500 font-medium">{entry.errorMsg}</p>
      )}
    </div>
  )
}

export const FileUploadList = ({ fileStates = [], onRetry, compact = false }) => {
  if (!fileStates.length) return null

  const total = fileStates.length
  const successCount = fileStates.filter((f) => f.status === 'success').length
  const errorCount = fileStates.filter((f) => f.status === 'error').length
  const allDone = fileStates.every((f) => f.status === 'success' || f.status === 'error')

  return (
    <div className="space-y-2 mt-3">
      {/* Summary line */}
      {allDone && (
        <div
          className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl ${
            errorCount > 0
              ? 'bg-red-50 text-red-600 border border-red-100'
              : 'bg-green-50 text-green-600 border border-green-100'
          }`}
        >
          {errorCount > 0 ? (
            <>
              <XCircle size={13} />
              {successCount}/{total} uploaded — {errorCount} failed. Retry the failed file(s) before continuing.
            </>
          ) : (
            <>
              <CheckCircle2 size={13} />
              {successCount}/{total} {total === 1 ? 'file' : 'files'} uploaded successfully ✓
            </>
          )}
        </div>
      )}

      {/* File rows */}
      {fileStates.map((entry) => (
        <FileRow
          key={entry.id}
          entry={entry}
          onRetry={onRetry}
          compact={compact}
        />
      ))}
    </div>
  )
}
