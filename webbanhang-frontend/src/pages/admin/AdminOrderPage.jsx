import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Search,
  RefreshCcw,
  Save,
  ShoppingCart,
  Truck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { orderApi } from "../../api";
import "./AdminOrderPage.css";

const ORDER_STATUS = [
  "PENDING",
  "CONFIRMED",
  "SHIPPING",
  "DELIVERED",
  "CANCELLED",
];

const statusLabel = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
};

const statusClass = {
  PENDING: "admin-order-badge pending",
  CONFIRMED: "admin-order-badge confirmed",
  SHIPPING: "admin-order-badge shipping",
  DELIVERED: "admin-order-badge delivered",
  CANCELLED: "admin-order-badge cancelled",
};

const paymentLabel = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  REFUNDED: "Đã hoàn tiền",
};

const formatVND = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value || 0));

const unwrapList = (res) => {
  const payload = res?.data?.data ?? res?.data ?? res;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;

  return [];
};

export default function AdminOrderPage() {
  const [status, setStatus] = useState("");
  const [userId, setUserId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [savingId, setSavingId] = useState(null);
  const [draftStatus, setDraftStatus] = useState({});

  const {
  data: orders = [],
  isLoading: loading,
  refetch: refetchOrders,
} = useQuery({
  queryKey: ["admin-orders", status, userId, fromDate, toDate],
  queryFn: async () => {
    const params = {
      page: 0,
      size: 100,
    };

    if (status) params.status = status;
    if (userId.trim()) params.userId = userId.trim();
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;

    const res = await orderApi.getAll(params);
    return unwrapList(res);
  },
});

  useEffect(() => {
  const nextDraft = {};

  orders.forEach((order) => {
    nextDraft[order.orderId] = order.status;
  });

  setDraftStatus(nextDraft);
}, [orders]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "PENDING").length,
      shipping: orders.filter((o) => o.status === "SHIPPING").length,
      delivered: orders.filter((o) => o.status === "DELIVERED").length,
      cancelled: orders.filter((o) => o.status === "CANCELLED").length,
    };
  }, [orders]);

  const handleSearch = (e) => {
  e.preventDefault();
  refetchOrders();
};

  const handleReset = () => {
  setStatus("");
  setUserId("");
  setFromDate("");
  setToDate("");
};

  const handleDraftStatusChange = (orderId, nextStatus) => {
    setDraftStatus((prev) => ({
      ...prev,
      [orderId]: nextStatus,
    }));
  };

  const handleUpdateStatus = async (order) => {
    const nextStatus = draftStatus[order.orderId];

    if (!nextStatus || nextStatus === order.status) {
      toast("Trạng thái chưa thay đổi.");
      return;
    }

    setSavingId(order.orderId);

    try {
      await orderApi.updateStatus(order.orderId, {
        status: nextStatus,
      });

      toast.success("Cập nhật trạng thái đơn hàng thành công");
      await refetchOrders();
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      toast.error(
        error?.response?.data?.message || "Cập nhật trạng thái thất bại"
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="admin-order-page">
      <div className="admin-page-title">
        <h2>Quản lý đơn hàng</h2>
        <p>Xem đơn hàng, lọc theo trạng thái và cập nhật trạng thái giao hàng.</p>
      </div>

      <div className="admin-order-stats">
        <div className="admin-order-stat">
          <ShoppingCart size={24} />
          <div>
            <span>Tổng đơn</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="admin-order-stat">
          <Truck size={24} />
          <div>
            <span>Đang giao</span>
            <strong>{stats.shipping}</strong>
          </div>
        </div>

        <div className="admin-order-stat">
          <CheckCircle2 size={24} />
          <div>
            <span>Hoàn thành</span>
            <strong>{stats.delivered}</strong>
          </div>
        </div>

        <div className="admin-order-stat">
          <XCircle size={24} />
          <div>
            <span>Đã hủy</span>
            <strong>{stats.cancelled}</strong>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <form className="admin-order-toolbar" onSubmit={handleSearch}>
          <div className="admin-order-search">
            <Search size={18} />
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Lọc theo User ID..."
            />
          </div>

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {ORDER_STATUS.map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>

          <input
            className="admin-order-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />

          <input
            className="admin-order-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />

          <button type="submit" className="admin-btn primary">
            <Search size={17} />
            Tìm kiếm
          </button>

          <button type="button" className="admin-btn ghost" onClick={handleReset}>
            <RefreshCcw size={17} />
            Làm mới
          </button>
        </form>

        <div className="admin-order-table-wrap">
          <table className="admin-order-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Người nhận</th>
                <th>Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Đổi trạng thái</th>
                <th>Số SP</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="admin-order-empty">
                    Đang tải danh sách đơn hàng...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="admin-order-empty">
                    Không có đơn hàng nào.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.orderId}>
                    <td>
                      <strong>#{order.orderId}</strong>
                      <span className="admin-order-user-id">
                        User ID: {order.userId || order.user?.userId || "—"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-order-receiver">
                        <strong>{order.receiverName || "—"}</strong>
                        <span>{order.receiverPhone || ""}</span>
                      </div>
                    </td>

                    <td>
                      <strong className="admin-order-money">
                        {formatVND(order.finalAmount)}
                      </strong>
                      {Number(order.discountAmount) > 0 && (
                        <span className="admin-order-discount">
                          Giảm {formatVND(order.discountAmount)}
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="admin-order-payment">
                        <strong>{order.paymentMethod || "—"}</strong>
                        <span className={`admin-payment-badge ${order.paymentStatus?.toLowerCase()}`}>
  {paymentLabel[order.paymentStatus] || order.paymentStatus || "—"}
</span>
                      </div>
                    </td>

                    <td>
                      <span className={statusClass[order.status]}>
                        {statusLabel[order.status] || order.status}
                      </span>
                    </td>

                    <td>
                      <select
                        className="admin-order-status-select"
                        value={draftStatus[order.orderId] || order.status || ""}
                        onChange={(e) =>
                          handleDraftStatusChange(order.orderId, e.target.value)
                        }
                      >
                        {ORDER_STATUS.map((s) => (
                          <option key={s} value={s}>
                            {statusLabel[s]}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>{order.itemCount || 0}</td>
                    <td>{order.createdAt || "—"}</td>

                    <td>
                      <button
                        type="button"
                        className="admin-order-save"
                        disabled={savingId === order.orderId}
                        onClick={() => handleUpdateStatus(order)}
                      >
                        <Save size={16} />
                        Lưu
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}