import { useForm, type SubmitHandler } from "react-hook-form";
import { useClassCreationStore } from "../../../../../utils/hooks/use_class_creation_store";
import { AllAdminOperation } from "../../viewModel/allAdminOperations";

export type ClassFormValues = {
  className: string;
  title: string;
  teacherName: string;
}

export default function AddNewClassForm() {
  const { setProgress } = useClassCreationStore();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
    reset,
  } = useForm<ClassFormValues>();

  const onSubmit:SubmitHandler<ClassFormValues> = async (data) => {
    await AllAdminOperation.submitNewClassData({data: data, setError: setError})

  };

  const handleCancel = () => {
    reset();
    setProgress(false);
  };

  return (
    <div className="container mt-4 form-container">
      {/* Header Row */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="text-secondary m-0">Add New Class</h3>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm px-4 py-2 shadow-sm"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-4 border rounded-3 shadow-sm bg-light"
      >
        {/* Class Name */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Class Name</label>
          <input
            type="text"
            className={`form-control ${errors.className ? "is-invalid" : ""}`}
            {...register("className", { required: "Class name is required" })}
            placeholder="Enter class name"
          />
          {errors.className && (
            <div className="invalid-feedback">
              {(errors.className?.message as string) || ""}
            </div>
          )}
        </div>

        {/* Teacher Title + Name */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Teacher Name</label>
          <div className="input-group">
            <select
              className={`form-select ${
                errors.title ? "is-invalid" : ""
              }`}
              {...register("title", { required: "Title is required" })}
              style={{ maxWidth: "100px" }}
            >
              <option value="">Title</option>
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
              <option value="Dr.">Dr.</option>
            </select>
            <input
              type="text"
              className={`form-control ${
                errors.teacherName ? "is-invalid" : ""
              }`}
              {...register("teacherName", {
                required: "Teacher name is required",
              })}
              placeholder="Enter teacher name"
            />
          </div>

          {(errors.title || errors.teacherName) && (
            <div className="text-danger small mt-1">
              {errors.title?.message || errors.teacherName?.message}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button type="submit" className="btn btn-primary w-100 fw-semibold">
          Add Class
        </button>
      </form>
    </div>
  );
}
