export class TimerModel {
    public hr: number;
    public mins: number;
    public sec: number;
    public subjectId: string;

    constructor(hr: number, mins: number, sec: number, subjectId: string) {
        this.hr = hr;
        this.mins = mins;
        this.sec = sec;
        this.subjectId = subjectId;
    }
}
