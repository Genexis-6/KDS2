import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo, type CSSProperties } from "react";
import {
  Search,
  Trash2,
  Pencil,
  ListChecks,
  X,
  Check,
  RotateCw,
  Timer,
  SlidersHorizontal,
  FilePlus,
  FileSpreadsheet,
  FileX,
  type LucideIcon,
} from "lucide-react";
import { useNotificationStore } from "../../../../../utils/hooks/use_notification_store";
import { useFullSubjectStore, type StudentSubInfo } from "../../../../../utils/hooks/use_subject_full_info";
import AddTimerPopUp from "../components/AddTimerPopUp";
import UploadStudentQuestion from "../components/UploadStudentQuestion";
import { usePopupStore } from "../../../../../utils/hooks/use_pop_up_menu";
import { AllAdminOperation } from "../../viewModel/allAdminOperations";
import { useGenerateRecordStore } from "../../../../../utils/hooks/use_generate_records";
import Spinner from "../../../../../common/component/Spinner";
import FormatQuestionPopup from "../components/formatQuestionPopup";

type AdminQuestion = { id: string; question: string; a: string; b: string; c: string; d: string; answer: string };

type ActionButtonProps = {
  icon: LucideIcon;
  label: string;
  tooltip: string;
  variant: "primary" | "success" | "secondary" | "danger";
  onClick: () => void;
};

const ACCENTS: Record<ActionButtonProps["variant"], string> = {
  primary: "var(--bs-primary, #0d6efd)",
  success: "var(--bs-success, #198754)",
  secondary: "var(--bs-secondary, #6c757d)",
  danger: "var(--bs-danger, #dc3545)",
};

// Border stays invisible until hover, then takes the button's accent colour
const ACTION_BUTTON_CSS = `
.action-btn {
  width: 100%;
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 8px;
  background: #fff;
  color: #495057;
  border: 2px solid transparent;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
  cursor: pointer;
}
.action-btn:hover {
  border-color: var(--accent);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}
.action-btn:active {
  transform: scale(0.97);
}
.action-btn:focus-visible {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.25);
}
.action-btn .action-btn-icon {
  color: var(--accent);
}
.action-btn .action-btn-label {
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
}
`;

// Square button: large bold icon centered, title underneath, tooltip on hover
function ActionButton({ icon: Icon, label, tooltip, variant, onClick }: ActionButtonProps) {
  return (
    <button
      type="button"
      className="action-btn"
      style={{ "--accent": ACCENTS[variant] } as CSSProperties}
      title={tooltip}
      aria-label={label}
      onClick={onClick}
    >
      <Icon className="action-btn-icon" size={34} strokeWidth={2.5} />
      <span className="action-btn-label">{label}</span>
    </button>
  );
}

export default function ViewParticularSubject() {
  const { subjectId, subjectTitle } = useParams<{
    subjectId: string;
    subjectTitle: string;
  }>();

  const { showNotification } = useNotificationStore();
  const { subjectData, getSubjectFullInfo, isLoading } = useFullSubjectStore();
  const { openPopup, closePopup } = usePopupStore.getState();
  const { sendStudentRecord, generateState } = useGenerateRecordStore();

  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const [showAddQuestionPopup, setShowAddQuestionPopup] = useState(false);
  const [showFormatPopup, setShowFormatPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [questionFormat, setQuestionFormat] = useState<{
    number_of_qa: number;
    score_per_qa: number;
  } | null>(null);
  const [deletingScore, setDeletingScore] = useState<string | null>(null); // Changed back to string for UUID

  const [showQuestionsPanel, setShowQuestionsPanel] = useState(false);
  const [adminQuestions, setAdminQuestions] = useState<AdminQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionDraft, setQuestionDraft] = useState<AdminQuestion | null>(null);

  const loadAdminQuestions = async () => {
    if (!subjectId) return;
    setLoadingQuestions(true);
    try {
      const list = await AllAdminOperation.getAdminQuestions(subjectId);
      setAdminQuestions(list);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const toggleQuestionsPanel = async () => {
    const next = !showQuestionsPanel;
    setShowQuestionsPanel(next);
    if (next) await loadAdminQuestions();
  };

  // Fetch question format when subject data loads
  useEffect(() => {
    if (subjectId && subjectData?.question) {
      fetchQuestionFormat();
    }
  }, [subjectId, subjectData?.question]);

  const fetchQuestionFormat = async () => {
    if (!subjectId) return;
    try {
      const format = await AllAdminOperation.getQuestionFormat(subjectId);
      setQuestionFormat(format);
    } catch (error) {
      console.error("Error fetching question format:", error);
      setQuestionFormat(null);
    }
  };

  useEffect(() => {
    if (subjectId && subjectTitle) {
      getSubjectFullInfo(subjectId, subjectTitle).catch(() => {
        showNotification("Failed to load subject info", "error");
      });
    }
  }, [subjectId, subjectTitle]);

  const filteredStudents = useMemo(() => {
    if (!subjectData?.students) return [];
    return subjectData.students.filter(
      (s: StudentSubInfo) =>
        s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.identifier.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subjectData, searchTerm]);

  // Function to handle score deletion
  const handleDeleteScore = async (studentId: string, studentName: string) => {
    if (!subjectId || !studentId) return;

    setDeletingScore(studentId);

    try {
      const success = await AllAdminOperation.deleteStudentScore(
        studentId, // Use the UUID string
        subjectId
      );

      if (success) {
        showNotification(`Score deleted for ${studentName}`, "success");
        // Refresh the subject data
        await getSubjectFullInfo(subjectId, subjectTitle!);
      } else {
        showNotification(`Failed to delete score for ${studentName}`, "error");
      }
    } catch (error) {
      console.error("Error deleting score:", error);
      showNotification(`Error deleting score: ${error}`, "error");
    } finally {
      setDeletingScore(null);
    }
  };

  // Function to confirm score deletion
  const confirmDeleteScore = (student: StudentSubInfo) => {
    if (!student.id) {
      showNotification(`Student ID not found for ${student.studentName}`, "error");
      return;
    }

    openPopup({
      title: "Allow Retake",
      message: `Clear ${student.studentName}'s score for this subject so they can retake the exam? This cannot be undone.`,
      onContinue: async () => {
        await handleDeleteScore(student.id!, student.studentName);
      },
      onCancel: () => closePopup(),
    });
  };

  if (isLoading || !subjectData) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3 text-muted">Loading subject details...</p>
      </div>
    );
  }

  const { timer, question, students } = subjectData;

  return (
    <>
      <style>{ACTION_BUTTON_CSS}</style>
      <div className="admin-container mt-5">
        <div className="container">
          <div className="card border-0 shadow-sm">
            {!generateState ? (
              <div className="card-body">
                {/* Header Section */}
                <div className="mb-3">
                  <h3 className="mb-1 text-primary">{subjectTitle}</h3>
                  <p className="text-muted mb-0">
                    Students: <strong>{students?.length || 0}</strong> • Timer:{" "}
                    {timer ? (
                      <span className="badge bg-info text-dark">
                        {timer.hr.toString().padStart(2, "0")}h{" "}
                        {timer.mins.toString().padStart(2, "0")}m{" "}
                        {timer.sec.toString().padStart(2, "0")}s
                      </span>
                    ) : (
                      <span className="badge bg-secondary">Not set</span>
                    )}
                    • Questions:{" "}
                    <strong>{question ? `Added` : "Not added"}</strong>
                    {questionFormat && (
                      <>
                        {" "}
                        • Format:{" "}
                        <span className="badge bg-success">
                          {questionFormat.number_of_qa}Q × {questionFormat.score_per_qa}pts
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {/* Action buttons: one straight row, icon on top, title underneath */}
                <div
                  className="mb-4"
                  style={{
                    display: "grid",
                    gridAutoFlow: "column",
                    gridAutoColumns: "104px",
                    gap: "16px",
                    overflowX: "auto",
                    padding: "6px 6px 12px",
                  }}
                >
                  <ActionButton
                    icon={Timer}
                    label={!timer ? "Add Timer" : "Update Timer"}
                    tooltip={timer ? "Change the exam duration for this subject" : "Set how long students have to finish this exam"}
                    variant="primary"
                    onClick={() => setShowTimerPopup(true)}
                  />

                  {question && (
                    <ActionButton
                      icon={SlidersHorizontal}
                      label={questionFormat ? "Update Format" : "Set Format"}
                      tooltip="Set the number of questions and points per question"
                      variant="success"
                      onClick={() => setShowFormatPopup(true)}
                    />
                  )}

                  {question && (
                    <ActionButton
                      icon={ListChecks}
                      label={showQuestionsPanel ? "Hide Questions" : "Manage Questions"}
                      tooltip="View, edit or delete individual questions"
                      variant="secondary"
                      onClick={toggleQuestionsPanel}
                    />
                  )}

                  {!question && (
                    <ActionButton
                      icon={FilePlus}
                      label="Add Questions"
                      tooltip="Upload questions for this subject"
                      variant="primary"
                      onClick={() => setShowAddQuestionPopup(true)}
                    />
                  )}

                  {students.length !== 0 && (
                    <ActionButton
                      icon={FileSpreadsheet}
                      label="Excel Record"
                      tooltip="Download students' scores as an Excel file"
                      variant="success"
                      onClick={() => {
                        openPopup({
                          title: "Generate excel record",
                          message: "Do you wish to carry out with this operation!!!",
                          onContinue: async () => {
                            await sendStudentRecord(students, subjectTitle!);
                          },
                          onCancel: () => closePopup(),
                        });
                      }}
                    />
                  )}

                  {question && (
                    <ActionButton
                      icon={FileX}
                      label="Drop Question"
                      tooltip="Delete all uploaded questions for this subject"
                      variant="danger"
                      onClick={() => {
                        openPopup({
                          title: "Delete uploaded question",
                          message: "Do you want to delete the current current question!!",
                          onContinue: async () => {
                            var res = await AllAdminOperation.deleteQuestions({
                              subjectId: subjectId!,
                            });
                            if (res) {
                              if (students.length !== 0)
                                await sendStudentRecord(students, subjectTitle!);
                              await getSubjectFullInfo(subjectId!, subjectTitle!);
                            }
                          },
                          onCancel: () => closePopup(),
                        });
                      }}
                    />
                  )}
                </div>

                {/* Question management panel */}
                {showQuestionsPanel && (
                  <div className="mb-4 p-3" style={{ border: "1px solid var(--cbx-line)", borderRadius: "var(--radius-md)", backgroundColor: "var(--cbx-white)" }}>
                    <h5 className="mb-3">Questions ({adminQuestions.length})</h5>

                    {loadingQuestions ? (
                      <Spinner message="loading questions" />
                    ) : adminQuestions.length === 0 ? (
                      <p className="text-muted mb-0">No questions found for this subject.</p>
                    ) : (
                      <div style={{ maxHeight: "480px", overflowY: "auto" }}>
                        {adminQuestions.map((q, idx) => {
                          const isEditing = editingQuestionId === q.id;
                          const draft = isEditing ? questionDraft! : q;
                          return (
                            <div key={q.id} className="p-2 mb-2" style={{ borderBottom: "1px solid var(--cbx-line)" }}>
                              <div className="d-flex justify-content-between align-items-start gap-2">
                                <div style={{ flexGrow: 1 }}>
                                  <small className="text-muted">Q{idx + 1}</small>
                                  {isEditing ? (
                                    <textarea
                                      className="form-control form-control-sm mb-2"
                                      value={draft.question}
                                      onChange={(e) => setQuestionDraft({ ...draft, question: e.target.value })}
                                    />
                                  ) : (
                                    <p className="mb-2 fw-semibold">{q.question}</p>
                                  )}

                                  <div className="row g-2">
                                    {(["a", "b", "c", "d"] as const).map((opt) => (
                                      <div className="col-6" key={opt}>
                                        {isEditing ? (
                                          <input
                                            className="form-control form-control-sm"
                                            value={draft[opt]}
                                            placeholder={`Option ${opt.toUpperCase()}`}
                                            onChange={(e) => setQuestionDraft({ ...draft, [opt]: e.target.value })}
                                          />
                                        ) : (
                                          <small className={q.answer.trim().toLowerCase() === q[opt].trim().toLowerCase() ? "fw-bold" : ""} style={q.answer.trim().toLowerCase() === q[opt].trim().toLowerCase() ? { color: "var(--cbx-mint-700)" } : {}}>
                                            {opt.toUpperCase()}. {q[opt]}
                                          </small>
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  {isEditing && (
                                    <div className="mt-2">
                                      <label className="form-label mb-1">Correct answer</label>
                                      <input
                                        className="form-control form-control-sm"
                                        style={{ maxWidth: "220px" }}
                                        value={draft.answer}
                                        onChange={(e) => setQuestionDraft({ ...draft, answer: e.target.value })}
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="d-flex flex-column gap-1">
                                  {isEditing ? (
                                    <>
                                      <button
                                        className="btn btn-sm btn-primary"
                                        onClick={async () => {
                                          if (!questionDraft) return;
                                          const ok = await AllAdminOperation.editQuestion(questionDraft);
                                          if (ok) {
                                            setAdminQuestions((prev) => prev.map((item) => (item.id === q.id ? questionDraft : item)));
                                          }
                                          setEditingQuestionId(null);
                                          setQuestionDraft(null);
                                        }}
                                      >
                                        <Check size={14} />
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => {
                                          setEditingQuestionId(null);
                                          setQuestionDraft(null);
                                        }}
                                      >
                                        <X size={14} />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        className="btn btn-sm btn-outline-primary"
                                        title="Edit question"
                                        onClick={() => {
                                          setEditingQuestionId(q.id);
                                          setQuestionDraft(q);
                                        }}
                                      >
                                        <Pencil size={14} />
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline-danger"
                                        title="Delete question"
                                        onClick={() =>
                                          openPopup({
                                            title: "Delete Question",
                                            message: "Remove this question permanently? This cannot be undone.",
                                            onContinue: async () => {
                                              const ok = await AllAdminOperation.deleteSingleQuestion({ questionId: q.id });
                                              if (ok) setAdminQuestions((prev) => prev.filter((item) => item.id !== q.id));
                                            },
                                            onCancel: () => closePopup(),
                                          })
                                        }
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Search */}
                <div className="mb-3 position-relative d-flex align-items-center">
                  <div className="position-relative" style={{ flexGrow: 1 }}>
                    <input
                      type="text"
                      className="form-control form-control-sm ps-4"
                      placeholder="Search student by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ maxWidth: "300px" }}
                    />
                    <Search
                      size={16}
                      className="text-secondary position-absolute"
                      style={{
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    />
                  </div>
                </div>

                {/* Student Table */}
                <div
                  className="table-responsive"
                  style={{
                    maxHeight: "400px",
                    overflowY: "auto",
                    scrollbarColor: "rgba(108,117,125,0.6) transparent",
                  }}
                >
                  <table className="table table-hover align-middle">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>#</th>
                        <th>Student Name</th>
                        <th>Identifier</th>
                        <th>Subject</th>
                        <th>Score</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student: StudentSubInfo, index: number) => (
                          <tr key={`${student.id || student.identifier}-${index}`}>
                            <td>{index + 1}</td>
                            <td>{student.studentName}</td>
                            <td>
                              <span className="badge bg-secondary">
                                {student.identifier}
                              </span>
                            </td>
                            <td>{subjectTitle}</td>
                            <td>
                              {student.score !== undefined && student.total !== undefined
                                ? `${student.score}/${student.total}`
                                : "--"}
                            </td>
                            <td>
                              {student.score !== undefined && student.id && (
                                <button
                                  className="btn btn-sm btn-outline-warning"
                                  onClick={() => confirmDeleteScore(student)}
                                  disabled={deletingScore === student.id}
                                  title="Allow this student to retake the exam"
                                  style={{
                                    minWidth: "90px",
                                    opacity: deletingScore === student.id ? 0.6 : 1,
                                  }}
                                >
                                  {deletingScore === student.id ? (
                                    <>
                                      <span
                                        className="spinner-border spinner-border-sm me-1"
                                        role="status"
                                        aria-hidden="true"
                                      ></span>
                                      Clearing...
                                    </>
                                  ) : (
                                    <>
                                      <RotateCw size={14} className="me-1" />
                                      Retake Exam
                                    </>
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-4">
                            No matching students found 😕
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <Spinner message="generating excel file" />
            )}
          </div>
        </div>
      </div>

      {/* Popups */}
      {showTimerPopup && (
        <AddTimerPopUp
          subjectTitle={subjectTitle!}
          subjectId={subjectId!}
          onClose={() => setShowTimerPopup(false)}
          onSave={() => {
            setShowTimerPopup(false);
            getSubjectFullInfo(subjectId!, subjectTitle!);
          }}
        />
      )}

      {showAddQuestionPopup && (
        <UploadStudentQuestion
          subject_id={subjectId!}
          onSave={() =>
            getSubjectFullInfo(subjectId!, subjectTitle!).catch(() =>
              showNotification("Failed to load subject info", "error")
            )
          }
          onClose={() => setShowAddQuestionPopup(false)}
          onUploadExcel={() =>
            getSubjectFullInfo(subjectId!, subjectTitle!).catch(() =>
              showNotification("Failed to load subject info", "error")
            )
          }
        />
      )}

      {/* Format Question Popup */}
      {showFormatPopup && (
        <FormatQuestionPopup
          subjectId={subjectId!}
          subjectTitle={subjectTitle!}
          existingFormat={questionFormat}
          onClose={() => setShowFormatPopup(false)}
          onSave={async () => {
            await fetchQuestionFormat();
            await getSubjectFullInfo(subjectId!, subjectTitle!);
          }}
        />
      )}
    </>
  );
}