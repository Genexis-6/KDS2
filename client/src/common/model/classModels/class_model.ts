export class ClassModel{

    public className:string
    public id:string
    public teacherName:string

    constructor({className, id, teacherName}: {className: string, id: string, teacherName: string}){
        this.className = className
        this.id = id
        this.teacherName = teacherName
    }
}