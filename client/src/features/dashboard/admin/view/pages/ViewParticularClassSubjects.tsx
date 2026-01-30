import { useParams } from "react-router-dom";
import SubjectTile from "../components/SubjectTile";
import { useEffect, useState } from "react";
import { useViewClassInfoStore } from "../../../../../utils/hooks/use_view_class_info";
import { useNavigationStore } from "../../../../../utils/hooks/use_navigation_store";
import { AppUrl } from "../../../../../common/routes/app_urls";

export default function ViewParticularClassSubjects() {
  const { viewClassData, getClassInfo } = useViewClassInfoStore();
  const { className } = useParams();
  const {navigate} = useNavigationStore()

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (className) {
      getClassInfo(className).then();
    }
  }, [className]);

  const filteredSubjects = viewClassData?.subjects?.filter((sub) =>
    sub.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-container mt-5">
      <div className="container">
        <div className="row">
          <div className="col-12 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="fw-bold text-secondary">{className} Subjects</h4>
              <input
                type="text"
                className="form-control w-50"
                placeholder="Search subject by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="all-class-body">
              {filteredSubjects && filteredSubjects.length > 0 ? (
                filteredSubjects.map((sub, key) => (
                  <SubjectTile key={key} sub={sub} onView={()=>navigate(`/admin/${AppUrl.build(AppUrl.viewParticularSubject, { subjectId: sub.id, subjectTitle: sub.title })}`)}/>
                ))
              ) : (
                <p>No subject found{searchTerm ? ` for "${searchTerm}"` : ""}.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
