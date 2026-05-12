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
  BadgePercent,
  Package,
  CalendarDays,
  Link2,
  Unlink,
} from "lucide-react";
import { promotionApi, productApi } from "../../api";
import "./AdminPromotionPage.css";

const emptyForm = {
  promotionName: "",
  discountPercent: "",
  discountAmount: "",
  targetRole: "",
  startDate: "",
  endDate: "",
  active: true,
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

const toInputDateTime = (value) => {
  if (!value) return "";
  return String(value).replace(" ", "T").slice(0, 16);
};

const toBackendDateTime = (value) => {
  if (!value) return null;
  return value.replace("T", " ") + ":00";
};

export default function AdminPromotionPage() {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [assignPromotion, setAssignPromotion] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  const fetchPromotions = async () => {
    setLoading(true);

    try {
      const params = {
        page: 0,
        size: 100,
      };

      if (keyword.trim()) params.keyword = keyword.trim();

      const res = await promotionApi.getAll(params);
      setPromotions(unwrapList(res));
    } catch (error) {
      console.error("Lỗi tải khuyến mãi:", error);
      toast.error(
        error?.response?.data?.message || "Không tải được danh sách khuyến mãi"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await productApi.getAll({ page: 0, size: 200 });
      setProducts(unwrapList(res));
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
      toast.error("Không tải được danh sách sản phẩm");
    }
  };

  useEffect(() => {
    fetchPromotions();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    return {
      total: promotions.length,
      active: promotions.filter((p) => p.active).length,
      inactive: promotions.filter((p) => !p.active).length,
      assignedProducts: promotions.reduce(
        (sum, p) => sum + (p.products?.length || 0),
        0
      ),
    };
  }, [promotions]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingPromotion(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setEditingPromotion(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (promotion) => {
    setEditingPromotion(promotion);
    setForm({
      promotionName: promotion.promotionName || "",
      discountPercent: promotion.discountPercent || "",
      discountAmount: promotion.discountAmount || "",
      targetRole: promotion.targetRole || "",
      startDate: toInputDateTime(promotion.startDate),
      endDate: toInputDateTime(promotion.endDate),
      active: Boolean(promotion.active),
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
    if (!form.promotionName.trim()) {
      toast.error("Vui lòng nhập tên khuyến mãi");
      return false;
    }

    if (!form.discountPercent && !form.discountAmount) {
      toast.error("Vui lòng nhập phần trăm giảm hoặc số tiền giảm");
      return false;
    }

    if (form.discountPercent && Number(form.discountPercent) <= 0) {
      toast.error("Phần trăm giảm phải lớn hơn 0");
      return false;
    }

    if (form.discountAmount && Number(form.discountAmount) <= 0) {
      toast.error("Số tiền giảm phải lớn hơn 0");
      return false;
    }

    if (!form.startDate || !form.endDate) {
      toast.error("Vui lòng chọn ngày bắt đầu và ngày kết thúc");
      return false;
    }

    if (new Date(form.startDate) >= new Date(form.endDate)) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu");
      return false;
    }

    return true;
  };

  const buildPayload = () => ({
    promotionName: form.promotionName.trim(),
    discountPercent: form.discountPercent
      ? Number(form.discountPercent)
      : null,
    discountAmount: form.discountAmount ? Number(form.discountAmount) : null,
    targetRole: form.targetRole || null,
    startDate: toBackendDateTime(form.startDate),
    endDate: toBackendDateTime(form.endDate),
    active: form.active,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    try {
      const payload = buildPayload();

      if (editingPromotion) {
        await promotionApi.update(editingPromotion.promotionId, payload);
        toast.success("Cập nhật khuyến mãi thành công");
      } else {
        await promotionApi.create(payload);
        toast.success("Tạo khuyến mãi thành công");
      }

      resetForm();
      await fetchPromotions();
    } catch (error) {
      console.error("Lỗi lưu khuyến mãi:", error);
      toast.error(error?.response?.data?.message || "Lưu khuyến mãi thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (promotion) => {
    const ok = window.confirm(
      `Bạn có chắc muốn xóa khuyến mãi "${promotion.promotionName}" không?`
    );

    if (!ok) return;

    try {
      await promotionApi.delete(promotion.promotionId);
      toast.success("Đã xóa khuyến mãi");
      await fetchPromotions();
    } catch (error) {
      console.error("Lỗi xóa khuyến mãi:", error);
      toast.error(error?.response?.data?.message || "Xóa khuyến mãi thất bại");
    }
  };

  const openAssignModal = (promotion) => {
    setAssignPromotion(promotion);
    setSelectedProductIds(
      promotion.products?.map((p) => String(p.productId)) || []
    );
  };

  const toggleProduct = (productId) => {
    const id = String(productId);

    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAssignProducts = async () => {
    if (!assignPromotion) return;

    if (selectedProductIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 sản phẩm");
      return;
    }

    try {
      await promotionApi.assignProducts({
        promotionId: assignPromotion.promotionId,
        productIds: selectedProductIds.map(Number),
      });

      toast.success("Đã gán sản phẩm vào khuyến mãi");
      setAssignPromotion(null);
      setSelectedProductIds([]);
      await fetchPromotions();
    } catch (error) {
      console.error("Lỗi gán sản phẩm:", error);
      toast.error(error?.response?.data?.message || "Gán sản phẩm thất bại");
    }
  };

  const handleRemoveProduct = async (promotion, product) => {
    const ok = window.confirm(
      `Gỡ sản phẩm "${product.productName}" khỏi khuyến mãi "${promotion.promotionName}"?`
    );

    if (!ok) return;

    try {
      await promotionApi.removeProduct(promotion.promotionId, product.productId);
      toast.success("Đã gỡ sản phẩm khỏi khuyến mãi");
      await fetchPromotions();
    } catch (error) {
      console.error("Lỗi gỡ sản phẩm:", error);
      toast.error(error?.response?.data?.message || "Gỡ sản phẩm thất bại");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPromotions();
  };

  return (
    <div className="admin-promotion-page">
      <div className="admin-page-title">
        <h2>Quản lý khuyến mãi</h2>
        <p>Tạo chương trình giảm giá và gán sản phẩm vào khuyến mãi.</p>
      </div>

      <div className="admin-promotion-stats">
        <div className="admin-promotion-stat">
          <BadgePercent size={24} />
          <div>
            <span>Tổng khuyến mãi</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="admin-promotion-stat">
          <CalendarDays size={24} />
          <div>
            <span>Đang hoạt động</span>
            <strong>{stats.active}</strong>
          </div>
        </div>

        <div className="admin-promotion-stat">
          <X size={24} />
          <div>
            <span>Không hoạt động</span>
            <strong>{stats.inactive}</strong>
          </div>
        </div>

        <div className="admin-promotion-stat">
          <Package size={24} />
          <div>
            <span>Sản phẩm đã gán</span>
            <strong>{stats.assignedProducts}</strong>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="admin-card admin-promotion-form-card">
          <div className="admin-promotion-form-head">
            <div>
              <h3>
                {editingPromotion ? "Cập nhật khuyến mãi" : "Tạo khuyến mãi mới"}
              </h3>
              <p>Thiết lập phần trăm giảm hoặc số tiền giảm cho sản phẩm.</p>
            </div>

            <button type="button" className="admin-btn ghost" onClick={resetForm}>
              <X size={17} />
              Đóng
            </button>
          </div>

          <form className="admin-promotion-form" onSubmit={handleSubmit}>
            <div className="admin-promotion-group span-2">
              <label>Tên khuyến mãi</label>
              <input
                name="promotionName"
                value={form.promotionName}
                onChange={handleChange}
                placeholder="Ví dụ: Giảm giá hè"
              />
            </div>

            <div className="admin-promotion-group">
              <label>Phần trăm giảm (%)</label>
              <input
                name="discountPercent"
                type="number"
                value={form.discountPercent}
                onChange={handleChange}
                placeholder="10"
              />
            </div>

            <div className="admin-promotion-group">
              <label>Số tiền giảm</label>
              <input
                name="discountAmount"
                type="number"
                value={form.discountAmount}
                onChange={handleChange}
                placeholder="100000"
              />
            </div>

            <div className="admin-promotion-group">
              <label>Role áp dụng</label>
              <select
                name="targetRole"
                value={form.targetRole}
                onChange={handleChange}
              >
                <option value="">Tất cả người dùng</option>
                <option value="CUSTOMER">Khách hàng</option>
                <option value="LOYAL_CUSTOMER">Khách thân thiết</option>
              </select>
            </div>

            <div className="admin-promotion-check">
              <label>
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />
                Đang hoạt động
              </label>
            </div>

            <div className="admin-promotion-group">
              <label>Ngày bắt đầu</label>
              <input
                name="startDate"
                type="datetime-local"
                value={form.startDate}
                onChange={handleChange}
              />
            </div>

            <div className="admin-promotion-group">
              <label>Ngày kết thúc</label>
              <input
                name="endDate"
                type="datetime-local"
                value={form.endDate}
                onChange={handleChange}
              />
            </div>

            <div className="admin-promotion-actions span-2">
              <button type="submit" className="admin-btn primary" disabled={saving}>
                <Save size={17} />
                {saving
                  ? "Đang lưu..."
                  : editingPromotion
                  ? "Lưu thay đổi"
                  : "Tạo khuyến mãi"}
              </button>

              <button type="button" className="admin-btn ghost" onClick={resetForm}>
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card">
        <form className="admin-promotion-toolbar" onSubmit={handleSearch}>
          <div className="admin-promotion-search">
            <Search size={18} />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên khuyến mãi..."
            />
          </div>

          <button type="submit" className="admin-btn primary">
            <Search size={17} />
            Tìm kiếm
          </button>

          <button
            type="button"
            className="admin-btn ghost"
            onClick={() => {
              setKeyword("");
              setTimeout(fetchPromotions, 0);
            }}
          >
            <RefreshCcw size={17} />
            Làm mới
          </button>

          <button type="button" className="c-button" onClick={openCreateForm}>
  <span className="c-main">
    <span className="c-ico">
      <span className="c-blur"></span>
      <span className="ico-text">+</span>
    </span>
    Tạo khuyến mãi
  </span>
</button>
        </form>

        <div className="admin-promotion-table-wrap">
          <table className="admin-promotion-table">
            <thead>
              <tr>
                <th>Khuyến mãi</th>
                <th>Giảm giá</th>
                <th>Role</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Sản phẩm áp dụng</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="admin-promotion-empty">
                    Đang tải danh sách khuyến mãi...
                  </td>
                </tr>
              ) : promotions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="admin-promotion-empty">
                    Không có khuyến mãi nào.
                  </td>
                </tr>
              ) : (
                promotions.map((promotion) => (
                  <tr key={promotion.promotionId}>
                    <td>
                      <div className="admin-promotion-name">
                        <strong>{promotion.promotionName}</strong>
                        <span>ID: {promotion.promotionId}</span>
                      </div>
                    </td>

                    <td>
                      <div className="admin-promotion-discount">
                        {promotion.discountPercent ? (
                          <strong>-{promotion.discountPercent}%</strong>
                        ) : (
                          <strong>{formatVND(promotion.discountAmount)}</strong>
                        )}
                      </div>
                    </td>

                    <td>{promotion.targetRole || "Tất cả"}</td>

                    <td>
                      <div className="admin-promotion-time">
                        <span>{promotion.startDate || "—"}</span>
                        <span>{promotion.endDate || "—"}</span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={
                          promotion.active
                            ? "admin-promotion-badge active"
                            : "admin-promotion-badge inactive"
                        }
                      >
                        {promotion.active ? "Đang hoạt động" : "Tạm tắt"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-promotion-products">
                        {promotion.products?.length > 0 ? (
                          promotion.products.map((product) => (
                            <span key={product.productId}>
                              {product.productName}
                              <button
                                type="button"
                                title="Gỡ sản phẩm"
                                onClick={() =>
                                  handleRemoveProduct(promotion, product)
                                }
                              >
                                <Unlink size={12} />
                              </button>
                            </span>
                          ))
                        ) : (
                          <em>Chưa gán sản phẩm</em>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="admin-promotion-row-actions">
                        <button
                          type="button"
                          className="admin-promotion-action assign"
                          title="Gán sản phẩm"
                          onClick={() => openAssignModal(promotion)}
                        >
                          <Link2 size={16} />
                        </button>

                        <button
                          type="button"
                          className="admin-promotion-action edit"
                          title="Sửa khuyến mãi"
                          onClick={() => openEditForm(promotion)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="admin-promotion-action danger"
                          title="Xóa khuyến mãi"
                          onClick={() => handleDelete(promotion)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {assignPromotion && (
        <div
          className="admin-promotion-modal-overlay"
          onClick={() => setAssignPromotion(null)}
        >
          <div
            className="admin-promotion-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-promotion-modal-head">
              <div>
                <h3>Gán sản phẩm vào khuyến mãi</h3>
                <p>{assignPromotion.promotionName}</p>
              </div>

              <button type="button" onClick={() => setAssignPromotion(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-promotion-product-list">
              {products.map((product) => (
                <label
                  key={product.productId}
                  className="admin-promotion-product-option"
                >
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(String(product.productId))}
                    onChange={() => toggleProduct(product.productId)}
                  />

                  <div>
                    <strong>{product.productName}</strong>
                    <span>
                      {product.categoryName || "—"} · {formatVND(product.price)}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div className="admin-promotion-modal-actions">
              <button
                type="button"
                className="admin-btn primary"
                onClick={handleAssignProducts}
              >
                <Save size={17} />
                Lưu sản phẩm
              </button>

              <button
                type="button"
                className="admin-btn ghost"
                onClick={() => setAssignPromotion(null)}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}