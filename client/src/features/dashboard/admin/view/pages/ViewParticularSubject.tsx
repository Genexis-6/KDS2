import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Search, Trash2 } from "lucide-react";
import { useNotificationStore } from "../../../../../utils/hooks/use_notification_store";
import { useFullSubjectStore, type StudentSubInfo } from "../../../../../utils/hooks/use_subject_full_info";
import AddTimerPopUp from "../components/AddTimerPopUp";
import UploadStudentQuestion from "../components/UploadStudentQuestion";
import { usePopupStore } from "../../../../../utils/hooks/use_pop_up_menu";
import { AllAdminOperation } from "../../viewModel/allAdminOperations";
import { useGenerateRecordStore } from "../../../../../utils/hooks/use_generate_records";
import Spinner from "../../../../../common/component/Spinner";
import FormatQuestionPopup from "../components/formatQuestionPopup";

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
      title: "Delete Student Score",
      message: `Are you sure you want to delete the score for ${student.studentName}?`,
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
      <div className="admin-container mt-5">
        <div className="container">
          <div className="card border-0 shadow-sm">
            {!generateState ? (
              <div className="card-body">
                {/* Header Section */}
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div>
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

                  {/* Buttons Section */}
                  <div className="d-flex flex-column align-items-end">
                    <button
                      className="btn btn-outline-primary btn-sm mb-2"
                      onClick={() => setShowTimerPopup(true)}
                    >
                      ⏱{!timer ? " Add Timer" : " Update Timer"}
                    </button>
                    {question && (
                      <button
                        className="btn btn-outline-success btn-sm mb-2"
                        onClick={() => setShowFormatPopup(true)}
                      >
                        {questionFormat ? "📝 Update Format" : "📝 Set Format"}
                      </button>
                    )}

                    {!question && (
                      <button
                        className="btn btn-primary btn-sm mb-2"
                        onClick={() => setShowAddQuestionPopup(true)}
                      >
                        ➕ Add Questions
                      </button>
                    )}
                    {students.length !== 0 && (
                      <button
                        className="btn btn-outline-success btn-sm mb-2"
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
                      >
                        📄 Generate Excel Record
                      </button>
                    )}

                    {question && (
                      <button
                        className="btn btn-outline-danger btn-sm"
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
                      >
                        ❌ Drop Question
                      </button>
                    )}
                  </div>
                </div>

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
                                : "—"}
                            </td>
                            <td>
                              {student.score !== undefined && student.id && (
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => confirmDeleteScore(student)}
                                  disabled={deletingScore === student.id}
                                  title="Delete score for this student"
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
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 size={14} className="me-1" />
                                      Drop Score
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