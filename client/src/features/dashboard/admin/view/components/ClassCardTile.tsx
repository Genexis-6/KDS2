import { useState } from "react";
import { Pencil, X, Check } from "lucide-react";

type ClassData = {
  className: string;
  teacherName: string;
  onDelete: () => void;
  onView: () => void;
  onEdit?: (data: { className: string; teacherName: string }) => Promise<void> | void;
};

export default function ClassCardTile({
  className,
  teacherName,
  onDelete,
  onView,
  onEdit,
}: ClassData) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(className);
  const [teacherDraft, setTeacherDraft] = useState(teacherName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onEdit) return;
    setIsSaving(true);
    try {
      await onEdit({ className: nameDraft, teacherName: teacherDraft });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNameDraft(className);
    setTeacherDraft(teacherName);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="card p-3 mb-3 shadow-sm border-0">
        <div className="d-flex flex-column gap-2">
          <input
            className="form-control form-control-sm"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Class name"
          />
          <input
            className="form-control form-control-sm"
            value={teacherDraft}
            onChange={(e) => setTeacherDraft(e.target.value)}
            placeholder="Teacher name"
          />
          <div className="d-flex gap-2 justify-content-end">
            <button className="btn btn-outline-secondary btn-sm" onClick={handleCancel} disabled={isSaving}>
              <X size={16} /> Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={isSaving}>
              <Check size={16} /> {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-3 mb-3 shadow-sm border-0 d-flex flex-row justify-content-between align-items-center">
      {/* Left side: class info */}
      <div className="d-flex flex-column">
        <span className="fw-semibold text-dark fs-5">
          {className}
        </span>
        <small className="text-muted">{teacherName}</small>
      </div>

      {/* Right side: buttons */}
      <div className="d-flex gap-2">
        <button
          className="btn btn-outline-primary btn-sm px-3 py-1"
          onClick={()=>{
            onView()
            sessionStorage.setItem("currentClass", className)
          }}
        >
          View Class
        </button>
        {onEdit && (
          <button
            className="btn btn-outline-secondary btn-sm px-3 py-1"
            onClick={() => setIsEditing(true)}
            title="Edit class"
          >
            <Pencil size={16} />
          </button>
        )}
        <button
          className="btn btn-outline-danger btn-sm px-3 py-1"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
