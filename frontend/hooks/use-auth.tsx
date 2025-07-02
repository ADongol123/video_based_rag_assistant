import { useState } from "react";
import { apiPost } from "../lib/apiClient";
import { useAuth } from "@/context/AuthContext";


export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  async function loginUser(email: string, password: string) {
    setLoading(true);
    setError(null);

    try {
      // Prepare data as an object (will be form-encoded inside apiPost)
      const data = {
        username: email,
        password,
      };

      // Call login endpoint with form-urlencoded content type
      const res = await apiPost(
        "/auth/login",
        data,
        null,
        "application/x-www-form-urlencoded"
      );

      // The response should contain your access token (adjust based on your backend)
      login(res.access_token);

      setLoading(false);
      return res;
    } catch (e: any) {
      setLoading(false);
      setError(e.message || "Login failed");
      throw e;
    }
  }

  return { loginUser, loading, error };
}
