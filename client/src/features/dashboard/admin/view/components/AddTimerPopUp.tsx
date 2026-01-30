import { useForm, type SubmitHandler } from "react-hook-form";
import { AllAdminOperation } from "../../viewModel/allAdminOperations";
import { useFullSubjectStore } from "../../../../../utils/hooks/use_subject_full_info";

export interface AddTimerFormValues {
    hours: number;
    minutes: number;
    seconds: number;
    subjectId: string;
}

interface AddTimerPopUpProps {
    subjectId: string;
    subjectTitle:string
    onClose: () => void;
    onSave: (data: AddTimerFormValues) => void;
}

export default function AddTimerPopUp({ subjectId, subjectTitle, onClose, onSave }: AddTimerPopUpProps) {
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<AddTimerFormValues>({
        defaultValues: {
            hours: 0,
            minutes: 0,
            seconds: 0,
            subjectId,
        },
    });
    const {getSubjectFullInfo} = useFullSubjectStore()

    const onSubmit: SubmitHandler<AddTimerFormValues> = async (data) => {
        onSave(data);
        var res = await AllAdminOperation.addTimer({ dt: data, setError: setError })
        if(res?.statusCode === 200){
            onClose()
            reset();
            await getSubjectFullInfo(subjectId, subjectTitle)
        }
    };

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
            style={{ zIndex: 1050 }}
        >
            <div className="card shadow-lg" style={{ width: "400px" }}>
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Add Timer</h5>
                    <button
                        type="button"
                        className="btn-close btn-close-white"
                        aria-label="Close"
                        onClick={() => {
                            reset();
                            onClose();
                        }}
                    ></button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="card-body">
                        {/* Hours */}
                        <div className="mb-3">
                            <label className="form-label">Hours</label>
                            <input
                                type="number"
                                min="0"
                                className={`form-control ${errors.hours ? "is-invalid" : ""}`}
                                placeholder="Enter hours"
                                {...register("hours", {
                                    required: "Hours are required",
                                    min: { value: 0, message: "Hours cannot be negative" },
                                })}
                            />
                            {errors.hours && (
                                <div className="invalid-feedback">{errors.hours.message}</div>
                            )}
                        </div>

                        {/* Minutes */}
                        <div className="mb-3">
                            <label className="form-label">Minutes</label>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                className={`form-control ${errors.minutes ? "is-invalid" : ""}`}
                                placeholder="Enter minutes"
                                {...register("minutes", {
                                    required: "Minutes are required",
                                    min: { value: 0, message: "Minutes cannot be negative" },
                                    max: { value: 59, message: "Minutes must be below 60" },
                                })}
                            />
                            {errors.minutes && (
                                <div className="invalid-feedback">{errors.minutes.message}</div>
                            )}
                        </div>

                        {/* Seconds */}
                        <div className="mb-3">
                            <label className="form-label">Seconds</label>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                className={`form-control ${errors.seconds ? "is-invalid" : ""}`}
                                placeholder="Enter seconds"
                                {...register("seconds", {
                                    required: "Seconds are required",
                                    min: { value: 0, message: "Seconds cannot be negative" },
                                    max: { value: 59, message: "Seconds must be below 60" },
                                })}
                            />
                            {errors.seconds && (
                                <div className="invalid-feedback">{errors.seconds.message}</div>
                            )}
                        </div>

                        {/* Subject ID */}
                        <div className="mb-3">
                            <label className="form-label">Subject ID</label>
                            <input
                                type="text"
                                readOnly
                                className="form-control bg-light"
                                {...register("subjectId")}
                            />
                        </div>
                    </div>

                    <div className="card-footer text-end">
                        <button
                            type="button"
                            className="btn btn-secondary me-2"
                            onClick={() => {
                                reset();
                                onClose();
                            }}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Save Timer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
