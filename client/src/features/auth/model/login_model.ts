import type { userRole } from "../view/pages/Login";

export class LoginModel{
    public identifier:string
    public password:string
    public role:userRole


    constructor({identifier, password, role}: {identifier: string, password:string, role: userRole}){
        this.identifier = identifier;
       
        this.password = password
        this.role = role
    }
}