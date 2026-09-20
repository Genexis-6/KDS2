import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Search, Trash2, Pencil, LogOut, Circle, BookOpen, BookPlus, UserPlus } from "lucide-react";
import { useViewClassInfoStore } from "../../../../../utils/hooks/use_view_class_info";
import { AppUrl } from "../../../../../common/routes/app_urls";
import { useNavigationStore } from "../../../../../utils/hooks/use_navigation_store";
import { useNotificationStore } from "../../../../../utils/hooks/use_notification_store";
import { usePopupStore } from "../../../../../utils/hooks/use_pop_up_menu";
import { AllAdminOperation } from "../../viewModel/allAdminOperations";
import AddNewStudentToClass from "../components/AddNewStudentToClass";
import ChangePasswordForm from "../components/ChangePasswordForm";
import { usePaginatedStudentsStore, type PaginatedStudent } from "../../../../../utils/hooks/use_paginated_students";
import ActionButton, { ActionButtonRow } from "../components/ActionButton";

// Debounce a value so we don't fire a request on every keystroke.
function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function ViewParticularClass() {
  const { className } = useParams<{ className: string }>();
  const { getClassInfo, viewClassData } = useViewClassInfoStore();
  const { showNotification } = useNotificationStore();
  const { openPopup, closePopup } = usePopupStore();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 400);
  const { navigate } = useNavigationStore();
  const [showAddStudentPopup, setshowAddStudentPopup] = useState(false);

  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<PaginatedStudent | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editNameDraft, setEditNameDraft] = useState("");
  const [editIdDraft, setEditIdDraft] = useState("");

  const {
    students,
    total,
    page,
    pageSize,
    totalPages,
    isLoading: studentsLoading,
    fetchStudents,
  } = usePaginatedStudentsStore();

  useEffect(() => {
    if (className) {
      getClassInfo(className);
    }
  }, [className]);

  // Re-fetch the paginated student list whenever the class is known, or the
  // (debounced) search term changes -- search happens server-side so it
  // still works correctly beyond the current page.
  useEffect(() => {
    if (viewClassData?.classId) {
      fetchStudents({ classId: viewClassData.classId, page: 1, search: debouncedSearch });
    }
  }, [viewClassData?.classId, debouncedSearch]);

  const refreshCurrentPage = async () => {
    if (viewClassData?.classId) {
      await fetchStudents({ classId: viewClassData.classId, page, search: debouncedSearch });
    }
  };

  if (!viewClassData) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3 text-muted">Loading class details...</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-container mt-5">
        <div className="container">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              {/* Header */}
              <div className="mb-3">
                <h3 className="mb-1 text-primary">
                  {viewClassData.className}
                </h3>
                <p className="text-muted mb-0">
                  Teacher: <strong>{viewClassData.teacherName}</strong> •{" "}
                  <strong>{viewClassData.subjects?.length || 0}</strong> subjects •{" "}
                  <strong>{viewClassData.studentCount ?? 0}</strong> students
                </p>
              </div>

              {/* Action buttons: one straight row, icon on top, title underneath */}
              <ActionButtonRow>
                <ActionButton
                  icon={BookOpen}
                  label="View Subjects"
                  tooltip="See every subject in this class"
                  variant="primary"
                  onClick={() => {
                    if (viewClassData.subjects.length === 0) {
                      showNotification("No subject for this class yet", "info");
                    } else {
                      navigate(
                        `/admin/${AppUrl.build(AppUrl.viewParticularClassSubject, {
                          className: className!,
                        })}`
                      );
                    }
                  }}
                />

                <ActionButton
                  icon={BookPlus}
                  label="Add Subject"
                  tooltip="Create a new subject for this class"
                  variant="primary"
                  onClick={() => {
                    navigate(
                      `/admin/${AppUrl.build(AppUrl.addNewSubject, {
                        classId: viewClassData.classId!,
                      })}`
                    );
                  }}
                />

                <ActionButton
                  icon={UserPlus}
                  label="Register Student"
                  tooltip="Add a new student to this class"
                  variant="success"
                  onClick={() => setshowAddStudentPopup(true)}
                />
              </ActionButtonRow>

              {/* Search */}
              <div className="mb-3 position-relative">
                <input
                  type="text"
                  className="form-control form-control-sm ps-4"
                  placeholder="Search by name or ID..."
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


              {/* Table */}
              <div
                className="table-responsive"
                style={{
                  maxHeight: "460px",
                  overflowY: "auto",
                  scrollbarColor: "rgba(108,117,125,0.6) transparent",
                }}
              >
                <table className="table table-hover align-middle">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th style={{ width: "5%" }}>#</th>
                      <th style={{ width: "24%" }}>Student Name</th>
                      <th style={{ width: "16%" }}>Identifier</th>
                      <th style={{ width: "15%" }}>Session</th>
                      <th style={{ width: "25%" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsLoading ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                          Loading students...
                        </td>
                      </tr>
                    ) : students.length > 0 ? (
                      students.map((student, index) => (
                        <tr key={student.id}>
                          <td>{(page - 1) * pageSize + index + 1}</td>
                          <td>
                            {editingStudentId === student.id ? (
                              <input
                                className="form-control form-control-sm"
                                value={editNameDraft}
                                onChange={(e) => setEditNameDraft(e.target.value)}
                              />
                            ) : (
                              student.fullName
                            )}
                          </td>
                          <td>
                            {editingStudentId === student.id ? (
                              <input
                                className="form-control form-control-sm"
                                value={editIdDraft}
                                onChange={(e) => setEditIdDraft(e.target.value)}
                              />
                            ) : (
                              <span className="badge bg-secondary">
                                {student.identifier}
                              </span>
                            )}
                          </td>
                          <td>
                            {student.hasActiveSession ? (
                              <span className="badge bg-success d-inline-flex align-items-center gap-1">
                                <Circle size={8} fill="currentColor" /> Online
                              </span>
                            ) : (
                              <span className="badge bg-secondary" style={{ opacity: 0.6 }}>
                                Offline
                              </span>
                            )}
                          </td>
                          <td className="d-flex gap-1 flex-wrap">
                            {editingStudentId === student.id ? (
                              <>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={async () => {
                                    const ok = await AllAdminOperation.updateStudent({
                                      id: student.id,
                                      fullName: editNameDraft,
                                      identifier: editIdDraft,
                                    });
                                    if (ok) await refreshCurrentPage();
                                    setEditingStudentId(null);
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => setEditingStudentId(null)}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => {
                                    setSelectedStudent(student);
                                    setShowPasswordPopup(true);
                                  }}
                                >
                                  Password
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  title="Edit student"
                                  onClick={() => {
                                    setEditingStudentId(student.id);
                                    setEditNameDraft(student.fullName);
                                    setEditIdDraft(student.identifier);
                                  }}
                                >
                                  <Pencil size={14} />
                                </button>
                                {student.hasActiveSession && (
                                  <button
                                    className="btn btn-sm btn-outline-warning"
                                    title="Log this student out"
                                    onClick={() =>
                                      openPopup({
                                        title: "Log Student Out",
                                        message: `End ${student.fullName}'s current session? They'll be able to log in again right away.`,
                                        onContinue: async () => {
                                          const ok = await AllAdminOperation.clearStudentSession({ studentId: student.id });
                                          if (ok) await refreshCurrentPage();
                                        },
                                        onCancel: () => closePopup(),
                                      })
                                    }
                                  >
                                    <LogOut size={14} />
                                  </button>
                                )}
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  title="Delete student"
                                  onClick={() =>
                                    openPopup({
                                      title: "Confirm Action",
                                      message: `Remove ${student.fullName} from this class? This cannot be undone.`,
                                      onContinue: async () => {
                                        const ok = await AllAdminOperation.deleteStudent({ studentId: student.id });
                                        if (ok) await refreshCurrentPage();
                                      },
                                      onCancel: () => closePopup(),
                                    })
                                  }
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          No matching students found 😕
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <small className="text-muted">
                    Page {page} of {totalPages} • {total} students
                  </small>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      disabled={page <= 1 || studentsLoading}
                      onClick={() => viewClassData.classId && fetchStudents({ classId: viewClassData.classId, page: page - 1, search: debouncedSearch })}
                    >
                      Previous
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      disabled={page >= totalPages || studentsLoading}
                      onClick={() => viewClassData.classId && fetchStudents({ classId: viewClassData.classId, page: page + 1, search: debouncedSearch })}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
      {showPasswordPopup && selectedStudent && (
        <ChangePasswordForm
          student={selectedStudent}
          onClose={() => setShowPasswordPopup(false)}
          onSave={()=>{}}
        />
      )}


      {showAddStudentPopup && (
        <AddNewStudentToClass
          className={viewClassData.className}
          classId={viewClassData.classId!}
          onClose={() => {
            setshowAddStudentPopup(false);
            refreshCurrentPage();
          }}
          onSave={() => {

            // call your API to add student
          }}
          onUploadExcel={() => {

          }}
        />
      )}

    </>
  );
}