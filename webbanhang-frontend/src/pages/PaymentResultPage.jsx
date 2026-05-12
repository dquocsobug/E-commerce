import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { orderApi } from "../api";

const extractRealOrderId = (value) => {
  if (!value) return null;

  if (/^\d+$/.test(value)) {
    return value;
  }

  if (value.startsWith("ORDER_")) {
    const parts = value.split("_");
    return parts[1];
  }

  return null;
};

export default function PaymentResultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handlePaymentResult = async () => {
      const resultCode = searchParams.get("resultCode");
      const momoOrderId = searchParams.get("orderId");
      const savedOrderId = sessionStorage.getItem("momoOrderId");

      let orderId = extractRealOrderId(momoOrderId);

      if (!orderId) {
        orderId = extractRealOrderId(savedOrderId);
      }

      console.log("FULL URL:", window.location.href);
      console.log("resultCode:", resultCode);
      console.log("momoOrderId from MoMo:", momoOrderId);
      console.log("session momoOrderId:", savedOrderId);
      console.log("real orderId:", orderId);
      console.log("token:", localStorage.getItem("token"));

      try {
        if (resultCode === "0" && orderId) {
          const res = await orderApi.updatePaymentStatus(orderId);

          console.log("UPDATE PAYMENT RESPONSE:", res);

          sessionStorage.removeItem("checkoutState");
          sessionStorage.removeItem("momoOrderId");

          toast.success("Thanh toán MoMo thành công");

          setTimeout(() => {
            navigate("/orders", { replace: true });
          }, 1200);

          return;
        }

        toast.error("Thanh toán MoMo thất bại hoặc thiếu mã đơn hàng");

        setTimeout(() => {
          navigate("/orders", { replace: true });
        }, 1200);
      } catch (error) {
        console.error("Lỗi xử lý kết quả MoMo:", error);
        console.error("Status:", error?.response?.status);
        console.error("Message:", error?.response?.data?.message);
        console.error("Data:", error?.response?.data);

        toast.error(
          error?.response?.data?.message ||
            "Không thể cập nhật trạng thái thanh toán"
        );

        setTimeout(() => {
          navigate("/orders", { replace: true });
        }, 2000);
      }
    };

    handlePaymentResult();
  }, [navigate, searchParams]);

  return <div>Đang xử lý kết quả thanh toán...</div>;
}