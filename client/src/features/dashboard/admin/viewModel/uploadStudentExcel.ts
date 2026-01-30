import { useNotificationStore } from "../../../../utils/hooks/use_notification_store";
import { useAuthTokenStore } from "../../../../utils/hooks/use_auth_token_store";
import { DefaultRequestSetUp } from "../../../../utils/http/default_request_set_up";
import { AllServerUrls } from "../../../../utils/http/all_server_url";

interface UploadExcelParams {
  file: File;
  classId: string;
}

export async function uploadStudentsExcel({ file, classId }: UploadExcelParams) {
  const { token, getAcessToken } = useAuthTokenStore.getState();
  const { showNotification } = useNotificationStore.getState();

  try {
    if (!token) await getAcessToken();

    // Build FormData
    const formData = new FormData();
    formData.append("file", file);

    // Construct URL with query param for class_id
    const url = `${AllServerUrls.bulkRegisterStudents}?class_id=${classId}`;

    // Use your DefaultRequestSetUp wrapper (or fetch)
    const res = await DefaultRequestSetUp.post<FormData, void>({
      url,
      token: token!,
      data: formData,
    });

    if (res.statusCode === 202) {
      showNotification("Excel upload started successfully!", "success");
    } else {
      showNotification(res.message || "Excel upload failed", "error");
    }

    return res;
  } catch (err: any) {
    console.error("Error uploading Excel:", err);
    showNotification("An error occurred while uploading Excel", "error");
    throw err;
  }
}
