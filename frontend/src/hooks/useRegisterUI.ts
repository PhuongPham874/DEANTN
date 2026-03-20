import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { API_BASE_URL } from "@/src/config/api";

export const useRegisterUI = () => {
  const router = useRouter();

  // ===== input states =====
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ===== UI states =====
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const [loading, setLoading] = useState(false);

  // ===== error state (hiển thị dưới input) =====
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
  });

  // ===== toggle password =====
  const togglePassword = () => {
    setSecurePassword(prev => !prev);
  };

  const toggleConfirmPassword = () => {
    setSecureConfirm(prev => !prev);
  };

  // ===== gọi API register =====
  const onRegister = async () => {
    setErrors({
      username: "",
      email: "",
      password: "",
      password_confirm: "",
    });

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/register/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            password,
            password_confirm: confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const apiErrors = data.errors || {};

        setErrors({
          username: apiErrors.username?.[0] || "",
          email: apiErrors.email?.[0] || "",
          password: apiErrors.password?.[0] || "",
          password_confirm: apiErrors.password_confirm?.[0] || "",
        });

        return;
      }

      Alert.alert("Thành công", data.message);

      router.replace("/auth/login");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể kết nối server");
    } finally {
      setLoading(false);
    }
  };

  // ===== chuyển sang login =====
  const onLogin = () => {
    router.push("/auth/login");
  };

  return {
    // input
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,

    // ui
    securePassword,
    secureConfirm,
    togglePassword,
    toggleConfirmPassword,
    loading,

    // errors
    errors,

    // actions
    onRegister,
    onLogin,
  };
};