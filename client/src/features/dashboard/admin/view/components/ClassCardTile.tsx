type ClassData = {
  className: string;
  teacherName: string;
  onDelete: () => void;
  onView: () => void;
};

export default function ClassCardTile({
  className,
  teacherName,
  onDelete,
  onView,
}: ClassData) {
  return (
    <div className="card p-3 mb-3 shadow-sm border-0 d-flex flex-row justify-content-between align-items-center">
      {/* Left side: class info */}
      <div className="d-flex flex-column">
        <span className="fw-semibold text-dark fs-5 text-uppercase">
          {className}
        </span>
        <small className="text-muted text-uppercase">{teacherName}</small>
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
