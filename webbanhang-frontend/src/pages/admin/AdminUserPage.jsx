import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Search,
  RefreshCcw,
  ShieldCheck,
  UserRound,
  Crown,
  Trash2,
  Save,
  LockOpen,
  X,
  AlertTriangle,
} from "lucide-react";
import { userApi } from "../../api";
import "./AdminUserPage.css";

const ROLES = ["CUSTOMER", "LOYAL_CUSTOMER", "WRITER", "ADMIN"];

const roleLabel = {
  CUSTOMER: "Khách hàng",
  LOYAL_CUSTOMER: "Khách thân thiết",
  WRITER: "Cộng tác viên",
  ADMIN: "Quản trị viên",
};

const roleClass = {
  CUSTOMER: "admin-badge gray",
  LOYAL_CUSTOMER: "admin-badge green",
  WRITER: "admin-badge blue",
  ADMIN: "admin-badge red",
};

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const isCurrentUser = (user) => {
  const currentUser = getCurrentUser();

  return (
    Number(user.userId) === Number(currentUser.userId) ||
    user.email === currentUser.email
  );
};

const unwrapList = (res) => {
  const payload = res?.data?.data ?? res?.data ?? res;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;

  return [];
};

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("") || "U";

const isUserDisabled = (user) => {
  if (user.isActive === false) return true;
  if (user.enabled === false) return true;
  if (user.active === false) return true;
  if (user.status === "DISABLED") return true;
  if (user.status === "INACTIVE") return true;
  if (user.deleted === true) return true;
  return false;
};

export default function AdminUserPage() {
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [draftRoles, setDraftRoles] = useState({});
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    user: null,
    type: "",
  });

  const fetchUsers = async () => {
    setLoading(true);

    try {
      const params = {};
      if (keyword.trim()) params.keyword = keyword.trim();
      if (role) params.role = role;

      const res = await userApi.getAll(params);
      const list = unwrapList(res);

      setUsers(list);

      const nextDraft = {};
      list.forEach((u) => {
        nextDraft[u.userId] = u.role;
      });
      setDraftRoles(nextDraft);
    } catch (error) {
      console.error("Lỗi tải danh sách user:", error);
      toast.error(
        error?.response?.data?.message || "Không tải được danh sách người dùng"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalStats = useMemo(() => {
    return {
      all: users.length,
      customer: users.filter((u) => u.role === "CUSTOMER").length,
      loyal: users.filter((u) => u.role === "LOYAL_CUSTOMER").length,
      admin: users.filter((u) => u.role === "ADMIN").length,
      disabled: users.filter((u) => isUserDisabled(u)).length,
    };
  }, [users]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleRoleDraftChange = (userId, nextRole) => {
    setDraftRoles((prev) => ({
      ...prev,
      [userId]: nextRole,
    }));
  };

  const handleUpdateRole = async (user) => {
    const nextRole = draftRoles[user.userId];

    if (!nextRole || nextRole === user.role) {
      toast("Role chưa thay đổi.");
      return;
    }

    setSavingId(user.userId);

    try {
      await userApi.updateByAdmin(user.userId, {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: nextRole,
      });

      toast.success("Cập nhật role thành công");
      await fetchUsers();
    } catch (error) {
      console.error("Lỗi cập nhật role:", error);
      toast.error(error?.response?.data?.message || "Cập nhật role thất bại");
    } finally {
      setSavingId(null);
    }
  };

  const handleUpgradeLoyal = async (user) => {
    if (user.role === "LOYAL_CUSTOMER") {
      toast("User này đã là khách hàng thân thiết.");
      return;
    }

    setSavingId(user.userId);

    try {
      await userApi.upgradeLoyal({
        userId: user.userId,
      });

      toast.success("Nâng cấp khách hàng thân thiết thành công");
      await fetchUsers();
    } catch (error) {
      console.error("Lỗi nâng cấp loyal:", error);
      toast.error(error?.response?.data?.message || "Nâng cấp thất bại");
    } finally {
      setSavingId(null);
    }
  };

  const openConfirmModal = (user, type) => {
    setConfirmModal({
      open: true,
      user,
      type,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      open: false,
      user: null,
      type: "",
    });
  };

  const handleConfirmStatus = async () => {
    const user = confirmModal.user;
    const type = confirmModal.type;

    if (!user) return;

    setSavingId(user.userId);

    try {
      if (type === "disable") {
        await userApi.disableByAdmin(user.userId);
        toast.success("Đã vô hiệu hóa người dùng");
      }

      if (type === "enable") {
        await userApi.enableByAdmin(user.userId);
        toast.success("Đã mở khóa người dùng");
      }

      closeConfirmModal();
      await fetchUsers();
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái user:", error);
      toast.error(
        error?.response?.data?.message || "Không thể cập nhật trạng thái user"
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <div className="admin-page-title">
        <h2>Quản lý người dùng</h2>
        <p>Danh sách user, cập nhật role, vô hiệu hóa và mở khóa tài khoản.</p>
      </div>

      <div className="admin-user-stats">
        <div className="admin-user-stat">
          <UserRound size={22} />
          <div>
            <span>Tổng user</span>
            <strong>{totalStats.all}</strong>
          </div>
        </div>

        <div className="admin-user-stat">
          <ShieldCheck size={22} />
          <div>
            <span>Khách hàng</span>
            <strong>{totalStats.customer}</strong>
          </div>
        </div>

        <div className="admin-user-stat">
          <Crown size={22} />
          <div>
            <span>Thân thiết</span>
            <strong>{totalStats.loyal}</strong>
          </div>
        </div>

        <div className="admin-user-stat">
          <ShieldCheck size={22} />
          <div>
            <span>Admin</span>
            <strong>{totalStats.admin}</strong>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <form className="admin-user-toolbar" onSubmit={handleSearch}>
          <div className="admin-user-search">
            <Search size={18} />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên, email, số điện thoại..."
            />
          </div>

          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Tất cả role</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel[r]}
              </option>
            ))}
          </select>

          <button type="submit" className="admin-btn primary">
            <Search size={17} />
            Tìm kiếm
          </button>

          <button
            type="button"
            className="admin-btn ghost"
            onClick={() => {
              setKeyword("");
              setRole("");
              setTimeout(fetchUsers, 0);
            }}
          >
            <RefreshCcw size={17} />
            Làm mới
          </button>
        </form>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Điện thoại</th>
                <th>Địa chỉ</th>
                <th>Role hiện tại</th>
                <th>Trạng thái</th>
                <th>Đổi role</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="admin-empty">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="9" className="admin-empty">
                    Không có người dùng nào.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
  const disabled = isUserDisabled(user);
  const currentUserRow = isCurrentUser(user);

  return (
                    <tr
                      key={user.userId}
                      className={disabled ? "user-disabled-row" : ""}
                    >
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">
                            {initials(user.fullName)}
                          </div>
                          <div>
                            <strong>{user.fullName || "Chưa có tên"}</strong>
                            <span>ID: {user.userId}</span>
                          </div>
                        </div>
                      </td>

                      <td>{user.email}</td>
                      <td>{user.phone || "—"}</td>
                      <td>{user.address || "—"}</td>

                      <td>
                        <span className={roleClass[user.role] || "admin-badge gray"}>
                          {roleLabel[user.role] || user.role}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            disabled
                              ? "admin-status-badge disabled"
                              : "admin-status-badge active"
                          }
                        >
                          {disabled ? "Đã vô hiệu hóa" : "Đang hoạt động"}
                        </span>
                      </td>

                      <td>
                        <select
                          className="admin-role-select"
                          value={draftRoles[user.userId] || user.role || ""}
                          onChange={(e) =>
                            handleRoleDraftChange(user.userId, e.target.value)
                          }
                          disabled={disabled || currentUserRow}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {roleLabel[r]}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>{user.createdAt || "—"}</td>

                      <td>
                        <div className="admin-actions">
                          <button
                            type="button"
                            className="admin-icon-action save"
                            title="Lưu role"
                            disabled={savingId === user.userId || disabled || currentUserRow}
                            onClick={() => handleUpdateRole(user)}
                          >
                            <Save size={16} />
                          </button>

                          <button
                            type="button"
                            className="admin-icon-action loyal"
                            title="Nâng cấp khách hàng thân thiết"
                            disabled={
                                        savingId === user.userId ||
                                        user.role === "LOYAL_CUSTOMER" ||
                                        disabled ||
                                        currentUserRow
                                      }
                            onClick={() => handleUpgradeLoyal(user)}
                          >
                            <Crown size={16} />
                          </button>

                          {disabled ? (
                              <button
                                type="button"
                                className="admin-icon-action restore has-tooltip"
                                data-tooltip={
                                  currentUserRow
                                    ? "Không thể thao tác với tài khoản đang đăng nhập"
                                    : "Mở khóa tài khoản"
                                }
                                disabled={savingId === user.userId || currentUserRow}
                                onClick={() => openConfirmModal(user, "enable")}
                              >
                                <LockOpen size={16} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="admin-icon-action danger has-tooltip"
                                data-tooltip={
                                  currentUserRow
                                    ? "Không thể thao tác với tài khoản đang đăng nhập"
                                    : "Vô hiệu hóa tài khoản"
                                }
                                disabled={savingId === user.userId || currentUserRow}
                                onClick={() => openConfirmModal(user, "disable")}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmModal.open && (
        <div className="admin-modal-overlay">
          <div className="admin-confirm-modal">
            <button
              type="button"
              className="admin-modal-close"
              onClick={closeConfirmModal}
            >
              <X size={18} />
            </button>

            <div
              className={
                confirmModal.type === "disable"
                  ? "admin-modal-icon danger"
                  : "admin-modal-icon restore"
              }
            >
              {confirmModal.type === "disable" ? (
                <AlertTriangle size={26} />
              ) : (
                <LockOpen size={26} />
              )}
            </div>

            <h3>
              {confirmModal.type === "disable"
                ? "Vô hiệu hóa người dùng?"
                : "Mở khóa người dùng?"}
            </h3>

            <p>
              {confirmModal.type === "disable"
                ? `Bạn có chắc muốn vô hiệu hóa tài khoản "${
                    confirmModal.user?.fullName || "người dùng này"
                  }" không?`
                : `Bạn có chắc muốn mở khóa tài khoản "${
                    confirmModal.user?.fullName || "người dùng này"
                  }" không?`}
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-btn cancel"
                onClick={closeConfirmModal}
              >
                Hủy
              </button>

              <button
                type="button"
                className={
                  confirmModal.type === "disable"
                    ? "admin-modal-btn danger"
                    : "admin-modal-btn restore"
                }
                onClick={handleConfirmStatus}
                disabled={savingId === confirmModal.user?.userId}
              >
                {savingId === confirmModal.user?.userId
                  ? "Đang xử lý..."
                  : confirmModal.type === "disable"
                  ? "Vô hiệu hóa"
                  : "Mở khóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}