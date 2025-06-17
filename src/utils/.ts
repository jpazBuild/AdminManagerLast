import { toast } from "sonner";
import axios from 'axios';

export const handleAxiosRequest = async <T>(
  requestFn: () => Promise<T>,
  successMessage?: string
): Promise<T | null> => {
  try {
    const response = await requestFn();

    if (successMessage) {
      toast.success(successMessage);
    }

    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.message === "Network Error") {
        toast.error("🌐 Network error. Please check your internet connection.");
      } else if (error.response) {
        toast.error(`❌ Error ${error.response.status}: ${error.response.data?.message || "Request failed"}`);
      } else {
        toast.error("❌ Unexpected Axios error");
      }
    } else {
      toast.error("❌ An unknown error occurred");
    }
    console.error("Axios error:", error);
    return null;
  }
};