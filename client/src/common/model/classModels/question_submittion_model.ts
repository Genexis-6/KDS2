import type { StudentAnswer } from "../../../utils/hooks/use_student_answers"

export class QuestionSubmittionModel{
    public subjectId:string
    public studentId:string
    public answers:StudentAnswer[]


    constructor({subjectId, studentId, answers}:{subjectId:string, studentId:string, answers:StudentAnswer[]}){
        this.answers = answers
        this.studentId = studentId
        this.subjectId = subjectId
    }
}