export class SubjectModel {
    public id: string;
    public title: string;
    public author: string;
    public enable: boolean;
    public classId: string;

    constructor(
        id: string,
        title: string,
        author: string,
        enable: boolean,
        classId: string
    ) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.enable = enable;
        this.classId = classId;
    }
}


export class SubjectModelWithOutId {
    public title: string;
    public author: string;
    public enable: boolean;
    public classId: string;

    constructor(
        title: string,
        author: string,
        enable: boolean,
        classId: string
    ) {

        this.title = title;
        this.author = author;
        this.enable = enable;
        this.classId = classId;
    }
}




export class ProceedExam {
    public subjectId: string
    public studentId: string

    constructor({ subId, studId }: { subId: string, studId: string }) {
        this.studentId = studId
        this.subjectId = subId
    }
}

