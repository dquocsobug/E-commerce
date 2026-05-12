import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import styles from "./MyPostsPage.module.css";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = (str) => {
  if (!str) return "—";
  return String(str).slice(0, 10).split("-").reverse().join("/");
};

const imageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/images")) return url;
  return `/images/${url}`;
};

const roleLabel = {
  CUSTOMER: "Thành viên",
  LOYAL_CUSTOMER: "Thành viên thân thiết",
  ADMIN: "Quản trị viên",
  WRITER: "Cộng tác viên",
};

const STATUS_TABS = [
  { key: "ALL",      label: "Tất cả"       },
  { key: "DRAFT",    label: "Nháp"         },
  { key: "PENDING",  label: "Chờ duyệt"    },
  { key: "APPROVED", label: "Đã duyệt"     },
  { key: "REJECTED", label: "Bị từ chối"   },
];

const statusConfig = {
  PENDING:  { label: "Chờ duyệt",  cls: "statusPending"  },
  APPROVED: { label: "Đã duyệt",   cls: "statusApproved" },
  REJECTED: { label: "Từ chối",    cls: "statusRejected" },
  DRAFT:    { label: "Nháp",       cls: "statusDraft"    },
};

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmModal({ title, onConfirm, onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Xác nhận xoá</h3>
        <p className={styles.modalDesc}>
          Bạn có chắc muốn xoá bài viết <strong>"{title}"</strong>?
          Hành động này không thể hoàn tác.
        </p>
        <div className={styles.modalActions}>
          <button className={styles.btnSecondary} onClick={onClose}>Huỷ</button>
          <button className={styles.btnDanger} onClick={onConfirm}>Xoá bài viết</button>
        </div>
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, onDelete, onSubmit, vouchers, onCopyVoucher }) {
  const cfg = statusConfig[post.status] || statusConfig.DRAFT;
  const canEdit   = post.status === "DRAFT" || post.status === "REJECTED";
  const canSubmit = post.status === "DRAFT" || post.status === "REJECTED";
  const canDelete = post.status === "DRAFT" || post.status === "REJECTED";
  const rewardVoucher = vouchers?.find((uv) => {
  const code = uv?.voucher?.voucherCode || "";
  return code.includes(`POST10_${post.postId}_`);
});


  return (
    <div className={styles.postCard}>
      <div className={styles.cardImageWrap}>
        {post.mainImageUrl ? (
          <img
  src={imageUrl(post.mainImageUrl)}
  alt={post.title}
  className={styles.cardImage}
  onError={(e) => {
    e.currentTarget.style.display = "none";
  }}
/>
        ) : (
          <div className={styles.cardImagePlaceholder}><span>✎</span></div>
        )}
        <span className={`${styles.statusBadge} ${styles[cfg.cls]}`}>
          <i />{cfg.label}
        </span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span className={styles.cardDate}>{formatDate(post.createdAt)}</span>
          <span className={styles.cardComments}>💬 {post.commentCount}</span>
        </div>

        <h3 className={styles.cardTitle}>{post.title}</h3>

        {post.summary && (
          <p className={styles.cardSummary}>{post.summary}</p>
        )}
        {post.status === "APPROVED" && rewardVoucher && (
  <div className={styles.rewardBox}>
    <p>🎁 Bài viết đã được duyệt. Bạn nhận được voucher:</p>

    <div className={styles.voucherCodeBox}>
      <strong>{rewardVoucher.voucher.voucherCode}</strong>

      <button
        type="button"
        onClick={() => onCopyVoucher(rewardVoucher.voucher.voucherCode)}
      >
        Sao chép
      </button>
    </div>
  </div>
)}

        {post.status === "REJECTED" && post.rejectionReason && (
          <div className={styles.rejectionBox}>
            <span className={styles.rejectionLabel}>Lý do từ chối: </span>
            <span className={styles.rejectionText}>{post.rejectionReason}</span>
          </div>
        )}

        <div className={styles.cardActions}>
          {post.status === "APPROVED" && (
            <Link to={`/posts/${post.postId}`} className={styles.btnView}>
              Xem bài
            </Link>
          )}
          {canEdit && (
            <Link to={`/posts/my/${post.postId}/edit`} className={styles.btnEdit}>
              Chỉnh sửa
            </Link>
          )}
          {canSubmit && (
            <button className={styles.btnSubmit} onClick={() => onSubmit(post)}>
              Gửi duyệt
            </button>
          )}
          {canDelete && (
            <button className={styles.btnDelete} onClick={() => onDelete(post)}>
              Xoá
            </button>
          )}
          {post.status === "PENDING" && (
            <span className={styles.pendingNote}>Đang chờ duyệt...</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyPostsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [myVouchers, setMyVouchers] = useState([]);


  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = (user?.fullName || "U")
    .split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase();

  // GET /posts/my
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const params = { page, size: 9 };
        if (activeTab !== "ALL") params.status = activeTab;
        const [postRes, voucherRes] = await Promise.allSettled([
  axiosClient.get("/posts/my", { params }),
  axiosClient.get("/vouchers/my"),
]);

if (postRes.status === "fulfilled") {
  const data =
    postRes.value?.data?.data ||
    postRes.value?.data ||
    postRes.value;

  setPosts(data?.content || []);
  setTotalPages(data?.totalPages || 1);
  setTotalElements(data?.totalElements || 0);
} else {
  throw postRes.reason;
}

if (voucherRes.status === "fulfilled") {
  const voucherData =
    voucherRes.value?.data?.data ||
    voucherRes.value?.data ||
    voucherRes.value;

  setMyVouchers(Array.isArray(voucherData) ? voucherData : []);
}
      } catch {
        showToast("Không thể tải danh sách bài viết.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [activeTab, page]);

  // PATCH /posts/my/{postId}/submit
  const handleSubmit = async (post) => {
    try {
      await axiosClient.patch(`/posts/my/${post.postId}/submit`);
      setPosts((prev) =>
        prev.map((p) => p.postId === post.postId ? { ...p, status: "PENDING" } : p)
      );
      showToast(`Đã gửi duyệt bài viết "${post.title}".`);
    } catch {
      showToast("Gửi duyệt thất bại. Vui lòng thử lại.", "error");
    }
  };
  
  const handleCopyVoucher = async (code) => {
  try {
    await navigator.clipboard.writeText(code);
    showToast(`Đã sao chép mã voucher: ${code}`);
  } catch {
    showToast("Không thể sao chép voucher.", "error");
  }
};

  // DELETE /posts/my/{postId}
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await axiosClient.delete(`/posts/my/${deleteTarget.postId}`);
      setPosts((prev) => prev.filter((p) => p.postId !== deleteTarget.postId));
      setTotalElements((n) => n - 1);
      showToast(`Đã xoá bài viết "${deleteTarget.title}".`);
    } catch {
      showToast("Xoá thất bại. Vui lòng thử lại.", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
          <span>{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.message}
        </div>
      )}

      {/* Confirm modal */}
      {deleteTarget && (
        <ConfirmModal
          title={deleteTarget.title}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* ── SIDEBAR (y hệt ProfilePage) ── */}
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
          <Link to="/profile" className={location.pathname === "/profile" ? styles.navActive : ""}>
            <span>◉</span>Thông tin cá nhân
          </Link>
          <Link to="/orders" className={location.pathname === "/orders" ? styles.navActive : ""}>
            <span>▣</span>Đơn hàng của tôi
          </Link>
          <Link to="/reviews/my" className={location.pathname === "/reviews/my" ? styles.navActive : ""}>
            <span>☆</span>Đánh giá sản phẩm
          </Link>
          <Link to="/posts/my" className={location.pathname === "/posts/my" ? styles.navActive : ""}>
            <span>✎</span>Bài viết của tôi
          </Link>
        </nav>

        <div className={styles.logout} onClick={handleLogout}>
          <span>↩</span>Đăng xuất
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className={styles.main}>
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Bài viết của tôi</h1>
            <p className={styles.pageDesc}>
              Quản lý các bài viết bạn đã tạo và theo dõi trạng thái duyệt.
            </p>
          </div>
          <Link to="/posts/my/create" className={styles.btnCreate}>
            + Tạo bài viết mới
          </Link>
        </header>

        {/* Tabs */}
        <div className={styles.tabs}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? styles.tabActive : ""}
              onClick={() => { setActiveTab(tab.key); setPage(0); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!loading && (
          <p className={styles.resultCount}>{totalElements} bài viết</p>
        )}

        {/* Grid */}
        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeleton}>
                <div className={styles.skeletonImg} />
                <div className={styles.skeletonBody}>
                  <div className={styles.skeletonLine} style={{ width: "40%" }} />
                  <div className={styles.skeletonLine} style={{ width: "80%" }} />
                  <div className={styles.skeletonLine} style={{ width: "60%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>✎</div>
            <h3 className={styles.emptyTitle}>Chưa có bài viết nào</h3>
            <p className={styles.emptyDesc}>
              Hãy chia sẻ trải nghiệm của bạn với cộng đồng.
            </p>
            <Link to="/posts/my/create" className={styles.btnCreate}>
              Tạo bài viết đầu tiên
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {posts.map((post) => (
              <PostCard
  key={post.postId}
  post={post}
  vouchers={myVouchers}
  onDelete={setDeleteTarget}
  onSubmit={handleSubmit}
  onCopyVoucher={handleCopyVoucher}
/>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <span>‹</span> Trang trước
            </button>
            <div>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={page === i ? styles.pageActive : ""}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Trang tiếp <span>›</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}