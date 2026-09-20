import { useState } from "react";
import type { SubjectModel } from "../../../../../common/model/classModels/subject_model";
import { Pencil, X, Check } from "lucide-react";


interface subParams {
    sub: SubjectModel,
    onView: () => void
    onEdit?: (data: { title: string; author: string }) => Promise<void> | void
    onDelete?: () => void
}


export default function SubjectTile({ sub, onView, onEdit, onDelete }: subParams) {
    const [isEditing, setIsEditing] = useState(false);
    const [titleDraft, setTitleDraft] = useState(sub.title);
    const [authorDraft, setAuthorDraft] = useState(sub.author);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!onEdit) return;
        setIsSaving(true);
        try {
            await onEdit({ title: titleDraft, author: authorDraft });
            setIsEditing(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setTitleDraft(sub.title);
        setAuthorDraft(sub.author);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="card p-3 mb-3 shadow-sm border-0">
                <div className="d-flex flex-column gap-2">
                    <input
                        className="form-control form-control-sm"
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        placeholder="Subject title"
                    />
                    <input
                        className="form-control form-control-sm"
                        value={authorDraft}
                        onChange={(e) => setAuthorDraft(e.target.value)}
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

    return <>
        <div className="card p-3 mb-3 shadow-sm border-0 d-flex flex-row justify-content-between align-items-center">
            {/* Left side: class info */}
            <div className="d-flex flex-column">
                <span className="fw-semibold text-dark fs-5">
                    {sub.title}
                </span>
                <small className="text-muted">teacher: <b>{sub.author}</b></small>
            </div>

            {/* Right side: buttons */}
            <div className="d-flex gap-2">
                <button
                    className="btn btn-outline-primary btn-sm px-3 py-1"
                    onClick={() => { onView() }}
                >
                    View Sub
                </button>
                {onEdit && (
                    <button
                        className="btn btn-outline-secondary btn-sm px-3 py-1"
                        onClick={() => setIsEditing(true)}
                        title="Edit subject"
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
    </>
}
