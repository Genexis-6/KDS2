import  { useState } from "react";
import type { StudentModels } from "../../../../../common/model/studentModels/student_model";
import { AllAdminOperation } from "../../viewModel/allAdminOperations";
import { useNotificationStore } from "../../../../../utils/hooks/use_notification_store";

interface ChangePasswordFormProps {
  student: StudentModels;
  onClose: () => void;
  onSave: (studentId: string, newPassword: string) => void;
}

export default function ChangePasswordForm({
  student,
  onClose,
  onSave,
}: ChangePasswordFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotificationStore();

  const handleChangePassword = async () => {
    if (!newPassword.trim()) return;

    setLoading(true);
    try {
      const res = await AllAdminOperation.updateStudentPassword(student.id, newPassword);

      if (res.statusCode === 200 || res.statusCode === 201) {
        showNotification("Password updated successfully!", "success");
        onSave(student.id, newPassword);
        onClose();
      } else {
        showNotification(res.message || "Failed to update password", "error");
      }
    } catch (e) {
      showNotification("Something went wrong updating the password", "error");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Change Password for {student.fullName}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <div className="modal-body">
            <p className="mb-3">
              Identifier: <strong>{student.identifier}</strong>
            </p>

            <div className="mb-3">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={loading}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              disabled={!newPassword.trim() || loading}
              onClick={handleChangePassword}
            >
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
