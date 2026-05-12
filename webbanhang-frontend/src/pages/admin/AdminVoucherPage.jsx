import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Search,
  RefreshCcw,
  Plus,
  Save,
  X,
  Pencil,
  Trash2,
  TicketPercent,
  Users,
  CheckCircle2,
  XCircle,
  UserPlus,
  Eye,
} from "lucide-react";
import { voucherApi, userApi } from "../../api";
import "./AdminVoucherPage.css";

const emptyForm = {
  code: "",
  voucherName: "",
  description: "",
  discountPercent: "",
  discountAmount: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  startDate: "",
  endDate: "",
  active: true,
};

const formatVND = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value || 0));
const getVoucherStartDate = (voucher) =>
  voucher.startDate || voucher.StartDate || voucher.validFrom || voucher.createdAt || null;

const getVoucherEndDate = (voucher) =>
  voucher.endDate ||
  voucher.EndDate ||
  voucher.expiredAt ||
  voucher.expireAt ||
  voucher.expiredDate ||
  voucher.expireDate ||
  voucher.expiryDate ||
  voucher.validTo ||
  voucher.validUntil ||
  voucher.toDate ||
  voucher.finishDate ||
  voucher.endTime ||
  null;

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(String(value).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
const unwrapList = (res) => {
  const payload = res?.data?.data ?? res?.data ?? res;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;

  return [];
};

const toInputDateTime = (value) => {
  if (!value) return "";
  return String(value).replace(" ", "T").slice(0, 16);
};

const toBackendDateTime = (value) => {
  if (!value) return null;
  return value.replace("T", " ") + ":00";
};

export default function AdminVoucherPage() {
  const [vouchers, setVouchers] = useState([]);
  const [users, setUsers] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [isActive, setIsActive] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [assignVoucher, setAssignVoucher] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const [viewVoucher, setViewVoucher] = useState(null);
  const [voucherUsers, setVoucherUsers] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);

  const fetchVouchers = async () => {
    setLoading(true);

    try {
      const params = { page: 0, size: 100 };

      if (keyword.trim()) params.keyword = keyword.trim();
      if (isActive !== "") params.isActive = isActive;

      const res = await voucherApi.getAll(params);
      setVouchers(unwrapList(res));
    } catch (error) {
      console.error("Lỗi tải voucher:", error);
      toast.error(error?.response?.data?.message || "Không tải được voucher");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await userApi.getAll({ page: 0, size: 200 });
      setUsers(unwrapList(res));
    } catch (error) {
      console.error("Lỗi tải users:", error);
    }
  };

  useEffect(() => {
    fetchVouchers();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(
    () => ({
      total: vouchers.length,
      active: vouchers.filter((v) => v.active || v.isActive).length,
      inactive: vouchers.filter((v) => !(v.active || v.isActive)).length,
    }),
    [vouchers]
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingVoucher(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setEditingVoucher(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (voucher) => {
    setEditingVoucher(voucher);
    setForm({
      code: voucher.code || voucher.voucherCode || "",
      voucherName: voucher.voucherName || voucher.name || "",
      description: voucher.description || "",
      discountPercent: voucher.discountPercent || "",
      discountAmount: voucher.discountAmount || "",
      minOrderAmount: voucher.minOrderAmount || "",
      maxDiscountAmount: voucher.maxDiscountAmount || "",
      startDate: toInputDateTime(getVoucherStartDate(voucher)),
endDate: toInputDateTime(getVoucherEndDate(voucher)),
      active: Boolean(voucher.active ?? voucher.isActive),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!form.code.trim()) {
      toast.error("Vui lòng nhập mã voucher");
      return false;
    }

    if (!form.voucherName.trim()) {
      toast.error("Vui lòng nhập tên voucher");
      return false;
    }

    if (!form.discountPercent && !form.discountAmount) {
      toast.error("Vui lòng nhập phần trăm giảm hoặc số tiền giảm");
      return false;
    }

    if (!form.startDate || !form.endDate) {
      toast.error("Vui lòng chọn thời gian bắt đầu và kết thúc");
      return false;
    }

    if (new Date(form.startDate) >= new Date(form.endDate)) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu");
      return false;
    }

    return true;
  };

  const buildPayload = () => ({
    code: form.code.trim(),
    voucherCode: form.code.trim(),
    voucherName: form.voucherName.trim(),
    name: form.voucherName.trim(),
    description: form.description.trim(),
    discountPercent: form.discountPercent ? Number(form.discountPercent) : null,
    discountAmount: form.discountAmount ? Number(form.discountAmount) : null,
    minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
    maxDiscountAmount: form.maxDiscountAmount
      ? Number(form.maxDiscountAmount)
      : null,
    startDate: toBackendDateTime(form.startDate),
    endDate: toBackendDateTime(form.endDate),
    active: form.active,
    isActive: form.active,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    try {
      const payload = buildPayload();

      if (editingVoucher) {
        await voucherApi.update(editingVoucher.voucherId, payload);
        toast.success("Cập nhật voucher thành công");
      } else {
        await voucherApi.create(payload);
        toast.success("Tạo voucher thành công");
      }

      resetForm();
      await fetchVouchers();
    } catch (error) {
      console.error("Lỗi lưu voucher:", error);
      toast.error(error?.response?.data?.message || "Lưu voucher thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (voucher) => {
    const ok = window.confirm(
      `Bạn có chắc muốn xóa voucher "${
        voucher.code || voucher.voucherCode || voucher.voucherName
      }" không?`
    );

    if (!ok) return;

    try {
      await voucherApi.delete(voucher.voucherId);
      toast.success("Đã xóa voucher");
      await fetchVouchers();
    } catch (error) {
      console.error("Lỗi xóa voucher:", error);
      toast.error(error?.response?.data?.message || "Xóa voucher thất bại");
    }
  };

  const openAssignModal = (voucher) => {
    setAssignVoucher(voucher);
    setSelectedUserIds([]);
  };

  const toggleUser = (userId) => {
    const id = String(userId);

    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (!assignVoucher) return;

    if (selectedUserIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 user");
      return;
    }

    try {
      await voucherApi.assign({
        voucherId: assignVoucher.voucherId,
        userIds: selectedUserIds.map(Number),
      });

      toast.success("Cấp voucher thành công");
      setAssignVoucher(null);
      setSelectedUserIds([]);
    } catch (error) {
      console.error("Lỗi cấp voucher:", error);
      toast.error(error?.response?.data?.message || "Cấp voucher thất bại");
    }
  };

  const handleViewUsers = async (voucher) => {
    setViewVoucher(voucher);
    setVoucherUsers([]);
    setViewLoading(true);

    try {
      const res = await voucherApi.getUsers(voucher.voucherId);
      setVoucherUsers(unwrapList(res));
    } catch (error) {
      console.error("Lỗi tải user được cấp voucher:", error);
      toast.error("Không tải được danh sách user được cấp voucher");
    } finally {
      setViewLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVouchers();
  };

  return (
    <div className="admin-voucher-page">
      <div className="admin-page-title">
        <h2>Quản lý voucher</h2>
        <p>Tạo voucher, cấp voucher cho người dùng và theo dõi trạng thái.</p>
      </div>

      <div className="admin-voucher-stats">
        <div className="admin-voucher-stat">
          <TicketPercent size={24} />
          <div>
            <span>Tổng voucher</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="admin-voucher-stat">
          <CheckCircle2 size={24} />
          <div>
            <span>Đang hoạt động</span>
            <strong>{stats.active}</strong>
          </div>
        </div>

        <div className="admin-voucher-stat">
          <XCircle size={24} />
          <div>
            <span>Tạm tắt</span>
            <strong>{stats.inactive}</strong>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="admin-card admin-voucher-form-card">
          <div className="admin-voucher-form-head">
            <div>
              <h3>{editingVoucher ? "Cập nhật voucher" : "Tạo voucher mới"}</h3>
              <p>Thiết lập mã giảm giá dành cho khách hàng.</p>
            </div>

            <button type="button" className="admin-btn ghost" onClick={resetForm}>
              <X size={17} />
              Đóng
            </button>
          </div>

          <form className="admin-voucher-form" onSubmit={handleSubmit}>
            <div className="admin-voucher-group">
              <label>Mã voucher</label>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="VD: TECH10"
              />
            </div>

            <div className="admin-voucher-group">
              <label>Tên voucher</label>
              <input
                name="voucherName"
                value={form.voucherName}
                onChange={handleChange}
                placeholder="Giảm 10% cho đơn hàng"
              />
            </div>

            <div className="admin-voucher-group">
              <label>Giảm theo %</label>
              <input
                name="discountPercent"
                type="number"
                value={form.discountPercent}
                onChange={handleChange}
                placeholder="10"
              />
            </div>

            <div className="admin-voucher-group">
              <label>Giảm tiền cố định</label>
              <input
                name="discountAmount"
                type="number"
                value={form.discountAmount}
                onChange={handleChange}
                placeholder="50000"
              />
            </div>

            <div className="admin-voucher-group">
              <label>Đơn tối thiểu</label>
              <input
                name="minOrderAmount"
                type="number"
                value={form.minOrderAmount}
                onChange={handleChange}
                placeholder="1000000"
              />
            </div>

            <div className="admin-voucher-group">
              <label>Giảm tối đa</label>
              <input
                name="maxDiscountAmount"
                type="number"
                value={form.maxDiscountAmount}
                onChange={handleChange}
                placeholder="200000"
              />
            </div>

            <div className="admin-voucher-group">
              <label>Ngày bắt đầu</label>
              <input
                name="startDate"
                type="datetime-local"
                value={form.startDate}
                onChange={handleChange}
              />
            </div>

            <div className="admin-voucher-group">
              <label>Ngày kết thúc</label>
              <input
                name="endDate"
                type="datetime-local"
                value={form.endDate}
                onChange={handleChange}
              />
            </div>

            <div className="admin-voucher-group span-2">
              <label>Mô tả</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Mô tả điều kiện áp dụng voucher..."
                rows={3}
              />
            </div>

            <div className="admin-voucher-check">
              <label>
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />
                Voucher đang hoạt động
              </label>
            </div>

            <div className="admin-voucher-actions span-2">
              <button type="submit" className="admin-btn primary" disabled={saving}>
                <Save size={17} />
                {saving
                  ? "Đang lưu..."
                  : editingVoucher
                  ? "Lưu thay đổi"
                  : "Tạo voucher"}
              </button>

              <button type="button" className="admin-btn ghost" onClick={resetForm}>
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card">
        <form className="admin-voucher-toolbar" onSubmit={handleSearch}>
          <div className="admin-voucher-search">
            <Search size={18} />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo mã hoặc tên voucher..."
            />
          </div>

          <select value={isActive} onChange={(e) => setIsActive(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Tạm tắt</option>
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
              setIsActive("");
              setTimeout(fetchVouchers, 0);
            }}
          >
            <RefreshCcw size={17} />
            Làm mới
          </button>

          <button type="button" className="admin-btn success" onClick={openCreateForm}>
            <Plus size={17} />
            Tạo voucher
          </button>
        </form>

        <div className="admin-voucher-table-wrap">
          <table className="admin-voucher-table">
            <thead>
              <tr>
                <th>Voucher</th>
                <th>Giảm giá</th>
                <th>Điều kiện</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="admin-voucher-empty">
                    Đang tải danh sách voucher...
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="admin-voucher-empty">
                    Không có voucher nào.
                  </td>
                </tr>
              ) : (
                vouchers.map((voucher) => {
                  const active = voucher.active ?? voucher.isActive;

                  return (
                    <tr key={voucher.voucherId}>
                      <td>
                        <div className="admin-voucher-name">
                          <strong>
                            {voucher.code || voucher.voucherCode || "—"}
                          </strong>
                          <span>
                            {voucher.voucherName || voucher.name || "Voucher"}
                          </span>
                          <p>{voucher.description || "—"}</p>
                        </div>
                      </td>

                      <td>
                        <div className="admin-voucher-discount">
                          {voucher.discountPercent ? (
                            <strong>-{voucher.discountPercent}%</strong>
                          ) : (
                            <strong>{formatVND(voucher.discountAmount)}</strong>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="admin-voucher-condition">
                          <span>
                            Đơn tối thiểu: {formatVND(voucher.minOrderAmount)}
                          </span>
                          <span>
                            Giảm tối đa:{" "}
                            {voucher.maxDiscountAmount
                              ? formatVND(voucher.maxDiscountAmount)
                              : "Không giới hạn"}
                          </span>
                        </div>
                      </td>

                      <td>
  <div className="admin-voucher-time">
    <span>Bắt đầu: {formatDateTime(getVoucherStartDate(voucher))}</span>
    <span>Kết thúc: {formatDateTime(getVoucherEndDate(voucher))}</span>
  </div>
</td>

                      <td>
                        <span
                          className={
                            active
                              ? "admin-voucher-badge active"
                              : "admin-voucher-badge inactive"
                          }
                        >
                          {active ? "Đang hoạt động" : "Tạm tắt"}
                        </span>
                      </td>

                      <td>
                        <div className="admin-voucher-row-actions">
                          <button
                            type="button"
                            className="admin-voucher-action view"
                            title="Xem user được cấp"
                            onClick={() => handleViewUsers(voucher)}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            className="admin-voucher-action assign"
                            title="Cấp voucher cho user"
                            onClick={() => openAssignModal(voucher)}
                          >
                            <UserPlus size={16} />
                          </button>

                          <button
                            type="button"
                            className="admin-voucher-action edit"
                            title="Sửa voucher"
                            onClick={() => openEditForm(voucher)}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            className="admin-voucher-action danger"
                            title="Xóa voucher"
                            onClick={() => handleDelete(voucher)}
                          >
                            <Trash2 size={16} />
                          </button>
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

      {assignVoucher && (
        <div className="admin-voucher-modal-overlay" onClick={() => setAssignVoucher(null)}>
          <div className="admin-voucher-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-voucher-modal-head">
              <div>
                <h3>Cấp voucher cho user</h3>
                <p>{assignVoucher.code || assignVoucher.voucherCode}</p>
              </div>

              <button type="button" onClick={() => setAssignVoucher(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-voucher-user-list">
              {users.map((user) => (
                <label key={user.userId} className="admin-voucher-user-option">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(String(user.userId))}
                    onChange={() => toggleUser(user.userId)}
                  />

                  <div>
                    <strong>{user.fullName}</strong>
                    <span>
                      {user.email} · {user.role}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div className="admin-voucher-modal-actions">
              <button type="button" className="admin-btn primary" onClick={handleAssign}>
                <Save size={17} />
                Cấp voucher
              </button>

              <button
                type="button"
                className="admin-btn ghost"
                onClick={() => setAssignVoucher(null)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {viewVoucher && (
        <div className="admin-voucher-modal-overlay" onClick={() => setViewVoucher(null)}>
          <div className="admin-voucher-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-voucher-modal-head">
              <div>
                <h3>User được cấp voucher</h3>
                <p>{viewVoucher.code || viewVoucher.voucherCode}</p>
              </div>

              <button type="button" onClick={() => setViewVoucher(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-voucher-user-list">
              {viewLoading ? (
                <div className="admin-voucher-empty">Đang tải danh sách user...</div>
              ) : voucherUsers.length === 0 ? (
                <div className="admin-voucher-empty">Chưa có user nào được cấp.</div>
              ) : (
                voucherUsers.map((item) => {
                  const user = item.user || item;

                  return (
                    <div key={user.userId || item.id} className="admin-voucher-user-option">
                      <Users size={18} />
                      <div>
                        <strong>{user.fullName || "—"}</strong>
                        <span>
                          {user.email || "—"} ·{" "}
                          {item.used ? "Đã dùng" : "Chưa dùng"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}