import { useJobProgress, type JobProgress } from "../../utils/hooks/use_job_progress"

type Props = {
    /** The jobId returned by the upload endpoint. Renders nothing while null. */
    jobId: string | null | undefined
    /** What is being uploaded, e.g. "students" or "questions". */
    noun?: string
    /** Status endpoint for the polling fallback (defaults to the bulk-student one). */
    pollUrl?: string
    /** Fires once when the job completes or fails, e.g. to refresh the list. */
    onFinished?: (progress: JobProgress) => void
}

function label(p: JobProgress, noun: string): string {
    switch (p.state) {
        case "connecting":
            return "Starting upload…"
        case "running":
            return p.total > 0 ? `${p.succeeded} of ${p.total} ${noun} uploaded` : `Preparing ${noun}…`
        case "completed":
            return `Upload complete: ${p.succeeded} of ${p.total} ${noun} uploaded`
        case "failed":
            return p.message || "Upload failed"
    }
}

/** Bootstrap progress bar driven by the job WebSocket. Drop it next to any upload button. */
export default function UploadProgressBar({ jobId, noun = "students", pollUrl, onFinished }: Props) {
    const p = useJobProgress(jobId, { pollUrl, onFinished })
    if (!jobId) return null

    const running = p.state === "connecting" || p.state === "running"
    const indeterminate = running && p.total === 0
    const color =
        p.state === "failed" ? "bg-danger"
        : p.state === "completed" ? (p.failed > 0 ? "bg-warning" : "bg-success")
        : ""
    const width = indeterminate ? 100 : p.percent

    return (
        <div className="my-3" role="status" aria-live="polite">
            <div className="d-flex justify-content-between small mb-1">
                <span>{label(p, noun)}</span>
                {!indeterminate && <span>{p.percent}%</span>}
            </div>

            <div className="progress" style={{ height: 14 }}>
                <div
                    className={`progress-bar ${color} ${running ? "progress-bar-striped progress-bar-animated" : ""}`}
                    role="progressbar"
                    style={{ width: `${width}%` }}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={p.percent}
                />
            </div>

            {p.failed > 0 && (
                <div className="text-danger small mt-1">
                    {p.failed} {p.failed === 1 ? "row" : "rows"} failed
                </div>
            )}

            {p.errors.length > 0 && (
                <details className="small mt-1">
                    <summary>Show errors</summary>
                    <ul className="mb-0">
                        {p.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                </details>
            )}
        </div>
    )
}
