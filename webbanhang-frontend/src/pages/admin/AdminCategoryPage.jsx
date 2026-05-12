import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FolderTree,
  Package,
  Plus,
  Save,
  X,
  Pencil,
  Trash2,
  RefreshCcw,
} from "lucide-react";
import { categoryApi } from "../../api";
import "./AdminCategoryPage.css";

const emptyForm = {
  categoryName: "",
  description: "",
};

const unwrapList = (res) => {
  const payload = res?.data?.data ?? res?.data ?? res;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;

  return [];
};

export default function AdminCategoryPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);

    try {
      const res = await categoryApi.getAll();
      setCategories(unwrapList(res));
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
      toast.error(error?.response?.data?.message || "Không tải được danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const stats = useMemo(() => {
    const totalProducts = categories.reduce(
      (sum, item) => sum + Number(item.productCount || 0),
      0
    );

    return {
      total: categories.length,
      totalProducts,
    };
  }, [categories]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingCategory(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (category) => {
    setEditingCategory(category);
    setForm({
      categoryName: category.categoryName || "",
      description: category.description || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!form.categoryName.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    try {
      const payload = {
        categoryName: form.categoryName.trim(),
        description: form.description.trim(),
      };

      if (editingCategory) {
        await categoryApi.update(editingCategory.categoryId, payload);
        toast.success("Cập nhật danh mục thành công");
      } else {
        await categoryApi.create(payload);
        toast.success("Thêm danh mục thành công");
      }

      resetForm();
      await fetchCategories();
    } catch (error) {
      console.error("Lỗi lưu danh mục:", error);
      toast.error(error?.response?.data?.message || "Lưu danh mục thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const ok = window.confirm(
      `Bạn có chắc muốn xóa danh mục "${category.categoryName}" không?`
    );

    if (!ok) return;

    try {
      await categoryApi.delete(category.categoryId);
      toast.success("Đã xóa danh mục");
      await fetchCategories();
    } catch (error) {
      console.error("Lỗi xóa danh mục:", error);
      toast.error(
        error?.response?.data?.message ||
          "Xóa thất bại. Có thể danh mục đang chứa sản phẩm."
      );
    }
  };

  return (
    <div className="admin-category-page">
      <div className="admin-page-title">
        <h2>Quản lý danh mục</h2>
        <p>Thêm, sửa và xóa danh mục sản phẩm.</p>
      </div>

      <div className="admin-category-stats">
        <div className="admin-category-stat">
          <FolderTree size={24} />
          <div>
            <span>Tổng danh mục</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="admin-category-stat">
          <Package size={24} />
          <div>
            <span>Tổng sản phẩm</span>
            <strong>{stats.totalProducts}</strong>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="admin-card admin-category-form-card">
          <div className="admin-category-form-head">
            <div>
              <h3>
                {editingCategory ? "Cập nhật danh mục" : "Thêm danh mục mới"}
              </h3>
              <p>Danh mục dùng để phân loại sản phẩm trong website.</p>
            </div>

            <button type="button" className="admin-btn ghost" onClick={resetForm}>
              <X size={17} />
              Đóng
            </button>
          </div>

          <form className="admin-category-form" onSubmit={handleSubmit}>
            <div className="admin-category-form-group">
              <label>Tên danh mục</label>
              <input
                name="categoryName"
                value={form.categoryName}
                onChange={handleChange}
                placeholder="Ví dụ: Tai nghe"
              />
            </div>

            <div className="admin-category-form-group">
              <label>Mô tả</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Nhập mô tả danh mục..."
                rows={4}
              />
            </div>

            <div className="admin-category-form-actions">
              <button type="submit" className="admin-btn primary" disabled={saving}>
                <Save size={17} />
                {saving
                  ? "Đang lưu..."
                  : editingCategory
                  ? "Lưu thay đổi"
                  : "Thêm danh mục"}
              </button>

              <button type="button" className="admin-btn ghost" onClick={resetForm}>
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-category-toolbar">
          <button type="button" className="admin-btn success" onClick={openCreateForm}>
            <Plus size={17} />
            Thêm danh mục
          </button>

          <button type="button" className="admin-btn ghost" onClick={fetchCategories}>
            <RefreshCcw size={17} />
            Làm mới
          </button>
        </div>

        <div className="admin-category-table-wrap">
          <table className="admin-category-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên danh mục</th>
                <th>Mô tả</th>
                <th>Số sản phẩm</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="admin-category-empty">
                    Đang tải danh mục...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="admin-category-empty">
                    Chưa có danh mục nào.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.categoryId}>
                    <td>#{category.categoryId}</td>

                    <td>
                      <div className="admin-category-name">
                        <div className="admin-category-icon">
                          <FolderTree size={18} />
                        </div>
                        <strong>{category.categoryName}</strong>
                      </div>
                    </td>

                    <td>{category.description || "—"}</td>

                    <td>
                      <span className="admin-category-count">
                        {category.productCount || 0}
                      </span>
                    </td>

                    <td>
                      <div className="admin-category-actions">
                        <button
                          type="button"
                          className="admin-category-action edit"
                          onClick={() => openEditForm(category)}
                          title="Sửa danh mục"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="admin-category-action danger"
                          onClick={() => handleDelete(category)}
                          title="Xóa danh mục"
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
    </div>
  );
}