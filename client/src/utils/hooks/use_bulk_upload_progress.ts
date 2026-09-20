import { useEffect, useState } from "react";
import { watchJob, type JobStatus } from "../http/job_watcher";

// Same shape the student-upload modal already used, now shared by question uploads too.
export type BulkUploadJobStatus = JobStatus;

/**
 * Live progress for a background upload job, pushed over a WebSocket
 * (with an automatic polling fallback -- see http/job_watcher.ts).
 * Pass null to watch nothing.
 */
export function useBulkUploadProgress(jobId: string | null) {
  const [status, setStatus] = useState<BulkUploadJobStatus | null>(null);

  useEffect(() => {
    if (!jobId) {
      setStatus(null);
      return;
    }
    return watchJob(jobId, setStatus);
  }, [jobId]);

  const percent =
    status?.percent !== undefined
      ? status.percent
      : status && status.total > 0
      ? Math.min(100, Math.round((status.processed / status.total) * 100))
      : status?.status === "saving" || status?.status === "done"
      ? 100
      : 0;

  return { status, percent };
}
