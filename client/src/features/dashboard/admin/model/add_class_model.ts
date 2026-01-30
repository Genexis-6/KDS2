export class AddNewClassModel{
    public className:string
    public teacherName:string


    constructor({className, teacherName}:{className:string, teacherName:string}){
        this.className = className
        this.teacherName = teacherName
    }
}