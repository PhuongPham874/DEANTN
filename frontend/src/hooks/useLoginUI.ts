import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/src/config/api";

type LoginSuccess = {
  message: string;
  data: {
    token: string;
    user: {
      id: number;
      username: string;
    };
  };
};

type LoginError = {
  errors?: Record<string, string[]>;
};

export const useLoginUI = () => {
  const router = useRouter();

  // ===== input states =====
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // ===== UI states =====
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  // ===== error state (hiển thị dưới input) =====
  // giống register: string per field
  const [errors, setErrors] = useState({
    username: "",
    password: "",
    non_field_errors: "",
  });

  // ===== toggle password =====
  const togglePassword = () => setSecure((prev) => !prev);

  const onForgotPress = () => {;
    router.push("/auth/forgot-password"); 
  };

  const onRegisterPress = () => {
    router.push("/auth/register");
  };

  // ===== gọi API login =====
  const onLogin = async () => {
    // reset errors
    setErrors({ username: "", password: "", non_field_errors: "" });

    // client-side validate giống register style
    let hasError = false;
    const nextErrors = { username: "", password: "", non_field_errors: "" };

    if (!username.trim()) {
      nextErrors.username = "Vui lòng nhập tên đăng nhập";
      hasError = true;
    }
    if (!password) {
      nextErrors.password = "Vui lòng nhập mật khẩu";
      hasError = true;
    }

    if (hasError) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as
        | LoginSuccess
        | LoginError
        | any;

      if (!response.ok) {
        const apiErrors = (data as LoginError)?.errors || {};

        setErrors({
          username: apiErrors.username?.[0] || "",
          password: apiErrors.password?.[0] || "",
          non_field_errors: apiErrors.non_field_errors?.[0] || "Đăng nhập thất bại",
        });

        return;
      }

      // ✅ Success format mới: { message, data: { token, user } }
      const okData = data as LoginSuccess;

      // lưu token để gọi các API cần auth
      await SecureStore.setItemAsync("auth_token", okData.data.token);

      // navigate Home
      Alert.alert("Home", "Home");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return {
    // input
    username,
    setUsername,
    password,
    setPassword,

    // ui
    secure,
    togglePassword,
    loading,

    // errors
    errors,

    // actions
    onLogin,
    onForgotPress,
    onRegisterPress,
  };
};