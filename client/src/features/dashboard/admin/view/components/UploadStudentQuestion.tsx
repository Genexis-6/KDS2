import { useForm, type SubmitHandler } from "react-hook-form";
import { AllAdminOperation } from "../../viewModel/allAdminOperations";

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

  const onUpload: SubmitHandler<UploadExmaExcelForm> = async (data) => {
    if (!data.file || data.file.length === 0) {
      setError("file", { message: "Please select a file" });
      return;
    }
    var res = await AllAdminOperation.uploadQuestion({dt:data, setError:setError})
    if(res?.statusCode === 200){
      onSave()
        onClose()
        reset();
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
      style={{ zIndex: 1050 }}
    >
      <div className="card shadow-lg" style={{ width: "450px" }}>
        {/* Header */}
        <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Upload Student Questions</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={onClose}
          ></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onUpload)}>
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

          {/* Footer */}
          <div className="card-footer text-end">
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
          </div>
        </form>
      </div>
    </div>
  );
}
