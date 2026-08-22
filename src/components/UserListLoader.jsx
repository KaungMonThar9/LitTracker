import axios from "axios";
import { redirect } from "react-router";

export async function userListLoader() {
  const token = localStorage.getItem("token");
  const apiUrl = import.meta.env.VITE_API_URL;
  try {
    const response = await axios.get(`${apiUrl}/api/media-list`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data ?? [];
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");

      throw redirect("/Login?redirectTo=/UserList");
    }
  }
}
