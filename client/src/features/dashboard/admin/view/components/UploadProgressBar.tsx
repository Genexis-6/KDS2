import { CheckCircle2, XCircle } from "lucide-react";
import type { BulkUploadJobStatus } from "../../../../../utils/hooks/use_bulk_upload_progress";

const PHASE_LABEL: Record<BulkUploadJobStatus["status"], string> = {
    pending: "Starting",
    parsing: "Reading file",
    hashing: "Creating accounts",
    saving: "Saving",
    done: "Done",
    error: "Failed",
};

interface UploadProgressBarProps {
    status: BulkUploadJobStatus | null;
    percent: number;
    /** what is being uploaded, e.g. "students" or "questions" */
    noun: string;
}

/** Live progress for a background upload (students or questions). */
export default function UploadProgressBar({ status, percent, noun }: UploadProgressBarProps) {
    if (status?.status === "error") {
        return (
            <div className="d-flex align-items-start gap-2 mb-2" style={{ color: "var(--cbx-rose-700)" }}>
                <XCircle size={20} />
                <div>
                    <div className="fw-semibold">Upload failed</div>
                    <small>{status.message || status.error}</small>
                </div>
            </div>
        );
    }

    if (status?.status === "done") {
        return (
            <div className="d-flex align-items-start gap-2 mb-2" style={{ color: "var(--cbx-mint-700)" }}>
                <CheckCircle2 size={20} />
                <div>
                    <div className="fw-semibold">Upload complete</div>
                    <small className="text-muted">{status.message}</small>
                </div>
            </div>
        );
    }

    // While saving, show how many are really in the database; before that, how many are prepared.
    const count = status ? (status.status === "saving" ? status.created : status.processed) : 0;
    const shownPercent = status ? Math.max(percent, 2) : 2;

    return (
        <>
            <div className="d-flex justify-content-between mb-1">
                <small className="text-muted">{status ? PHASE_LABEL[status.status] : "Starting"}...</small>
                <small className="text-muted">
                    {status && status.total > 0 ? `${count}/${status.total} ${noun} · ${percent}%` : ""}
                </small>
            </div>
            <div className="progress" style={{ height: "10px" }}>
                <div
                    className="progress-bar"
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    style={{
                        width: `${shownPercent}%`,
                        backgroundColor: "var(--cbx-sky-500)",
                        transition: "width 0.3s ease",
                    }}
                />
            </div>
            <small className="text-muted d-block mt-2">{status?.message}</small>
        </>
    );
}
