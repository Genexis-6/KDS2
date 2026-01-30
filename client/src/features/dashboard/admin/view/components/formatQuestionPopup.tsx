import { useForm, type SubmitHandler } from "react-hook-form";
import { useState, useEffect } from "react";
import { useNotificationStore } from "../../../../../utils/hooks/use_notification_store";
import { AllAdminOperation } from "../../viewModel/allAdminOperations";


interface FormatQuestionPopupProps {
  subjectId: string;
  subjectTitle: string;
  onClose: () => void;
  onSave: () => Promise<void>;
  existingFormat?: {
    number_of_qa: number;
    score_per_qa: number;
  } | null;
  questionCount?: number;
}

interface FormatFormValues {
  number_of_qa: number;
  score_per_qa: number;
  subjectId: string;
}

export default function FormatQuestionPopup({
  subjectId,
  subjectTitle,
  onClose,
  onSave,
  existingFormat,
  questionCount: initialQuestionCount = 0,
}: FormatQuestionPopupProps) {
  const { showNotification } = useNotificationStore();
  const [fetchingCount, setFetchingCount] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(initialQuestionCount);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormatFormValues>({
    defaultValues: {
      number_of_qa: existingFormat?.number_of_qa || 0,
      score_per_qa: existingFormat?.score_per_qa || 1,
      subjectId,
    },
  });

  // Watch form values to calculate total score
  const number_of_qa = watch("number_of_qa");
  const score_per_qa = watch("score_per_qa");
  const totalScore = number_of_qa * score_per_qa;

  // Fetch question count when component mounts
  useEffect(() => {
    const fetchQuestionCount = async () => {
      if (!subjectId) return;

      setFetchingCount(true);
      try {
        console.log("Fetching question count for subject:", subjectId);
        const count = await AllAdminOperation.getQuestionCount(subjectId);
        console.log("Received question count:", count);
        setTotalQuestions(count);

        // Set initial value for number_of_qa if not already set
        if (count > 0) {
          const currentQa = existingFormat?.number_of_qa || 0;
          const initialValue = currentQa > 0 ? Math.min(currentQa, count) : Math.min(count, 1);
          setValue("number_of_qa", initialValue);
        } else {
          setValue("number_of_qa", 0);
        }
      } catch (error) {
        console.error("Error fetching question count:", error);
        showNotification("Failed to fetch question count", "error");
        setTotalQuestions(0);
        setValue("number_of_qa", 0);
      } finally {
        setFetchingCount(false);
      }
    };

    fetchQuestionCount();
  }, [subjectId, existingFormat, setValue, showNotification]);

  // Update form when existingFormat changes
  useEffect(() => {
    if (existingFormat) {
      setValue("number_of_qa", existingFormat.number_of_qa);
      setValue("score_per_qa", existingFormat.score_per_qa);
    }
  }, [existingFormat, setValue]);

  const onSubmit: SubmitHandler<FormatFormValues> = async (data) => {
    try {
      // Validation
      if (data.number_of_qa === 0) {
        showNotification("Number of questions cannot be 0", "error");
        return;
      }

      if (data.score_per_qa === 0) {
        showNotification("Score per question cannot be 0", "error");
        return;
      }

      if (data.number_of_qa > totalQuestions) {
        showNotification(
          `Cannot set more questions (${data.number_of_qa}) than available (${totalQuestions})`,
          "error"
        );
        return;
      }

      const response = await AllAdminOperation.saveQuestionFormat({
        subjectId,
        number_of_qa: data.number_of_qa,
        score_per_qa: data.score_per_qa,
      });

      if (response) {
        showNotification(
          existingFormat
            ? "Question format updated successfully!"
            : "Question format saved successfully!",
          "success"
        );
        await onSave();
        reset();
        onClose();
      } else {
        showNotification("Failed to save question format", "error");
      }
    } catch (error) {
      console.error("Error saving question format:", error);
      showNotification("An error occurred while saving format", "error");
    }
  };

  // Helper function to handle increment/decrement
  const handleNumberChange = (field: "number_of_qa" | "score_per_qa", increment: boolean) => {
    const currentValue = watch(field);
    let newValue = currentValue;

    if (increment) {
      newValue += 1;
      // Apply max limits
      if (field === "number_of_qa" && newValue > totalQuestions) {
        showNotification(`Cannot exceed ${totalQuestions} questions`, "error");
        return;
      }
      if (field === "score_per_qa" && newValue > 1000) return;
    } else {
      newValue = Math.max(field === "number_of_qa" ? 0 : 1, newValue - 1);
    }

    setValue(field, newValue);
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
      style={{ zIndex: 1050 }}
    >
      <div className="card shadow-lg" style={{ width: "500px", maxWidth: "95vw" }}>
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">
              {existingFormat ? "Update Question Format" : "Set Question Format"}
            </h5>
            <small className="opacity-75">
              {subjectTitle}
              {fetchingCount ? (
                <span className="ms-2">
                  <span className="spinner-border spinner-border-sm" /> Loading...
                </span>
              ) : (
                ` • ${totalQuestions} questions available`
              )}
            </small>
          </div>
          <button
            type="button"
            className="btn-close btn-close-white"
            aria-label="Close"
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={isSubmitting || fetchingCount}
          ></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="card-body">
            {fetchingCount ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary mb-3" role="status"></div>
                <p className="text-muted">Loading question data...</p>
              </div>
            ) : totalQuestions === 0 ? (
              <div className="text-center py-4">
                <div className="mb-3">
                  <span className="display-1">📝</span>
                </div>
                <h5 className="text-muted">No Questions Available</h5>
                <p className="text-muted">
                  You need to upload questions first before setting the format.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      reset();
                      onClose();
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Number of Questions */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Number of Questions
                    <span className="text-muted small ms-2">
                      (Max: {totalQuestions})
                    </span>
                  </label>
                  <div className="d-flex align-items-center gap-3">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      style={{ width: "40px", height: "40px" }}
                      onClick={() => handleNumberChange("number_of_qa", false)}
                      disabled={isSubmitting || number_of_qa <= 0}
                    >
                      <span className="fs-5">−</span>
                    </button>

                    <div className="flex-grow-1">
                      <input
                        type="number"
                        className={`form-control form-control-lg text-center ${
                          errors.number_of_qa ? "is-invalid" : ""
                        }`}
                        {...register("number_of_qa", {
                          required: "Number of questions is required",
                          min: { value: 0, message: "Cannot be negative" },
                          max: {
                            value: totalQuestions,
                            message: `Cannot exceed ${totalQuestions} questions`,
                          },
                          validate: (value) =>
                            value > 0 || "At least 1 question is required",
                        })}
                        min="0"
                        max={totalQuestions}
                        disabled={isSubmitting}
                      />
                      {errors.number_of_qa && (
                        <div className="invalid-feedback">{errors.number_of_qa.message}</div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      style={{ width: "40px", height: "40px" }}
                      onClick={() => handleNumberChange("number_of_qa", true)}
                      disabled={isSubmitting || number_of_qa >= totalQuestions}
                    >
                      <span className="fs-5">+</span>
                    </button>
                  </div>
                  <div className="text-muted small mt-2 text-center">
                    {totalQuestions} total questions available
                  </div>
                </div>

                {/* Score per Question */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Points per Question
                    <span className="text-muted small ms-2">(Max: 1000)</span>
                  </label>
                  <div className="d-flex align-items-center gap-3">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      style={{ width: "40px", height: "40px" }}
                      onClick={() => handleNumberChange("score_per_qa", false)}
                      disabled={isSubmitting || score_per_qa <= 1}
                    >
                      <span className="fs-5">−</span>
                    </button>

                    <div className="flex-grow-1">
                      <input
                        type="number"
                        className={`form-control form-control-lg text-center ${
                          errors.score_per_qa ? "is-invalid" : ""
                        }`}
                        {...register("score_per_qa", {
                          required: "Score per question is required",
                          min: { value: 1, message: "Minimum 1 point per question" },
                          max: { value: 1000, message: "Maximum 1000 points per question" },
                        })}
                        min="1"
                        max="1000"
                        disabled={isSubmitting}
                      />
                      {errors.score_per_qa && (
                        <div className="invalid-feedback">{errors.score_per_qa.message}</div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      style={{ width: "40px", height: "40px" }}
                      onClick={() => handleNumberChange("score_per_qa", true)}
                      disabled={isSubmitting || score_per_qa >= 1000}
                    >
                      <span className="fs-5">+</span>
                    </button>
                  </div>
                  <div className="text-muted small mt-2 text-center">
                    points per question
                  </div>
                </div>

                {/* Summary Card */}
                <div className="card bg-light border-0 mb-4">
                  <div className="card-body">
                    <h6 className="card-title text-muted mb-3">Format Summary</h6>
                    <div className="row text-center">
                      <div className="col">
                        <div className="text-muted small">Questions</div>
                        <div className="fs-4 fw-bold text-primary">
                          {number_of_qa || 0}
                        </div>
                      </div>
                      <div className="col border-start border-end">
                        <div className="text-muted small">Points Each</div>
                        <div className="fs-4 fw-bold text-success">
                          {score_per_qa}
                        </div>
                      </div>
                      <div className="col">
                        <div className="text-muted small">Total Score</div>
                        <div className="fs-4 fw-bold text-dark">
                          {totalScore}
                        </div>
                      </div>
                    </div>
                  </div>
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
              </>
            )}
          </div>

          <div className="card-footer text-end">
            <button
              type="button"
              className="btn btn-secondary me-2"
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={isSubmitting || fetchingCount}
            >
              Cancel
            </button>
            {totalQuestions > 0 && (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || fetchingCount || totalQuestions === 0}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    {existingFormat ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  existingFormat ? "Update Format" : "Save Format"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}