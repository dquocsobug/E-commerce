import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { orderApi } from "../api";
import { formatVND } from "../utils/format";
import styles from "./OrderListPage.module.css";
import { useAuth } from "../context/AuthContext";

const roleLabel = {
  CUSTOMER: "Thành viên",
  LOYAL_CUSTOMER: "Thành viên thân thiết",
  ADMIN: "Quản trị viên",
  WRITER: "Cộng tác viên",
};
const fallbackImg =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80";

const statusTabs = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Đang xử lý" },
  { key: "DELIVERED", label: "Đã giao" },
  { key: "CANCELLED", label: "Đã hủy" },
];

const statusLabel = {
  PENDING: "Đang xử lý",
  CONFIRMED: "Đang xử lý",
  PROCESSING: "Đang xử lý",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
  CANCELED: "Đã hủy",
};
const getImageUrl = (url) => {
  if (!url) return "/images/placeholder.png"; // fallback nếu null

  // Nếu backend trả full link thì dùng luôn
  if (url.startsWith("http")) return url;

  // Nếu bạn dùng public/images
  return `/images/${url}`;
};


export default function OrderListPage() {
  const [orders, setOrders] = useState([]);
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [orderDetailsMap, setOrderDetailsMap] = useState({});
  const { user: authUser, logout } = useAuth();
const currentUser = authUser || {};
  const navigate = useNavigate();

  const initials = (currentUser?.fullName || currentUser?.name || "U")
  .split(" ")
  .filter(Boolean)
  .map((w) => w[0])
  .slice(-2)
  .join("")
  .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
  const fetchOrders = async () => {
    try {
      const res = await orderApi.getMyOrders({
        page,
        size: 6,
        status: activeStatus === "ALL" ? undefined : activeStatus,
      });

      const data = res?.data?.data || res?.data || res;
      const list = data?.content || [];

      setOrders(list);
      setTotalPages(data?.totalPages || 1);

      // 🔥 fetch detail từng order để lấy ảnh
      const detailPromises = list.map((o) =>
        orderApi.getOrderById(o.orderId)
      );

      const results = await Promise.allSettled(detailPromises);

      const map = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled") {
          const d = r.value?.data || r.value;
          map[list[i].orderId] = d;
        }
      });

      setOrderDetailsMap(map);

    } catch (err) {
      console.error("Lỗi tải đơn hàng:", err);
    }
  };

  fetchOrders();
}, [activeStatus, page]);

  const filteredOrders = useMemo(() => {
    if (activeStatus === "ALL") return orders;
    return orders.filter((o) => o.status === activeStatus);
  }, [orders, activeStatus]);

  return (
    <div className={styles.page}>
      {/* ── SIDEBAR (giống OrderListPage) ── */}
            <aside className={styles.sidebar}>
              <div className={styles.userBlock}>
                <div className={styles.userInfo}>
                  <div className={styles.avatar}>{initials}</div>
                  <div>
                    <h3>{currentUser?.fullName || "Người dùng"}</h3>
                    <p>{roleLabel[currentUser?.role] || "Thành viên"}</p>
                  </div>
                </div>
                {currentUser?.role === "CUSTOMER" && (
                  <button className={styles.upgradeBtn}>Nâng cấp tài khoản</button>
                )}
              </div>
      
              <nav className={styles.sideNav}>
                <Link to="/profile" className={location.pathname === "/profile" ? styles.navActive : ""}>
                  <span>◉</span>
                  Thông tin cá nhân
                </Link>
                <Link to="/orders" className={location.pathname === "/orders" ? styles.navActive : ""}>
                  <span>▣</span>
                  Đơn hàng của tôi
                </Link>
                <Link to="/reviews/my" className={location.pathname === "/reviews/my" ? styles.navActive : ""}>
                  <span>☆</span>
                  Đánh giá sản phẩm
                </Link>
                <Link to="/posts/my" className={location.pathname === "/posts/my" ? styles.navActive : ""}>
                  <span>✎</span>
                  Bài viết của tôi
                </Link>
              </nav>
      
              <div className={styles.logout} onClick={handleLogout}>
                <span>↩</span>
                Đăng xuất
              </div>
            </aside>

      <main className={styles.main}>
        <header className={styles.pageHeader}>
          <div>
            <h1>Đơn hàng của tôi</h1>
            <p>
              Quản lý các đơn hàng đã giám tuyển và lịch sử mua sắm của bạn tại
              TECH.CURATOR.
            </p>
          </div>

          <div className={styles.tabs}>
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                className={activeStatus === tab.key ? styles.tabActive : ""}
                onClick={() => {
                  setActiveStatus(tab.key);
                  setPage(0);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <div className={styles.orderList}>
          {filteredOrders.length === 0 ? (
            <div className={styles.empty}>Bạn chưa có đơn hàng nào.</div>
          ) : (
            filteredOrders.map((order) => (
  <OrderCard
  key={order.orderId}
  order={order}
  detail={orderDetailsMap[order.orderId]}
/>
))
          )}
        </div>

        <div className={styles.pagination}>
          <button
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <span>‹</span>
            Trang trước
          </button>

          <div>
            {Array.from({ length: Math.min(totalPages, 4) }).map((_, i) => (
              <button
                key={i}
                className={page === i ? styles.pageActive : ""}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Trang tiếp
            <span>›</span>
          </button>
        </div>
      </main>
    </div>
  );
}

function OrderCard({ order, detail }) {
  const firstItem = detail?.orderDetails?.[0];
const product = firstItem?.product;

  const status = order.status || "PENDING";
  const isDelivered = status === "DELIVERED";
  const isCancelled = status === "CANCELLED" || status === "CANCELED";

  return (
    <div className={styles.orderCard}>
      <div className={styles.cardLayout}>
        <div className={styles.cardLeft}>
          <div className={styles.orderMeta}>
            <span className={isCancelled ? styles.orderCodeMuted : styles.orderCode}>
              #{order.orderCode || `TC${order.orderId}`}
            </span>

            <span className={styles.separator}>|</span>

            <span className={styles.orderDate}>
              Đặt ngày {formatDate(order.createdAt)}
            </span>

            <span
              className={`${styles.statusBadge} ${
                isDelivered
                  ? styles.statusDelivered
                  : isCancelled
                  ? styles.statusCancelled
                  : styles.statusProcessing
              }`}
            >
              <i />
              {statusLabel[status] || status}
            </span>
          </div>

          <div className={`${styles.productRow} ${isCancelled ? styles.cancelledRow : ""}`}>
            <div className={styles.productImg}>
              <img
  src={getImageUrl(product?.mainImageUrl)}
  alt={product?.productName || "Sản phẩm"}
  onError={(e) => (e.currentTarget.src = fallbackImg)}
/>
            </div>

            <div>
              <h4>{product?.productName || "Sản phẩm trong đơn hàng"}</h4>
              <p>Số lượng: {firstItem?.quantity || order.itemCount || 1} món</p>

              {!isCancelled ? (
                <div className={styles.fromPost}>
                  <span>☰</span>
                  <p>
                    Đơn hàng từ bài:{" "}
                    <strong>“Gợi ý sản phẩm công nghệ phù hợp”</strong>
                  </p>
                </div>
              ) : (
                <p className={styles.cancelReason}>Đã hủy bởi người dùng</p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.cardRight}>
          <div>
            <p>Tổng thanh toán</p>
            <h2 className={isCancelled ? styles.cancelledPrice : ""}>
              {formatVND(order.finalAmount || order.totalAmount || 0)}
            </h2>
          </div>

          <div className={styles.actions}>
            <Link to={`/orders/${order.orderId}`} className={styles.detailBtn}>
              Xem chi tiết
            </Link>

            {isDelivered && (
              <Link to="/reviews/my" className={styles.reviewBtn}>
                Viết đánh giá
              </Link>
            )}

            {!isDelivered && !isCancelled && (
              <button className={styles.disabledBtn}>Viết đánh giá</button>
            )}

            {isCancelled && (
              <button className={styles.rebuyBtn}>Mua lại</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "--/--/----";
  return String(value).slice(0, 10).split("-").reverse().join("/");
}