import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Gắn JWT token vào request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Xử lý response
axiosClient.interceptors.response.use(
  (response) => {
    const body = response.data;

    // Backend trả dạng ApiResponse: { success, message, data, timestamp }
    if (body && typeof body === "object" && "data" in body) {
      return body.data;
    }

    return body;
  },
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Đã xảy ra lỗi. Vui lòng thử lại.";

    return Promise.reject(new Error(String(message)));
  }
);

export default axiosClient;