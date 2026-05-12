import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  Search,
  RefreshCcw,
  Plus,
  Save,
  X,
  Pencil,
  Trash2,
  Package,
  Boxes,
  BadgePercent,
  FileSpreadsheet,
  Download,
  Eye,
} from "lucide-react";
import { productApi, categoryApi } from "../../api";
import "./AdminProductPage.css";

const fallbackImg =
  "https://placehold.co/500x500/f1f5f9/94a3b8?text=Product";

const getImageUrl = (url) => {
  if (!url) return fallbackImg;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/images")) return url;
  return `/images/${url}`;
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

const emptyForm = {
  productName: "",
  description: "",
  price: "",
  stock: "",
  categoryId: "",
  mainImageUrl: "",
};

export default function AdminProductPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchProducts = async () => {
    setLoading(true);

    try {
      const params = {
        page: 0,
        size: 100,
      };

      if (keyword.trim()) params.keyword = keyword.trim();
      if (categoryId) params.categoryId = categoryId;

      const res = await productApi.getAll(params);
      setProducts(unwrapList(res));
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
      toast.error(
        error?.response?.data?.message || "Không tải được danh sách sản phẩm"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getAll();
      setCategories(unwrapList(res));
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
      toast.error("Không tải được danh mục sản phẩm");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    return {
      total: products.length,
      inStock: products.filter((p) => Number(p.stock) > 0).length,
      onSale: products.filter((p) => Number(p.discountPercent) > 0).length,
    };
  }, [products]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingProduct(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setEditingProduct(product);
    setForm({
      productName: product.productName || "",
      description: product.description || "",
      price: product.price || "",
      stock: product.stock || "",
      categoryId: product.categoryId || "",
      mainImageUrl: product.mainImageUrl || "",
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
    if (!form.productName.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm");
      return false;
    }

    if (!form.price || Number(form.price) <= 0) {
      toast.error("Giá sản phẩm phải lớn hơn 0");
      return false;
    }

    if (!form.stock || Number(form.stock) < 0) {
      toast.error("Tồn kho không hợp lệ");
      return false;
    }

    if (!form.categoryId) {
      toast.error("Vui lòng chọn danh mục");
      return false;
    }

    return true;
  };

  const buildPayload = () => ({
    productName: form.productName.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    stock: Number(form.stock),
    categoryId: Number(form.categoryId),
    mainImageUrl: form.mainImageUrl.trim() || null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    try {
      const payload = buildPayload();

      if (editingProduct) {
        await productApi.update(editingProduct.productId, payload);
        toast.success("Cập nhật sản phẩm thành công");
      } else {
        await productApi.create(payload);
        toast.success("Thêm sản phẩm thành công");
      }

      resetForm();
      await fetchProducts();
    } catch (error) {
      console.error("Lỗi lưu sản phẩm:", error);
      toast.error(error?.response?.data?.message || "Lưu sản phẩm thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const ok = window.confirm(
      `Bạn có chắc muốn ẩn sản phẩm "${product.productName}" không?`
    );

    if (!ok) return;

    try {
      await productApi.delete(product.productId);
      toast.success("Đã ẩn sản phẩm");
      await fetchProducts();
    } catch (error) {
      console.error("Lỗi ẩn sản phẩm:", error);
      toast.error(error?.response?.data?.message || "Ẩn sản phẩm thất bại");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Vui lòng chọn file Excel .xlsx");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setImporting(true);

    try {
      await productApi.importExcel(formData);
      toast.success("Import sản phẩm thành công");
      await fetchProducts();
    } catch (error) {
      console.error("Lỗi import Excel:", error);
      toast.error(error?.response?.data?.message || "Import Excel thất bại");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    const data = [
      {
        productName: "AirPods Pro 2",
        price: 5500000,
        stock: 20,
        categoryId: 1,
        mainImageUrl: "airpods-pro-2.jpg",
        description: "Tai nghe Apple chống ồn chủ động",
      },
      {
        productName: "iPhone 15",
        price: 20000000,
        stock: 10,
        categoryId: 2,
        mainImageUrl: "iphone15.jpg",
        description: "Điện thoại Apple chính hãng",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "mau-import-san-pham.xlsx");
  };

  return (
    <div className="admin-product-page">
      <div className="admin-page-title">
        <h2>Quản lý sản phẩm</h2>
        <p>Thêm, sửa, ẩn sản phẩm và quản lý thông tin sản phẩm.</p>
      </div>

      <div className="admin-product-stats">
        <div className="admin-product-stat">
          <Package size={24} />
          <div>
            <span>Tổng sản phẩm</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="admin-product-stat">
          <Boxes size={24} />
          <div>
            <span>Còn hàng</span>
            <strong>{stats.inStock}</strong>
          </div>
        </div>

        <div className="admin-product-stat">
          <BadgePercent size={24} />
          <div>
            <span>Đang giảm giá</span>
            <strong>{stats.onSale}</strong>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="admin-card admin-product-form-card">
          <div className="admin-product-form-head">
            <div>
              <h3>
                {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
              </h3>
              <p>
                Nhập đầy đủ thông tin sản phẩm. Ảnh dùng theo thư mục
                public/images.
              </p>
            </div>

            <button type="button" className="admin-btn ghost" onClick={resetForm}>
              <X size={17} />
              Đóng
            </button>
          </div>

          <form className="admin-product-form" onSubmit={handleSubmit}>
            <div className="admin-form-group span-2">
              <label>Tên sản phẩm</label>
              <input
                name="productName"
                value={form.productName}
                onChange={handleChange}
                placeholder="Ví dụ: AirPods Pro 2"
              />
            </div>

            <div className="admin-form-group">
              <label>Giá</label>
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                placeholder="5500000"
              />
            </div>

            <div className="admin-form-group">
              <label>Tồn kho</label>
              <input
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                placeholder="50"
              />
            </div>

            <div className="admin-form-group">
              <label>Danh mục</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
              >
                <option value="">Chọn danh mục</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label>Ảnh chính</label>
              <input
                name="mainImageUrl"
                value={form.mainImageUrl}
                onChange={handleChange}
                placeholder="airpods1.jpg"
              />
            </div>

            <div className="admin-form-group span-2">
              <label>Mô tả</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Nhập mô tả sản phẩm..."
                rows={4}
              />
            </div>

            <div className="admin-product-preview">
              <img
                src={getImageUrl(form.mainImageUrl)}
                alt="preview"
                onError={(e) => {
                  e.currentTarget.src = fallbackImg;
                }}
              />
              <div>
                <strong>{form.productName || "Tên sản phẩm"}</strong>
                <span>{formatVND(form.price)}</span>
              </div>
            </div>

            <div className="admin-form-actions span-2">
              <button type="submit" className="admin-btn primary" disabled={saving}>
                <Save size={17} />
                {saving
                  ? "Đang lưu..."
                  : editingProduct
                  ? "Lưu thay đổi"
                  : "Thêm sản phẩm"}
              </button>

              <button type="button" className="admin-btn ghost" onClick={resetForm}>
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card">
        <form className="admin-product-toolbar" onSubmit={handleSearch}>
          <div className="admin-product-search">
            <Search size={18} />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên sản phẩm..."
            />
          </div>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.categoryName}
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
              setCategoryId("");
              setTimeout(fetchProducts, 0);
            }}
          >
            <RefreshCcw size={17} />
            Làm mới
          </button>

          <button type="button" className="admin-btn success" onClick={openCreateForm}>
            <Plus size={17} />
            Thêm sản phẩm
          </button>

          <button
            type="button"
            className="admin-btn excel"
            onClick={() => setShowTemplate(true)}
          >
            <Eye size={17} />
            Xem mẫu
          </button>

          <button
            type="button"
            className="admin-btn excel"
            onClick={handleDownloadTemplate}
          >
            <Download size={17} />
            Tải mẫu Excel
          </button>

          <button
            type="button"
            className="admin-btn excel"
            disabled={importing}
            onClick={() =>
              document.getElementById("product-excel-input")?.click()
            }
          >
            <FileSpreadsheet size={17} />
            {importing ? "Đang import..." : "Import Excel"}
          </button>

          <input
            id="product-excel-input"
            type="file"
            accept=".xlsx"
            style={{ display: "none" }}
            onChange={handleImportExcel}
          />
        </form>

        <div className="admin-product-table-wrap">
          <table className="admin-product-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Giá KM</th>
                <th>Kho</th>
                <th>Đánh giá</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="admin-product-empty">
                    Đang tải danh sách sản phẩm...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="admin-product-empty">
                    Không có sản phẩm nào.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.productId}>
                    <td>
                      <div className="admin-product-cell">
                        <img
                          src={getImageUrl(product.mainImageUrl)}
                          alt={product.productName}
                          onError={(e) => {
                            e.currentTarget.src = fallbackImg;
                          }}
                        />
                        <div>
                          <strong>{product.productName}</strong>
                          <span>ID: {product.productId}</span>
                          <p>{product.description}</p>
                        </div>
                      </div>
                    </td>

                    <td>{product.categoryName || "—"}</td>

                    <td>
                      <strong>{formatVND(product.price)}</strong>
                    </td>

                    <td>
                      {product.discountedPrice &&
                      Number(product.discountedPrice) < Number(product.price) ? (
                        <div>
                          <strong className="admin-product-sale-price">
                            {formatVND(product.discountedPrice)}
                          </strong>
                          <span className="admin-product-discount">
                            -{product.discountPercent || 0}%
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>
                      <span
                        className={
                          Number(product.stock) > 0
                            ? "admin-product-stock ok"
                            : "admin-product-stock empty"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>

                    <td>
                      ⭐ {product.averageRating || 0} ({product.reviewCount || 0})
                    </td>

                    <td>{product.createdAt || "—"}</td>

                    <td>
                      <div className="admin-product-actions">
                        <button
                          type="button"
                          className="admin-product-action edit"
                          onClick={() => openEditForm(product)}
                          title="Sửa sản phẩm"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="admin-product-action danger"
                          onClick={() => handleDelete(product)}
                          title="Ẩn sản phẩm"
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

      {showTemplate && (
        <div className="admin-template-overlay">
          <div className="admin-template-modal">
            <div className="admin-template-head">
              <div>
                <h3>Mẫu file Excel import sản phẩm</h3>
                <p>
                  File Excel cần đúng thứ tự cột bên dưới. Ảnh sản phẩm đặt
                  trong thư mục <strong>public/images</strong>.
                </p>
              </div>

              <button
                type="button"
                className="admin-template-close"
                onClick={() => setShowTemplate(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-template-table-wrap">
              <table className="admin-template-table">
                <thead>
                  <tr>
                    <th>productName</th>
                    <th>price</th>
                    <th>stock</th>
                    <th>categoryId</th>
                    <th>mainImageUrl</th>
                    <th>description</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>AirPods Pro 2</td>
                    <td>5500000</td>
                    <td>20</td>
                    <td>1</td>
                    <td>airpods-pro-2.jpg</td>
                    <td>Tai nghe Apple chống ồn chủ động</td>
                  </tr>

                  <tr>
                    <td>iPhone 15</td>
                    <td>20000000</td>
                    <td>10</td>
                    <td>2</td>
                    <td>iphone15.jpg</td>
                    <td>Điện thoại Apple chính hãng</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="admin-template-note">
              <p>
                Lưu ý: cột <strong>mainImageUrl</strong> chỉ ghi tên ảnh, ví dụ:
                <strong> iphone15.jpg</strong>. Không ghi{" "}
                <strong>/images/</strong>.
              </p>
            </div>

            <div className="admin-template-actions">
              <button
                type="button"
                className="admin-btn ghost"
                onClick={() => setShowTemplate(false)}
              >
                Đóng
              </button>

              <button
                type="button"
                className="admin-btn excel"
                onClick={handleDownloadTemplate}
              >
                <Download size={17} />
                Tải file mẫu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}