import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { useViewClassInfoStore } from "../../../../../utils/hooks/use_view_class_info";
import { AppUrl } from "../../../../../common/routes/app_urls";
import { useNavigationStore } from "../../../../../utils/hooks/use_navigation_store";
import { useNotificationStore } from "../../../../../utils/hooks/use_notification_store";
import AddNewStudentToClass from "../components/AddNewStudentToClass";
import type { StudentModels } from "../../../../../common/model/studentModels/student_model";
import ChangePasswordForm from "../components/ChangePasswordForm";

export default function ViewParticularClass() {
  const { className } = useParams<{ className: string }>();
  const { getClassInfo, viewClassData } = useViewClassInfoStore();
  const { showNotification } = useNotificationStore();
  const [searchTerm, setSearchTerm] = useState("");
  const { navigate } = useNavigationStore();
  const [showAddStudentPopup, setshowAddStudentPopup] = useState(false);

  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentModels | null>(null);


  useEffect(() => {
    if (className) {
      getClassInfo(className);
    }
  }, [className]);

  // Derived data (computed)
  const filteredStudents = useMemo(() => {
    if (!viewClassData?.students) return [];
    return viewClassData.students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.identifier.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [viewClassData, searchTerm]);

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
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h3 className="mb-1 text-primary">
                    {viewClassData.className}
                  </h3>
                  <p className="text-muted mb-0">
                    Teacher: <strong>{viewClassData.teacherName}</strong> •{" "}
                    <strong>{viewClassData.subjects?.length || 0}</strong> subjects •{" "}
                    <strong>{viewClassData.students?.length || 0}</strong> students
                  </p>
                </div>

                {/* Buttons */}
                <div className="d-flex flex-column align-items-end">
                  <button
                    className="btn btn-outline-primary btn-sm mb-2"
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
                  >
                    View All Subjects
                  </button>

                  <button
                    className="btn btn-primary btn-sm mb-2"
                    onClick={() => {
                      navigate(
                        `/admin/${AppUrl.build(AppUrl.addNewSubject, {
                          classId: viewClassData.classId!,
                        })}`
                      );
                    }}
                  >
                    + Add New Subject
                  </button>

                  <button
                    className="btn btn-success btn-sm ms-3 d-flex align-items-center"
                    onClick={() => setshowAddStudentPopup(true)}
                  >
                    <Plus size={16} className="me-1" />
                    Register Student
                  </button>
                </div>
              </div>

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
                  maxHeight: "400px",
                  overflowY: "auto",
                  scrollbarColor: "rgba(108,117,125,0.6) transparent",
                }}
              >
                <table className="table table-hover align-middle">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th style={{ width: "5%" }}>#</th>
                      <th style={{ width: "30%" }}>Student Name</th>
                      <th style={{ width: "20%" }}>Identifier</th>
                      <th style={{ width: "25%" }}>Class</th>
                      <th style={{ width: "20%" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student, index) => (
                        <tr key={student.id}>
                          <td>{index + 1}</td>
                          <td>{student.fullName}</td>
                          <td>
                            <span className="badge bg-secondary">
                              {student.identifier}
                            </span>
                          </td>
                          <td>{viewClassData.className}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {

                                setSelectedStudent(student);
                                setShowPasswordPopup(true);
                              }}
                            >
                              Update
                            </button>
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
          onClose={() => setshowAddStudentPopup(false)}
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
