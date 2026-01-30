import type { StudentSubInfo } from "../../../../utils/hooks/use_subject_full_info"

export class GenerateRecord{
    
    public className: string
    public subject:string
    public students: StudentSubInfo[]

    constructor({className, students, subject}:{className:string, students:StudentSubInfo[], subject:string }){
        this.className = className
        this.students = students
        this.subject = subject
    }

}