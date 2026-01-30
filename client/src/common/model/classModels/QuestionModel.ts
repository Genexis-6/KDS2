export class QuestionModel{
    public a:string
    public b:string
    public c:string
    public d:string
    public question:string
    public id:string


    constructor({a, b, c, d, question, id}: {a:string, b:string, c:string, d:string, question:string, id:string }){
        this.a = a
        this.b = b
        this.c = c
        this.d = d
        this.question = question
        this.id = id
    }
}