import { API_BASE_URL } from "@/src/config/api";

export async function loginApi(username: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  return res.json();
}