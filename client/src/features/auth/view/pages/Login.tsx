import React, { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Eye, EyeClosed, User, UserCheck } from "lucide-react";
import { HandleFormSubmission } from "../component/handle_form_submission";
import { useIsAuthenticatedStore } from "../../../../utils/hooks/use_is_authenticated_store";
import { useNavigationStore } from "../../../../utils/hooks/use_navigation_store";
import { useCurrentUserStore } from "../../../../utils/hooks/use_current_user";
import { AppUrl } from "../../../../common/routes/app_urls";

export type userRole = "student" | "admin";
export type FormValues = {
    identifier: string;
    password: string;
    role: userRole;
};

const Login: React.FC = () => {
    const { register, handleSubmit, setError, formState: { isSubmitting, errors } } = useForm<FormValues>();
    const [isVisible, setIsVisible] = useState(false);
    const { isAuthenticated } = useIsAuthenticatedStore()
    const { navigate } = useNavigationStore()
    const { user } = useCurrentUserStore()
    const [role, setRole] = useState<userRole>("student");

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        await HandleFormSubmission.login({ data, setError });
    };

    useEffect(
        () => {
            if (isAuthenticated) {
                if (user?.role === "admin") {
                    navigate(AppUrl.adminPath)
                } else {
                    navigate(AppUrl.examSelectionUrl)
                }
            }
        }, []
    )

    return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light position-relative">
            {/* Role selection */}
            <div className="position-absolute top-0 end-0 m-3 d-flex gap-3">
                <div className="d-flex align-items-center">
                    <input
                        {...register("role")}
                        type="radio"
                        id="student"
                        value="student"
                        checked={role === "student"}
                        onChange={() => setRole("student")}
                        className="me-1"
                    />
                    <label htmlFor="student" className="d-flex align-items-center cursor-pointer">
                        <User size={20} />
                    </label>
                </div>

                <div className="d-flex align-items-center">
                    <input
                        {...register("role")}
                        type="radio"
                        id="admin"
                        value="admin"
                        checked={role === "admin"}
                        onChange={() => setRole("admin")}
                        className="me-1"
                    />
                    <label htmlFor="admin" className="d-flex align-items-center cursor-pointer">
                        <UserCheck size={20} />
                    </label>
                </div>
            </div>

            {/* Card */}
            <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
                <div className="text-center mb-4">
                    <h2 className="text-primary">Welcome Back</h2>
                    <p className="text-muted">Login to your account</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Identifier */}
                    <div className="mb-3">
                        <label htmlFor="identifier" className="form-label">Username</label>
                        <input
                            type="text"
                            placeholder="Enter your identifier"
                            {...register("identifier", { required: "Identifier is required" })}
                            className="form-control"
                        />
                        <small className={`error-text ${errors.identifier ? "show" : ""}`}>
                            {errors.identifier?.message}
                        </small>
                    </div>

                    {/* Password */}
                    <div className="mb-3 position-relative">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type={isVisible ? "text" : "password"}
                            placeholder="Enter your password"
                            {...register("password", { required: "Password is required" })}
                            className="form-control"
                        />
                        <span
                            className="position-absolute"
                            style={{ top: "38px", right: "10px", cursor: "pointer" }}
                            onClick={() => setIsVisible(prev => !prev)}
                        >
                            {isVisible ? <Eye size={20} /> : <EyeClosed size={20} />}
                        </span>
                        <small className={`error-text ${errors.password ? "show" : ""}`}>
                            {errors.password?.message}
                        </small>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="btn btn-primary w-100 py-2 mt-3"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
