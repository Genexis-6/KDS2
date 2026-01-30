import type { UseFormSetError } from "react-hook-form"
import { AddNewClassModel } from "../model/add_class_model"
import type { ClassFormValues } from "../view/components/AddNewClassForm"
import { DefaultRequestSetUp } from "../../../../utils/http/default_request_set_up"
import { useAllClassStore } from "../../../../utils/hooks/use_all_class"
import { AllServerUrls } from "../../../../utils/http/all_server_url"
import { useAuthTokenStore } from "../../../../utils/hooks/use_auth_token_store"
import { useNotificationStore } from "../../../../utils/hooks/use_notification_store"
import { useClassCreationStore } from "../../../../utils/hooks/use_class_creation_store"
import type { AddNewSubjectForm } from "../view/pages/AddNewClass"
import { SubjectModelWithOutId } from "../../../../common/model/classModels/subject_model"
import type { AddTimerFormValues } from "../view/components/AddTimerPopUp"
import { useIsAuthenticatedStore } from "../../../../utils/hooks/use_is_authenticated_store"
import type { AddNewStudentForm } from "../view/components/AddNewStudentToClass"
import { useLoadingStore } from "../../../../utils/hooks/use_loading_state"
import type { UploadExmaExcelForm } from "../view/components/UploadStudentQuestion"


type addClassType<T extends ClassFormValues> = {
  data: T
  setError: UseFormSetError<T>
}


type addSubjectType<T extends AddNewSubjectForm> = {
  dt: T
  setError: UseFormSetError<T>
}

type addTimerType<T extends AddTimerFormValues> = {
  dt: T
  setError: UseFormSetError<T>
}

type registerUseManually<T extends AddNewStudentForm> = {
  dt: T
  setError: UseFormSetError<T>
}

type uploadQuestionParam<T extends UploadExmaExcelForm> = {
  dt: T
  setError: UseFormSetError<T>
}

export class AllAdminOperation {
  static async submitNewClassData({
    data,
    setError,
  }: addClassType<ClassFormValues>) {
    const fullTeacherName = `${data.title} ${data.teacherName}`.trim();
    const { token, getAcessToken } = useAuthTokenStore.getState()
    if (!token) await getAcessToken()

    const finalData = new AddNewClassModel({ className: data.className, teacherName: fullTeacherName })
    const res = await DefaultRequestSetUp.post<AddNewClassModel, void>({ url: AllServerUrls.addNewClass, data: finalData, token: token! })

    if (res.statusCode === 400) {
      setError("className", {
        message: res.message
      })

    } else {
      if (res.statusCode === 200) {
        await useAllClassStore.getState().getLatestUpdate()
        useNotificationStore.getState().showNotification(res.message, "success")
        useClassCreationStore.getState().setProgress(false)

      }
    }
  }

  static async deleteThisClass({ className }: { className: string }) {
    const { token, getAcessToken } = useAuthTokenStore.getState()
    if (!token) await getAcessToken()
    const res = await DefaultRequestSetUp.delete<void, void>({ url: `${AllServerUrls.deleteClass}?className=${className}`, token: token! })


    if (res.statusCode === 200) {
      await useAllClassStore.getState().getLatestUpdate()
    }
    useNotificationStore.getState().showNotification(res.message, res.statusCode === 400 ? "error" : "success")



  }


  static async addNewSubject({
    dt,
    setError,
  }: addSubjectType<SubjectModelWithOutId>) {
    const { token } = useAuthTokenStore.getState();
    const { showNotification } = useNotificationStore.getState();

    try {
      // Prepare new subject instance
      const newSub = new SubjectModelWithOutId(
        dt.title,
        dt.author,
        dt.enable,
        dt.classId
      );

      const res = await DefaultRequestSetUp.post<AddNewSubjectForm, void>({
        url: AllServerUrls.addNewSubject,
        token: token!,
        data: newSub,
      });

      // Handle notification based on status
      showNotification(res.message, res.statusCode === 200 ? "success" : "error");

      // Optionally return response data
      return res;
    } catch (err: any) {
      console.error("Error adding subject:", err);
      showNotification("Something went wrong", "error");
      setError("title", { message: "Failed to create subject" });
    }
  }

  static async addTimer({ dt, setError }: addTimerType<AddTimerFormValues>) {
    const { isAuthenticated } = useIsAuthenticatedStore.getState();
    const { token } = useAuthTokenStore.getState();
    const { showNotification } = useNotificationStore.getState();

    if (!isAuthenticated || !token) {
      showNotification("You must be logged in to perform this action.", "error");
      return;
    }

    try {
      const payload = {
        hr: dt.hours,
        mins: dt.minutes,
        sec: dt.seconds,
        subjectId: dt.subjectId,
      };

      const res = await DefaultRequestSetUp.post<typeof payload, void>({
        url: AllServerUrls.setTimer,
        token,
        data: payload,
      });

      if (res.statusCode === 200) {
        showNotification(res.message || "Timer added successfully!", "success");
      } else {
        showNotification(res.message || "Failed to add timer", "error");
      }

      return res;
    } catch (err: any) {
      console.error("Error adding timer:", err);
      setError("hours", { message: "Failed to add timer" });
      showNotification("Something went wrong while adding timer", "error");
    }
  }

  static async registerUseManually({
    dt,
    setError,
  }: registerUseManually<AddNewStudentForm>) {
    const { token } = useAuthTokenStore.getState();
    const { showNotification } = useNotificationStore.getState();
    const { setLoadingState } = useLoadingStore.getState()

    try {
      setLoadingState(true)
      const res = await DefaultRequestSetUp.post<AddNewStudentForm, void>({
        url: AllServerUrls.registerStudent,
        token: token!,
        data: dt,
      });


      if (res.statusCode === 200) {
        showNotification(res.message || "Student successfully registered", "success");
        return res;
      } else {

        showNotification(res.message || "Failed to register student", "error");
        setError("identifier", { message: res.message || "Registration failed" });
      }
    } catch (err: any) {
      console.error("Error registering student:", err);
      showNotification("Something went wrong while registering", "error");
      setError("full_name", { message: "An unexpected error occurred" });
    } finally {
      setLoadingState(false)
    }
  }



  static async uploadQuestion({ dt, setError }: uploadQuestionParam<UploadExmaExcelForm>) {
    const { token } = useAuthTokenStore.getState();

    try {
      // Build FormData
      const formData = new FormData();
      formData.append("upload", dt.file[0]); // Excel file


      const url = `${AllServerUrls.uploadQuestion}?subject_id=${dt.subject_id}`;
      const res = await DefaultRequestSetUp.post<FormData, void>({
        url,
        data: formData,
        token: token!,
      });

      if (res.statusCode !== 200) {
        setError("file", { message: res.message || "Upload failed" });
        return;
      }

      useNotificationStore.getState().showNotification(res.message, "success")
      return res;
    } catch (err: any) {
      useNotificationStore.getState().showNotification("an erro occured while uploading", "error")
      console.error("❌ Upload error:", err);
      setError("file", { message: err.message || "Upload failed" });
    }
  }

  static async deleteQuestions({ subjectId }: { subjectId: string }) {
    const { token } = useAuthTokenStore.getState()
    var res = await DefaultRequestSetUp.delete<void, boolean>({ url: `${AllServerUrls.deleteQuestion}?subjectId=${subjectId}`, token: token! })
    useNotificationStore.getState().showNotification(res.message, res.statusCode === 200 ? "success" : "info")
    return res.data
  }


  static async updateStudentPassword(studentId: string, newPassword: string) {
    const { token } = useAuthTokenStore.getState()
    const res = await DefaultRequestSetUp.put<
      { studentId: string; newPassword: string },
      boolean
    >({
      url: AllServerUrls.updateStudentPassword,
      token: token!,
      data: { studentId: studentId, newPassword: newPassword },
    })
    useNotificationStore.getState().showNotification(res.message, res.statusCode == 200 ? "success" : "info")
    return res
  }


  static async saveQuestionFormat(data: {
    subjectId: string;
    number_of_qa: number;
    score_per_qa: number;
  }): Promise<boolean> {
    const { token } = useAuthTokenStore.getState();
    const { showNotification } = useNotificationStore.getState();

    try {
      const res = await DefaultRequestSetUp.post<typeof data, boolean>({
        url: AllServerUrls.saveQuestionFormat, // You'll need to define this URL
        token: token!,
        data,
      });

      if (res.statusCode === 200) {
        showNotification(
          res.message || "Question format saved successfully!",
          "success"
        );
        return true;
      } else {
        showNotification(
          res.message || "Failed to save question format",
          "error"
        );
        return false;
      }
    } catch (error: any) {
      console.error("Error saving question format:", error);
      showNotification(
        error.message || "Something went wrong while saving format",
        "error"
      );
      return false;
    }
  }

  /**
   * Get question format for a subject
   */
  static async getQuestionFormat(subjectId: string): Promise<{
    number_of_qa: number;
    score_per_qa: number;
    created_at?: string;
  } | null> {
    const { token } = useAuthTokenStore.getState();

    try {
      const res = await DefaultRequestSetUp.get<{
        number_of_qa: number;
        score_per_qa: number;
        created_at?: string;
      }>({
        url: `${AllServerUrls.getQuestionFormat}/${subjectId}`, // You'll need to define this URL
        token: token!,
      });

      if (res.statusCode === 200 && res.data) {
        return res.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching question format:", error);
      return null;
    }
  }

  /**
   * Get the count of available questions for a subject
   */
  static async getQuestionCount(subjectId: string): Promise<number> {
    const { token } = useAuthTokenStore.getState();

    try {
      const res = await DefaultRequestSetUp.get<{ count: number }>({
        url: `${AllServerUrls.getQuestionCount}/${subjectId}`, // You'll need to define this URL
        token: token!,
      });

      if (res.statusCode === 200 && res.data) {
        return res.data.count || 0;
      }
      return 0;
    } catch (error) {
      console.error("Error fetching question count:", error);
      return 0;
    }
  }

  static async deleteStudentScore(student_id: string, subject_id: string): Promise<boolean> {
    const { token } = useAuthTokenStore.getState();
    const { showNotification } = useNotificationStore.getState();

    try {
      // Construct the URL with both studentId and subjectId as query parameters
      const url = `${AllServerUrls.deleteStudentScore}?studentId=${student_id}&subjectId=${subject_id}`;

      const res = await DefaultRequestSetUp.delete<void, boolean>({
        url,
        token: token!,
      });

      if (res.statusCode === 200) {
        showNotification(
          res.message || "Score deleted successfully!",
          "success"
        );
        return true;
      } else {
        showNotification(
          res.message || "Failed to delete score",
          "error"
        );
        return false;
      }
    } catch (error: any) {
      console.error("Error deleting score:", error);
      showNotification(
        error.message || "Something went wrong while deleting score",
        "error"
      );
      return false;
    }
  }



}
