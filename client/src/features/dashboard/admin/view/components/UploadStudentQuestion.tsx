import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { AllAdminOperation } from "../../viewModel/allAdminOperations";
import { useBulkUploadProgress } from "../../../../../utils/hooks/use_bulk_upload_progress";
import UploadProgressBar from "./UploadProgressBar";

export interface UploadExmaExcelForm {
  file: FileList;
  subject_id: string;
}

interface UploadStudentQuestionProps {
  subject_id: string;
  onClose: () => void;
  onSave:()=>void
  onUploadExcel: (file: File, subject_id: string) => void;
}

export default function UploadStudentQuestion({

  subject_id,
  onClose,
  onSave,
}: UploadStudentQuestionProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UploadExmaExcelForm>({
    defaultValues: { subject_id },
  });

  // Uploading is a background job: the server answers with a job id right away
  // and the progress bar follows it live over a WebSocket.
  const [uploadJobId, setUploadJobId] = useState<string | null>(null);
  const { status, percent } = useBulkUploadProgress(uploadJobId);
  const finished = status?.status === "done" || status?.status === "error";

  // Refresh the subject's question count once the questions are really saved.
  // The popup stays open so the admin can read the result and close it.
  useEffect(() => {
    if (status?.status === "done") onSave();
  }, [status?.status]);

  const onUpload: SubmitHandler<UploadExmaExcelForm> = async (data) => {
    if (!data.file || data.file.length === 0) {
      setError("file", { message: "Please select a file" });
      return;
    }
    const res = await AllAdminOperation.uploadQuestion({ dt: data, setError: setError });
    if (res?.data?.jobId) {
      setUploadJobId(res.data.jobId);
      reset();
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center glass-overlay"
      style={{ zIndex: 1050 }}
    >
      <div className="card glass-panel" style={{ width: "450px" }}>
        {/* Header */}
        <div className="card-header modal-head">
          <h5 className="mb-0">Upload Student Questions</h5>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
          ></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onUpload)}>
          {!uploadJobId ? (
            <div className="card-body">
              {/* File Input */}
              <div className="mb-3">
                <label className="form-label">Select Excel File (.xlsx)</label>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  {...register("file", {
                    required: "Please select an Excel file",
                  })}
                  className={`form-control ${errors.file ? "is-invalid" : ""}`}
                  readOnly={isSubmitting}
                />
                {errors.file && (
                  <div className="invalid-feedback">{errors.file.message}</div>
                )}
              </div>

              {/* Subject ID (readonly) */}
              <div className="mb-3">
                <label className="form-label">Subject ID</label>
                <input
                  type="text"
                  {...register("subject_id")}
                  value={subject_id}
                  readOnly
                  className="form-control bg-light"
                />
              </div>
            </div>
          ) : (
            <div className="card-body">
              <UploadProgressBar status={status} percent={percent} noun="questions" />
            </div>
          )}

          {/* Footer */}
          <div className="card-footer text-end">
            {!uploadJobId ? (
              <>
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={isSubmitting}>
                  {isSubmitting ? "Uploading..." : "Upload Excel"}
                </button>
              </>
            ) : (
              <>
                {status?.status === "error" && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary me-2"
                    onClick={() => setUploadJobId(null)}
                  >
                    Try again
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!finished}
                  onClick={onClose}
                >
                  {finished ? "Done" : "Please wait..."}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
