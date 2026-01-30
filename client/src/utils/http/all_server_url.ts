export class AllServerUrls {

    static backendUrl: string = "http://127.0.0.1:8000"




    // auth url
    static login: string = `${AllServerUrls.backendUrl}/auth/login`
    static registerStudent:string = `${AllServerUrls.backendUrl}/auth/register`
    static getRefreshToken: string = `${AllServerUrls.backendUrl}/auth/refresh_token`
    static currentUser: string = `${AllServerUrls.backendUrl}/auth/current_user`
    static logout: string = `${AllServerUrls.backendUrl}/auth/logout`
    static bulkRegisterStudents: string = `${AllServerUrls.backendUrl}/auth/register/bulk`


    // all url relating to classess
    static classUrls: string = `${AllServerUrls.backendUrl}/class`
    static getAllClassUlr: string = `${AllServerUrls.classUrls}/all_classess`
    static addNewClass: string = `${AllServerUrls.classUrls}/add_class`
    static deleteClass: string = `${AllServerUrls.classUrls}/delete_class`
    static getClassInfo: string = `${AllServerUrls.classUrls}/get_class_full_info`



    // al student url
    static getStudentInfoUrl: string = `${AllServerUrls.backendUrl}/students/student_info`
    static updateStudentPassword:string = `${AllServerUrls.backendUrl}/students/change_password`


    // all subject url
    static subjects:string = `${AllServerUrls.backendUrl}/subjects`
    static getAllSubjects: string = `${AllServerUrls.backendUrl}/subjects/get_all_subject`
    static addNewSubject: string = `${AllServerUrls.backendUrl}/subjects/add_subject`
    static generateRecord:string = `${AllServerUrls.backendUrl}/subjects/generate_record`
    static getQuestionFormat:string = `${AllServerUrls.backendUrl}/subjects/get_subject_format`
    static saveQuestionFormat:string = `${AllServerUrls.backendUrl}/subjects/save_subject_format`
    
    // generate_record


    // all time url
    static getExamTime: string = `${AllServerUrls.backendUrl}/timer/get_exam_time`
    static setTimer:string = `${AllServerUrls.backendUrl}/timer/set_timer`



    // all question url
    static getAllQuestion: string = `${AllServerUrls.backendUrl}/question/get_questions`
    static uploadQuestion: string = `${AllServerUrls.backendUrl}/question/add_question`
    static deleteQuestion: string = `${AllServerUrls.backendUrl}/question/delete_questions`
    static getQuestionCount:string = `${AllServerUrls.backendUrl}/question/total-question`



    static checkProceedExam: string = `${AllServerUrls.backendUrl}/score/check_proceed_exam`
    static submitExam: string = `${AllServerUrls.backendUrl}/score/submit_exam_result`
    static deleteStudentScore:String = `${AllServerUrls.backendUrl}/score/delete_student_score`

}