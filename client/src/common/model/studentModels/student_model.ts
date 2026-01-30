export class StudentModels {
  public fullName: string;
  public id: string;
  public classId: string;
  public identifier: string;

  constructor(fullName: string, id: string, classId: string, identifier: string) {
    this.fullName = fullName;
    this.id = id;
    this.classId = classId;
    this.identifier = identifier;
  }
}
