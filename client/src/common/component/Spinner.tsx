export default function Spinner({ message }: { message?: string }) {
  return (
    <div className="d-flex justify-content-center align-items-center flex-column">
      <div className="spinner-border text-primary" role="status" />
      <div className="col-12">
        <span className="text-primary">
          {message}
        </span>
      </div>
    </div>
  )
}