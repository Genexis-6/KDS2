import { useForm, type SubmitHandler } from "react-hook-form";
import { useState } from "react";
import { AllAdminOperation } from "../../viewModel/allAdminOperations";
import { useViewClassInfoStore } from "../../../../../utils/hooks/use_view_class_info";
import { uploadStudentsExcel } from "../../viewModel/uploadStudentExcel";
import { useNotificationStore } from "../../../../../utils/hooks/use_notification_store";

export interface AddNewStudentForm {
    full_name: string;
    identifier: string;
    class_id: string;
    password: string;
}

interface UploadExcelForm {
    file: FileList;
    class_id: string;
}

interface AddNewStudentToClassProps {
    className:string
    classId: string;
    onClose: () => void;
    onSave: (data: AddNewStudentForm) => void;
    onUploadExcel: (file: File, classId: string) => void;
}

export default function AddNewStudentToClass({
    className,
    classId,
    onClose,
    onSave,
}: AddNewStudentToClassProps) {
    const [isExcelMode, setIsExcelMode] = useState(false);
     const { getClassInfo } = useViewClassInfoStore();
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setError: setErrorManual
    } = useForm<AddNewStudentForm>({
        defaultValues: {
            full_name: "",
            identifier: "",
            password: "",
            class_id: classId,
        },
    });


    const {
        register: registerExcel,
        handleSubmit: handleExcelSubmit,
        reset: resetExcel,
        formState: { errors: excelErrors, isSubmitting },
    } = useForm<UploadExcelForm>({
        defaultValues: { class_id: classId },
    });

    const onSubmit: SubmitHandler<AddNewStudentForm> = async (data) => {
        var res = await AllAdminOperation.registerUseManually({ dt: data, setError: setErrorManual })
        if (res?.statusCode === 200) {
            reset()
            await getClassInfo(className)
            onClose()
        }
        onSave(data);
    };

    const onUpload: SubmitHandler<UploadExcelForm> = async (data) => {
        if (data.file && data.file.length > 0) {
          const file = data.file[0];
          try {
            await uploadStudentsExcel({ file, classId });
            resetExcel(); // clear form
            useNotificationStore.getState().showNotification("Excel upload started in background", "success");
            reset()
            await getClassInfo(className)
            onClose()
          } catch (err) {
            console.error(err);
          }
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
                    <h5 className="mb-0">
                        {isExcelMode ? "Upload Excel File" : "Add Student to Class"}
                    </h5>
                    <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={onClose}
                    ></button>
                </div>

                {/* Toggle Buttons */}
                <div className="card-body border-bottom pb-2 d-flex justify-content-center gap-2">
                    <button
                        className={`btn btn-sm ${!isExcelMode ? "btn-primary" : "btn-outline-primary"
                            }`}
                        onClick={() => setIsExcelMode(false)}
                    >
                        Manual Entry
                    </button>
                    <button
                        className={`btn btn-sm ${isExcelMode ? "btn-primary" : "btn-outline-primary"
                            }`}
                        onClick={() => setIsExcelMode(true)}
                    >
                        Upload Excel
                    </button>
                </div>

                {/* Manual Form */}
                {!isExcelMode && (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="card-body">
                            {/* Full Name */}
                            <div className="mb-3">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    readOnly={isSubmitting}
                                    {...register("full_name", {
                                        required: "Full name is required",
                                    })}
                                    className={`form-control ${errors.full_name ? "is-invalid" : ""
                                        }`}
                                    placeholder="Enter full name"
                                />
                                {errors.full_name && (
                                    <div className="invalid-feedback">
                                        {errors.full_name.message}
                                    </div>
                                )}
                            </div>

                            {/* Identifier */}
                            <div className="mb-3">
                                <label className="form-label">Identifier</label>
                                <input
                                    readOnly={isSubmitting}
                                    type="text"
                                    {...register("identifier", {
                                        required: "Identifier is required",
                                    })}
                                    className={`form-control ${errors.identifier ? "is-invalid" : ""
                                        }`}
                                    placeholder="Enter student identifier"
                                />
                                {errors.identifier && (
                                    <div className="invalid-feedback">
                                        {errors.identifier.message}
                                    </div>
                                )}
                            </div>

                            {/* Password */}
                            <div className="mb-3">
                                <label className="form-label">Password</label>
                                <input
                                    readOnly={isSubmitting}
                                    type="password"
                                    {...register("password", {
                                        required: "Password is required",
                                    })}
                                    className={`form-control ${errors.password ? "is-invalid" : ""
                                        }`}
                                    placeholder="Enter password"
                                />
                                {errors.password && (
                                    <div className="invalid-feedback">
                                        {errors.password.message}
                                    </div>
                                )}
                            </div>

                            {/* Class ID (read-only) */}
                            <div className="mb-3">
                                <label className="form-label">Class ID</label>
                                <input
                                    type="text"
                                    {...register("class_id")}
                                    value={classId}
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
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-success">
                                {isSubmitting ? "Submitting..." : "Add Student"}
                            </button>
                        </div>
                    </form>
                )}

                {/* Excel Upload Form */}
                {isExcelMode && (
                    <form onSubmit={handleExcelSubmit(onUpload)}>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Select Excel File (.xlsx)</label>
                                <input
                                    readOnly={isSubmitting}
                                    type="file"
                                    accept=".xlsx, .xls"
                                    {...registerExcel("file", {
                                        required: "Please select an Excel file",
                                    })}
                                    className={`form-control ${excelErrors.file ? "is-invalid" : ""
                                        }`}
                                />
                                {excelErrors.file && (
                                    <div className="invalid-feedback">
                                        {excelErrors.file.message}
                                    </div>
                                )}
                            </div>

                            {/* Class ID (readonly) */}
                            <div className="mb-3">
                                <label className="form-label">Class ID</label>
                                <input
                                    type="text"
                                    {...registerExcel("class_id")}
                                    value={classId}
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
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-success">
                                {isSubmitting ? "uploading..." : "Upload Excel"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
