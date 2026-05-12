import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { authApi } from "../api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

const safeParseUser = () => {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

const normalizeLoginResponse = (res) => {
  const root = res?.data ?? res;
  const payload = root?.data ?? root;

  const token =
    payload?.token ||
    payload?.accessToken ||
    payload?.jwt ||
    root?.token ||
    root?.accessToken ||
    root?.jwt;

  const user =
    payload?.user ||
    root?.user ||
    {
      userId: payload?.userId,
      fullName: payload?.fullName,
      email: payload?.email,
      phone: payload?.phone,
      address: payload?.address,
      role: payload?.role,
      roles: payload?.roles,
    };

  return { token, user };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(safeParseUser);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = Boolean(localStorage.getItem("token"));

  const hasRole = useCallback(
    (role) => {
      if (!user || !role) return false;

      if (Array.isArray(user.roles)) {
        return user.roles.includes(role);
      }

      if (user.role) {
        return user.role === role;
      }

      return false;
    },
    [user]
  );

  const login = async (credentials) => {
    setLoading(true);

    try {
      const res = await authApi.login(credentials);
      const { token, user: loginUser } = normalizeLoginResponse(res);

      if (!token) {
        console.log("LOGIN RESPONSE =", res);
        throw new Error("Backend không trả về token.");
      }

      if (!loginUser || !loginUser.email) {
        console.log("LOGIN USER RESPONSE =", res);
        throw new Error("Backend không trả về thông tin user.");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(loginUser));
      setUser(loginUser);

      toast.success("Đăng nhập thành công!");
      return { success: true, user: loginUser };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Đăng nhập thất bại";

      toast.error(String(message));
      return { success: false, message: String(message) };
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Đã đăng xuất.");
  }, []);

  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      hasRole,
      login,
      logout,
      updateUser,
    }),
    [user, loading, isAuthenticated, hasRole, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
};