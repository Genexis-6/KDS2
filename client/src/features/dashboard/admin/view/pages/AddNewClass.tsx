import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { AllAdminOperation } from "../../viewModel/allAdminOperations";


export interface AddNewSubjectForm {
    title: string;
    author: string;
    enable: boolean;
    classId: string;
}

export default function AddNewSubject() {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate()


    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<AddNewSubjectForm>({
        defaultValues: {
            enable: true,
            classId: classId || "",
        },
    });

    const onSubmit: SubmitHandler<AddNewSubjectForm> = async (data) => {
        var res = await AllAdminOperation.addNewSubject({ dt: data, setError: setError })
        if (res?.statusCode === 200) {
            navigate(-1)
            reset()
        }
    };

    return (
        <div className="admin-container mt-5">
            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body">
                                <h4 className="mb-4 text-primary fw-semibold">Add New Subject</h4>

                                <form onSubmit={handleSubmit(onSubmit)}>
                                    {/* Title */}
                                    <div className="mb-3">
                                        <label className="form-label">Subject Title</label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.title ? "is-invalid" : ""}`}
                                            placeholder="Enter subject title (e.g. Biology)"
                                            {...register("title", { required: "Title is required" })}
                                        />
                                        {errors.title && (
                                            <div className="invalid-feedback">{errors.title.message}</div>
                                        )}
                                    </div>

                                    {/* Author */}
                                    <div className="mb-3">
                                        <label className="form-label">Author</label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.author ? "is-invalid" : ""}`}
                                            placeholder="Enter author name"
                                            {...register("author", { required: "Author is required" })}
                                        />
                                        {errors.author && (
                                            <div className="invalid-feedback">{errors.author.message}</div>
                                        )}
                                    </div>

                                    {/* Enable toggle */}
                                    <div className="form-check form-switch mb-3">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="enableSwitch"
                                            {...register("enable")}
                                        />
                                        <label className="form-check-label" htmlFor="enableSwitch">
                                            Enable subject
                                        </label>
                                    </div>

                                    {/* Class ID (readonly) */}
                                    <div className="mb-4">
                                        <label className="form-label">Class Key</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            readOnly
                                            {...register("classId")}
                                        />
                                    </div>

                                    {/* Submit button */}
                                    <div className="d-flex justify-content-end">
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                    aria-hidden="true"
                                                ></span>
                                            ) : (
                                                <span>+</span>
                                            )}{" "}
                                            Add Subject
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
