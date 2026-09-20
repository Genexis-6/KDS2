import React, { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Eye, EyeClosed, GraduationCap, ShieldCheck } from "lucide-react";
import { HandleFormSubmission } from "../component/handle_form_submission";
import { useIsAuthenticatedStore } from "../../../../utils/hooks/use_is_authenticated_store";
import { useNavigationStore } from "../../../../utils/hooks/use_navigation_store";
import { useCurrentUserStore } from "../../../../utils/hooks/use_current_user";
import { AppUrl } from "../../../../common/routes/app_urls";
import Brand from "../../../../common/component/Brand";
import "../styles/auth_style.css";

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
        // `role` (component state) is the source of truth for which radio is
        // selected — the radios below also spread {...register("role")}, and
        // mixing that uncontrolled registration with our own controlled
        // `checked`/`onChange` means RHF can end up submitting whatever it
        // initialized to instead of what was actually clicked. Overriding
        // `data.role` here guarantees the real selection is sent.
        await HandleFormSubmission.login({ data: { ...data, role }, setError });
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
        <div className="login-page">
            <header className="login-top">
                <Brand size="lg" />
            </header>

            <main className="login-main">
                {/* Intro (large screens only) */}
                <section className="login-intro d-none d-lg-block">
                    <h1>Sit your exam. One clean run, start to finish.</h1>
                    <p>
                        A single session per student, a timer that always saves your work, and results your
                        teachers can trust -- no browser tricks, no lost answers.
                    </p>
                    <div className="login-note">
                        <ShieldCheck size={18} />
                        <small>Every submission is recorded the moment you make it.</small>
                    </div>
                </section>

                {/* Sign-in */}
                <div className="login-stage">
                    <div className="login-rings" aria-hidden="true">
                        <span /><span /><span /><span /><span />
                    </div>

                    <div className="login-card glass-panel">
                        <div className="mb-4">
                            <h2>Welcome back</h2>
                            <p className="text-muted mb-0">Sign in to continue as {role}.</p>
                        </div>

                        {/* Role */}
                        <div className="segmented" role="radiogroup" aria-label="Sign in as">
                            <label htmlFor="student" className={`segmented-item ${role === "student" ? "active" : ""}`}>
                                <input
                                    type="radio"
                                    id="student"
                                    name="role"
                                    value="student"
                                    checked={role === "student"}
                                    onChange={() => setRole("student")}
                                    className="visually-hidden"
                                />
                                <GraduationCap size={16} />
                                Student
                            </label>

                            <label htmlFor="admin" className={`segmented-item ${role === "admin" ? "active" : ""}`}>
                                <input
                                    type="radio"
                                    id="admin"
                                    name="role"
                                    value="admin"
                                    checked={role === "admin"}
                                    onChange={() => setRole("admin")}
                                    className="visually-hidden"
                                />
                                <ShieldCheck size={16} />
                                Admin
                            </label>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            {/* Identifier */}
                            <div className="mb-3">
                                <label htmlFor="identifier" className="form-label">Username / ID</label>
                                <input
                                    id="identifier"
                                    type="text"
                                    autoComplete="username"
                                    placeholder="Enter your identifier"
                                    {...register("identifier", { required: "Identifier is required" })}
                                    className="form-control"
                                />
                                <small className={`error-text ${errors.identifier ? "show" : ""}`}>
                                    {errors.identifier?.message}
                                </small>
                            </div>

                            {/* Password */}
                            <div className="mb-3">
                                <label htmlFor="password" className="form-label">Password</label>
                                <div className="login-password">
                                    <input
                                        id="password"
                                        type={isVisible ? "text" : "password"}
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        {...register("password", { required: "Password is required" })}
                                        className="form-control"
                                    />
                                    <button
                                        type="button"
                                        className="toggle-visibility"
                                        aria-label={isVisible ? "Hide password" : "Show password"}
                                        onClick={() => setIsVisible(prev => !prev)}
                                    >
                                        {isVisible ? <Eye size={18} /> : <EyeClosed size={18} />}
                                    </button>
                                </div>
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
                                {isSubmitting ? "Signing in..." : "Sign in"}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Login;
