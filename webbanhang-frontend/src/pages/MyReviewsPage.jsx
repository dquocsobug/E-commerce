import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import styles from "./MyReviewsPage.module.css";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatPrice = (n) => n?.toLocaleString("vi-VN") + "₫";
const formatDate  = (str) => {
  if (!str) return "—";
  return String(str).slice(0, 10).split("-").reverse().join("/");
};

const getImageUrl = (url) => {
  if (!url) return "/images/default.png";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/images")) return url;
  return `/images/${url}`;
};

const roleLabel = {
  CUSTOMER:        "Thành viên",
  LOYAL_CUSTOMER:  "Thành viên thân thiết",
  ADMIN:           "Quản trị viên",
  WRITER:          "Cộng tác viên",
};

// ─── Star Selector ────────────────────────────────────────────────────────────
function StarSelector({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  const labels  = ["", "Tệ", "Không ổn", "Bình thường", "Tốt", "Xuất sắc"];

  return (
    <div className={styles.starSelector}>
      <div className={styles.starRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            className={`${styles.starBtn} ${i <= display ? styles.starBtnOn : ""}`}
            onMouseEnter={() => !readonly && setHovered(i)}
            onMouseLeave={() => !readonly && setHovered(0)}
            onClick={() => !readonly && onChange(i)}
            disabled={readonly}
            aria-label={`${i} sao`}
          >
            ★
          </button>
        ))}
      </div>
      {!readonly && (
        <span className={styles.starLabel}>
          {labels[display] || "Chọn đánh giá"}
        </span>
      )}
    </div>
  );
}

// ─── Review Form Modal ────────────────────────────────────────────────────────
function ReviewModal({ item, existingReview, onClose, onSaved }) {
  // item: { orderId, product: { productId, productName, mainImageUrl, price } }
  const isEdit = Boolean(existingReview);

  const [rating,  setRating]  = useState(existingReview?.rating  || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (rating === 0) {
    setError("Vui lòng chọn số sao.");
    return;
  }

  try {
    setSaving(true);
    setError("");

    let res;

    if (isEdit) {
      res = await axiosClient.put(`/reviews/${existingReview.reviewId}`, {
        productId: Number(item?.product?.productId),
        rating: Number(rating),
        comment: comment.trim(),
      });
    } else {
      res = await axiosClient.post("/reviews", {
        productId: Number(item?.product?.productId),
        rating: Number(rating),
        comment: comment.trim(),
      });
    }

    const savedReview = res?.data?.data || res?.data || res;

    onSaved(savedReview);
    onClose();
  } catch (err) {
    console.log("REVIEW ERROR:", err?.response?.data || err);

    setError(
      err?.response?.data?.message ||
      err?.message ||
      "Lưu đánh giá thất bại. Vui lòng thử lại."
    );
  } finally {
    setSaving(false);
  }
};

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEdit ? "Cập nhật đánh giá" : "Đánh giá sản phẩm"}
          </h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        {/* Product info */}
        <div className={styles.modalProduct}>
          <img
            src={getImageUrl(item.product.mainImageUrl)}
            alt={item.product.productName}
            className={styles.modalProductImg}
          />
          <div>
            <p className={styles.modalProductName}>{item.product.productName}</p>
            <p className={styles.modalProductPrice}>{formatPrice(item.product.price)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Đánh giá của bạn</label>
            <StarSelector value={rating} onChange={setRating} />
          </div>

          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Nhận xét <span className={styles.optional}>(không bắt buộc)</span></label>
            <textarea
              className={styles.modalTextarea}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm thực tế của bạn về sản phẩm..."
              rows={4}
              maxLength={1000}
            />
            <div className={styles.modalCharCount}>{comment.length}/1000</div>
          </div>

          {error && <p className={styles.modalError}>{error}</p>}

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Huỷ
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Gửi đánh giá"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({ productName, onConfirm, onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Xoá đánh giá</h3>
        <p className={styles.modalDesc}>
          Bạn có chắc muốn xoá đánh giá về <strong>{productName}</strong>?
        </p>
        <div className={styles.modalActions}>
          <button className={styles.btnSecondary} onClick={onClose}>Huỷ</button>
          <button className={styles.btnDanger}    onClick={onConfirm}>Xoá</button>
        </div>
      </div>
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({ review, onEdit, onDelete }) {
  return (
    <div className={styles.reviewCard}>
      <div className={styles.reviewCardLeft}>
        <div className={styles.reviewProductImg}>
          <img
  src={getImageUrl(review.mainImageUrl)}
  alt={review.productName}
/>
        </div>
      </div>

      <div className={styles.reviewCardBody}>
        <Link
          to={`/products/${review.productId}`}
          className={styles.reviewProductName}
        >
          {review.productName}
        </Link>

        <div className={styles.reviewStars}>
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={i <= review.rating ? styles.starOn : styles.starOff}>
              ★
            </span>
          ))}
          <span className={styles.reviewRatingNum}>{review.rating}/5</span>
        </div>

        {review.comment ? (
          <p className={styles.reviewComment}>{review.comment}</p>
        ) : (
          <p className={styles.reviewNoComment}>Không có nhận xét</p>
        )}

        <span className={styles.reviewDate}>{formatDate(review.createdAt)}</span>
      </div>

      <div className={styles.reviewCardActions}>
        <button className={styles.btnEdit} onClick={() => onEdit(review)}>
          ✎ Sửa
        </button>
        <button className={styles.btnDelete} onClick={() => onDelete(review)}>
          Xoá
        </button>
      </div>
    </div>
  );
}

// ─── Deliverable Item (sản phẩm chưa review) ─────────────────────────────────
function DeliverableCard({ item, onReview }) {
  return (
    <div className={styles.deliverableCard}>
      <div className={styles.deliverableImg}>
        <img
  src={getImageUrl(item.product.mainImageUrl)}
  alt={item.product.productName}
/>
      </div>
      <div className={styles.deliverableInfo}>
        <Link to={`/products/${item.product.productId}`} className={styles.deliverableName}>
          {item.product.productName}
        </Link>
        <span className={styles.deliverablePrice}>{formatPrice(item.product.price)}</span>
        <span className={styles.deliverableOrder}>Đơn #{item.orderId}</span>
      </div>
      <button className={styles.btnReview} onClick={() => onReview(item)}>
        ✎ Đánh giá
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyReviewsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Data
  const [myReviews,    setMyReviews]    = useState([]);
  const [deliverables, setDeliverables] = useState([]); // sản phẩm DELIVERED chưa review
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingOrders,  setLoadingOrders]  = useState(true);

  // Modal
  const [reviewModal,  setReviewModal]  = useState(null);  // { item, existingReview? }
  const [deleteTarget, setDeleteTarget] = useState(null);  // review object

  // Tabs
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "reviewed"

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const initials = (user?.fullName || "U")
    .split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase();

  // GET /reviews/my
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoadingReviews(true);
        const res = await axiosClient.get("/reviews/my", {
  params: { page: 0, size: 50 },
});
        const data = res?.data?.data || res?.data || res;
        setMyReviews(data?.content || []);
      } catch {
        showToast("Không thể tải danh sách đánh giá.", "error");
      } finally {
        setLoadingReviews(false);
      }
    };
    fetch();
  }, []);

  // GET /orders/my — lọc DELIVERED, lấy sản phẩm chưa review
  useEffect(() => {
    const fetchDeliverables = async () => {
      try {
        setLoadingOrders(true);
        const res  = await axiosClient.get("/orders/my", {
          params: { page: 0, size: 50, status: "DELIVERED" },
        });
        const data = res?.data?.data || res?.data || res;
        const orders = data?.content || [];

        // Lấy chi tiết từng đơn để có orderDetails
        const detailPromises = orders.map((o) =>
          axiosClient.get(`/orders/my/${o.orderId}`)
            .then((r) => r?.data?.data || r?.data || r)
            .catch(() => null)
        );
        const details = (await Promise.all(detailPromises)).filter(Boolean);

        // Flatten sản phẩm, gắn orderId
        const items = [];
        details.forEach((order) => {
          (order.orderDetails || []).forEach((d) => {
            items.push({ orderId: order.orderId, product: d.product });
          });
        });

        setDeliverables(items);
      } catch {
        // silent — không block trang
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchDeliverables();
  }, []);

  // Sản phẩm chưa review = deliverables mà productId chưa có trong myReviews
  const reviewedIds = myReviews.map((r) => r.productId);
  const pendingItems = deliverables.filter(
    (d) => !reviewedIds.includes(d.product.productId)
  );

  // Khi lưu review thành công
  const handleReviewSaved = (savedReview) => {
    if (!savedReview) return;

    setMyReviews((prev) => {
      const exists = prev.find((r) => r.reviewId === savedReview.reviewId);
      if (exists) {
        return prev.map((r) => r.reviewId === savedReview.reviewId ? savedReview : r);
      }
      return [savedReview, ...prev];
    });
    showToast("Đánh giá đã được lưu thành công!");
  };

  // DELETE /reviews/{reviewId}
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await axiosClient.delete(`/reviews/${deleteTarget.reviewId}`);
      setMyReviews((prev) => prev.filter((r) => r.reviewId !== deleteTarget.reviewId));
      showToast("Đã xoá đánh giá.");
    } catch {
      showToast("Xoá thất bại. Vui lòng thử lại.", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleEditReview = (review) => {
    // Tìm item từ deliverables hoặc dùng review data
    const item = deliverables.find((d) => d.product.productId === review.productId)
      || { orderId: null, product: { productId: review.productId, productName: review.productName, mainImageUrl: review.product?.mainImageUrl, price: 0 } };
    setReviewModal({ item, existingReview: review });
  };

  const loading = loadingReviews || loadingOrders;

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
          <span>{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.message}
        </div>
      )}

      {/* Review modal */}
      {reviewModal && (
        <ReviewModal
          item={reviewModal.item}
          existingReview={reviewModal.existingReview}
          onClose={() => setReviewModal(null)}
          onSaved={handleReviewSaved}
        />
      )}

      {/* Confirm delete */}
      {deleteTarget && (
        <ConfirmDeleteModal
          productName={deleteTarget.productName}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={styles.sidebar}>
        <div className={styles.userBlock}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{initials}</div>
            <div>
              <h3>{user?.fullName || "Người dùng"}</h3>
              <p>{roleLabel[user?.role] || "Thành viên"}</p>
            </div>
          </div>
          {user?.role === "CUSTOMER" && (
            <button className={styles.upgradeBtn}>Nâng cấp tài khoản</button>
          )}
        </div>

        <nav className={styles.sideNav}>
          <Link to="/profile"    className={location.pathname === "/profile"     ? styles.navActive : ""}><span>◉</span>Thông tin cá nhân</Link>
          <Link to="/orders"     className={location.pathname === "/orders"      ? styles.navActive : ""}><span>▣</span>Đơn hàng của tôi</Link>
          <Link to="/reviews/my" className={location.pathname === "/reviews/my"  ? styles.navActive : ""}><span>☆</span>Đánh giá sản phẩm</Link>
          <Link to="/posts/my"   className={location.pathname.startsWith("/posts/my") ? styles.navActive : ""}><span>✎</span>Bài viết của tôi</Link>
        </nav>

        <div className={styles.logout} onClick={handleLogout}>
          <span>↩</span>Đăng xuất
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className={styles.main}>
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Đánh giá sản phẩm</h1>
            <p className={styles.pageDesc}>
              Chia sẻ trải nghiệm về sản phẩm bạn đã mua.
            </p>
          </div>
          {/* Summary badges */}
          <div className={styles.summaryBadges}>
            <div className={styles.summaryBadge}>
              <span className={styles.summaryNum}>{pendingItems.length}</span>
              <span className={styles.summaryLbl}>Chờ đánh giá</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryBadge}>
              <span className={styles.summaryNum}>{myReviews.length}</span>
              <span className={styles.summaryLbl}>Đã đánh giá</span>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={activeTab === "pending" ? styles.tabActive : ""}
            onClick={() => setActiveTab("pending")}
          >
            Chờ đánh giá
            {pendingItems.length > 0 && (
              <span className={styles.tabBadge}>{pendingItems.length}</span>
            )}
          </button>
          <button
            className={activeTab === "reviewed" ? styles.tabActive : ""}
            onClick={() => setActiveTab("reviewed")}
          >
            Đã đánh giá
            {myReviews.length > 0 && (
              <span className={styles.tabBadge}>{myReviews.length}</span>
            )}
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
            <p>Đang tải...</p>
          </div>
        ) : activeTab === "pending" ? (
          /* ── Tab: chờ đánh giá ── */
          pendingItems.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🎉</div>
              <h3 className={styles.emptyTitle}>Bạn đã đánh giá tất cả sản phẩm!</h3>
              <p className={styles.emptyDesc}>
                Các sản phẩm từ đơn hàng đã giao sẽ xuất hiện ở đây.
              </p>
            </div>
          ) : (
            <div className={styles.deliverableList}>
              {pendingItems.map((item) => (
                <DeliverableCard
                  key={`${item.orderId}-${item.product.productId}`}
                  item={item}
                  onReview={(i) => setReviewModal({ item: i })}
                />
              ))}
            </div>
          )
        ) : (
          /* ── Tab: đã đánh giá ── */
          myReviews.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>⭐</div>
              <h3 className={styles.emptyTitle}>Chưa có đánh giá nào</h3>
              <p className={styles.emptyDesc}>
                Mua và nhận hàng để bắt đầu đánh giá sản phẩm.
              </p>
            </div>
          ) : (
            <div className={styles.reviewList}>
              {myReviews.map((review) => (
                <ReviewCard
                  key={review.reviewId}
                  review={review}
                  onEdit={handleEditReview}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}