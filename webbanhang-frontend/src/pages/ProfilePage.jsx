import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import styles from "./ProfilePage.module.css";

const roleLabel = {
  CUSTOMER: "Thành viên",
  LOYAL_CUSTOMER: "Thành viên thân thiết",
  ADMIN: "Quản trị viên",
  WRITER: "Cộng tác viên",
};

const formatDate = (str) => {
  if (!str) return "—";
  return String(str).slice(0, 10).split("-").reverse().join("/");
};

// ─── Change Password Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.newPassword !== form.confirmNewPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    try {
      setLoading(true);
      await axiosClient.put("/auth/change-password", form);
      setSuccess(true);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Đổi mật khẩu thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Đổi mật khẩu</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        {success ? (
          <div className={styles.modalSuccess}>
            <div className={styles.successIcon}>✓</div>
            <p>Đổi mật khẩu thành công!</p>
            <button className={styles.btnPrimary} onClick={onClose}>Đóng</button>
          </div>
        ) : (
          <form className={styles.modalForm} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Mật khẩu hiện tại</label>
              <input
                className={styles.fieldInput}
                type="password"
                name="oldPassword"
                value={form.oldPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Mật khẩu mới</label>
              <input
                className={styles.fieldInput}
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Xác nhận mật khẩu mới</label>
              <input
                className={styles.fieldInput}
                type="password"
                name="confirmNewPassword"
                value={form.confirmNewPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>
            {error && <p className={styles.fieldError}>{error}</p>}
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnSecondary} onClick={onClose}>
                Huỷ
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={loading}>
                {loading ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user: authUser, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // GET /users/me
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get("/users/me");
        const data = res?.data?.data || res?.data || res;
        setProfile(data);
        setForm({
          fullName: data.fullName || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      } catch {
        showToast("Không thể tải thông tin cá nhân.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // PUT /users/me
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await axiosClient.put("/users/me", form);
      const updated = res?.data?.data || res?.data || res;
      setProfile(updated);
      updateUser({ ...authUser, ...updated });
      setEditing(false);
      showToast("Cập nhật thông tin thành công!");
    } catch {
      showToast("Cập nhật thất bại. Vui lòng thử lại.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      fullName: profile?.fullName || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
    });
    setEditing(false);
  };

  const initials = (profile?.fullName || authUser?.fullName || "U")
    .split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase();

  const currentUser = profile || authUser;

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
          <span>{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.message}
        </div>
      )}

      {/* Password modal */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

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

      {/* ── MAIN ── */}
      <main className={styles.main}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Thông tin cá nhân</h1>
          <p className={styles.pageDesc}>
            Quản lý thông tin hồ sơ để bảo mật tài khoản của bạn.
          </p>
        </header>

        {loading ? (
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
            <p>Đang tải...</p>
          </div>
        ) : (
          <div className={styles.content}>

            {/* Avatar card */}
            <div className={styles.avatarCard}>
              <div className={styles.avatarCircle}>{initials}</div>
              <div className={styles.avatarInfo}>
                <h2 className={styles.avatarName}>{profile?.fullName}</h2>
                <span className={styles.roleBadge}>
                  {roleLabel[profile?.role] || profile?.role}
                </span>
              </div>
              <div className={styles.avatarMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Email</span>
                  <span className={styles.metaValue}>{profile?.email}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Ngày tạo</span>
                  <span className={styles.metaValue}>{formatDate(profile?.createdAt)}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Mã thành viên</span>
                  <span className={styles.metaValue}>#{profile?.userId}</span>
                </div>
              </div>
            </div>

            {/* Edit form */}
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <h3 className={styles.formCardTitle}>Thông tin chi tiết</h3>
                {!editing && (
                  <button className={styles.editBtn} onClick={() => setEditing(true)}>
                    ✎ Chỉnh sửa
                  </button>
                )}
              </div>

              <form onSubmit={handleSave}>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Họ và tên</label>
                    {editing ? (
                      <input
                        className={styles.fieldInput}
                        type="text"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        required
                      />
                    ) : (
                      <div className={styles.fieldValue}>{profile?.fullName || "—"}</div>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Email</label>
                    <div className={`${styles.fieldValue} ${styles.fieldValueMuted}`}>
                      {profile?.email}
                      <span className={styles.readonlyTag}>Không thể thay đổi</span>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Số điện thoại</label>
                    {editing ? (
                      <input
                        className={styles.fieldInput}
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="0900000000"
                      />
                    ) : (
                      <div className={styles.fieldValue}>{profile?.phone || "—"}</div>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Địa chỉ</label>
                    {editing ? (
                      <input
                        className={styles.fieldInput}
                        type="text"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Số nhà, đường, thành phố..."
                      />
                    ) : (
                      <div className={styles.fieldValue}>{profile?.address || "—"}</div>
                    )}
                  </div>
                </div>

                {editing && (
                  <div className={styles.formActions}>
                    <button type="button" className={styles.btnSecondary} onClick={handleCancel}>
                      Huỷ
                    </button>
                    <button type="submit" className={styles.btnPrimary} disabled={saving}>
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Security card */}
            <div className={styles.securityCard}>
              <div>
                <h4 className={styles.securityTitle}>Mật khẩu</h4>
                <p className={styles.securityDesc}>Bảo vệ tài khoản bằng mật khẩu mạnh.</p>
              </div>
              <button className={styles.btnOutline} onClick={() => setShowPasswordModal(true)}>
                Đổi mật khẩu
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}