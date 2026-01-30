import os
from datetime import datetime
import pandas as pd
from app.repo.schemas.subject_schemas.subject_score_schemas import StudentScoreRecord

def generate_excel_record(data: StudentScoreRecord) -> bool:
    """
    Generate an Excel file containing class name, subject, and student score records.

    The Excel file will be saved inside the 'exam_records' directory with the filename:
    '{className}-{subject}-{timestamp}.xlsx'.
    """
    try:
        # Ensure output directory exists
        output_dir = "../../exam_records"
        os.makedirs(output_dir, exist_ok=True)

        # Validate data
        if not data.students or len(data.students) == 0:
            raise ValueError("No student records provided.")

        # Generate a timestamp for unique filenames
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

        # Construct file name and full path
        filename = f"{data.className}-{data.subject}-{timestamp}.xlsx"
        filepath = os.path.join(output_dir, filename)

        # Convert student data into a DataFrame
        df = pd.DataFrame([
            {
                "Student Name": s.studentName,
                "Identifier": s.identifier,
                "Score": s.score,
            }
            for s in data.students
        ])

        # Write data into Excel
        with pd.ExcelWriter(filepath, engine="openpyxl") as writer:
            # Write class info at the top
            class_info_df = pd.DataFrame({
                "Class Name": [data.className],
                "Subject": [data.subject],
                "Generated On": [datetime.now().strftime("%Y-%m-%d %H:%M:%S")]
            })
            class_info_df.to_excel(writer, sheet_name="Record", index=False, startrow=0)

            # Write student score records below the class info
            df.to_excel(writer, sheet_name="Record", index=False, startrow=4)

        print(f" Excel file generated successfully at: {filepath}")
        return True

    except Exception as e:
        print(f" Error generating Excel file: {e}")
        return False
