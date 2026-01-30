import { useState } from "react";
import type { ClassModel } from "../../../../../common/model/classModels/class_model";
import ClassCardTile from "./ClassCardTile";
import { Plus } from "lucide-react";
import { useClassCreationStore } from "../../../../../utils/hooks/use_class_creation_store";
import { AllAdminOperation } from "../../viewModel/allAdminOperations";
import { useNavigationStore } from "../../../../../utils/hooks/use_navigation_store";
import { AppUrl } from "../../../../../common/routes/app_urls";

interface AllAvailableClassProps {
  allClass: ClassModel[];
  openPopup: (params: {
    title: string;
    message: string;
    onContinue?: () => void;
    onCancel?: () => void;
  }) => void;
  closePopup: () => void;
}

export default function AllAvailableClass({
  allClass = [],
  openPopup,
  closePopup,
}: AllAvailableClassProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { setProgress } = useClassCreationStore()
  const { navigate } = useNavigationStore()

  // Filter classes based on the search term
  const filteredClasses = allClass.filter(
    (class_) =>
      class_.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      class_.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="col-12">
      <div className="row align-items-center mb-3">
        {/* Left Section: Title + count */}
        <div className="col-md-6 d-flex align-items-center gap-2">
          <h6 className="text-secondary mb-0">All Available Classes</h6>
          <span className="badge bg-secondary">{filteredClasses.length}</span>
        </div>

        {/* Right Section: Search Field */}
        <div className="col-md-6 text-md-end mt-2 mt-md-0">
          <div className="d-inline-flex align-items-center position-relative">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingRight: "60px", minWidth: "220px" }}
            />

            {/* Search icon */}
            <i
              className="bi bi-search text-secondary position-absolute"
              style={{ right: "35px", top: "50%", transform: "translateY(-50%)" }}
            ></i>

            {/* Plus icon (Lucide React) */}
            <Plus
              size={18}
              className="text-primary position-absolute cursor-pointer"
              style={{ right: "10px", top: "50%", transform: "translateY(-50%)" }}
              onClick={() => setProgress(true)}
            />
          </div>

        </div>
      </div>

      <hr className="mt-0 mb-3" />

      {/* Classes list */}
      <div className="row">
        <div className="col-12">
          <div className="all-class-body">
            {filteredClasses.length > 0 ? (
              filteredClasses.map((class_, key) => (
                <ClassCardTile
                  key={key}
                  className={class_.className}
                  teacherName={class_.teacherName}
                  onView={() => navigate(`/admin/${AppUrl.build(AppUrl.viewParticularClass, { className: class_.className })}`)}
                  onDelete={() =>
                    openPopup({
                      title: "Confirm Action",
                      message:
                        "Do you want to continue with this delete operation?",
                      onContinue: async () => {
                        await AllAdminOperation.deleteThisClass({ className: class_.className })
                      },
                      onCancel: () => closePopup(),
                    })
                  }
                />
              ))
            ) : (
              <p className="text-muted text-center">No classes found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
