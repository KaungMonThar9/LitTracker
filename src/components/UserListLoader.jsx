import axios from "axios";

export async function userListLoader() {
  const token = localStorage.getItem("token");
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await axios.get(`${apiUrl}/api/media-list`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data ?? [];
}
