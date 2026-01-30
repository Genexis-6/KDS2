export class AppUrl {
    static login: string = "/"


    static examSelectionUrl: string = "/exam-selection"
    static examPreparation: string = "/exam-preparation"
    static startExam: string = "/exam-start"


    static adminPath: string = "/admin"
    static viewParticularClass: string = "class/:className"
    static viewParticularClassSubject: string = "class/:className/subject"
    static addNewSubject: string = "class/:classId/add-subject"
    static viewParticularSubject: string = "class/subject/:subjectId/:subjectTitle"
    static addTimer: string = ''
    static addQuestions: string = ''
    static addStudentToSubject: string = ''




    static build(path: string, params: Record<string, string | number> = {}): string {
        let builtPath = path;
        for (const [key, value] of Object.entries(params)) {
            builtPath = builtPath.replace(`:${key}`, String(value));
        }
        return builtPath;
    }
}