
type examHeadingParams = {
  className?:string,
  teacherName?:string
}


const ExamHeading = ({className, teacherName}:examHeadingParams) => {
  return (
    <div className="container py-3 border-bottom">
      <div className="row align-items-center">
        {/* Heading Title */}
        <div className="col-auto">
          <h3 className="mb-0 text-uppercase">{className ?? "request failed"} Class</h3>
        </div>

        {/* Text Field */}
        <div className="col-sm-6 col-md-4 col-lg-3">
          <input
            type="text"
            className="form-control ms-sm-3 mt-2 mt-sm-0"
            placeholder="Enter text here..."
          />
        </div>
        <div className="col-6">
          <h6 className="mb-0 text-end text-primary">By {teacherName ?? "request failed"}</h6>
        </div>
      </div>
    </div>
  );
};

export default ExamHeading;