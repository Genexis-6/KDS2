import { Plus } from "lucide-react";
import { useClassCreationStore } from "../../../../../utils/hooks/use_class_creation_store";

export default function AddNewClassComponent() {
    const {setProgress} = useClassCreationStore()
    return <div className="card p-5 add-card" onClick={()=>{
        setProgress(true)
    }}>
        <div className="row">
            <div className="col-12">
                <h3 className="text-secondary">Create new class</h3>
            </div>
        </div>
        <div className="row">
            <div className="col-12 d-flex justify-content-center mt-2">
                <div className="flex items-center space-x-3 card add">
                    <Plus size={30} className="text-primary" />

                </div>
            </div>
        </div>
    </div>
}