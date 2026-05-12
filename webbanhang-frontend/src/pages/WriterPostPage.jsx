import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import styles from "./CreatePostPage.module.css";

const roleLabel = {
  CUSTOMER: "Thành viên",
  LOYAL_CUSTOMER: "Thành viên thân thiết",
  ADMIN: "Quản trị viên",
  WRITER: "Cộng tác viên",
};

const imageUrl = (url) => {
  if (!url) return "/images/default.png";
  if (url.startsWith("http")) return url;
  return `/images/${url}`;
};

const formatPrice = (n) => Number(n || 0).toLocaleString("vi-VN") + "₫";

function ProductSearchModal({ onSelect, onClose, selectedIds }) {
  const [keyword, setKeyword] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const fetchProducts = async (kw = "") => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/products", {
        params: { keyword: kw || undefined, size: 12 },
      });

      const data = res?.data?.data || res?.data || res;
      setProducts(data?.content || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleKeywordChange = (e) => {
    const val = e.target.value;
    setKeyword(val);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProducts(val);
    }, 350);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Thêm sản phẩm vào bài viết</h3>
          <button className={styles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalSearch}>
          <input
            className={styles.modalSearchInput}
            type="text"
            placeholder="Tìm sản phẩm..."
            value={keyword}
            onChange={handleKeywordChange}
            autoFocus
          />
        </div>

        <div className={styles.modalProductList}>
          {loading ? (
            <div className={styles.modalLoading}>Đang tìm...</div>
          ) : products.length === 0 ? (
            <div className={styles.modalEmpty}>Không tìm thấy sản phẩm</div>
          ) : (
            products.map((p) => {
              const isSelected = selectedIds.includes(p.productId);

              return (
                <button
                  key={p.productId}
                  className={`${styles.modalProductItem} ${
                    isSelected ? styles.modalProductSelected : ""
                  }`}
                  onClick={() => !isSelected && onSelect(p)}
                  disabled={isSelected}
                >
                  <img
                    src={imageUrl(p.mainImageUrl)}
                    alt={p.productName}
                    className={styles.modalProductImg}
                  />

                  <div className={styles.modalProductInfo}>
                    <span className={styles.modalProductName}>
                      {p.productName}
                    </span>
                    <span className={styles.modalProductCat}>
                      {p.categoryName}
                    </span>
                    <span className={styles.modalProductPrice}>
                      {p.discountedPrice
                        ? formatPrice(p.discountedPrice)
                        : formatPrice(p.price)}
                    </span>
                  </div>

                  {isSelected && (
                    <span className={styles.modalProductAdded}>
                      ✓ Đã thêm
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function WriterPostPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
  title: "",
  summary: "",
  content: "",
  mainImageUrl: "",
});

  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const initials = (user?.fullName || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  const selectedProductIds = products.map((p) => p.product.productId);
  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const validate = () => {
    const e = {};

    if (!form.title.trim()) {
      e.title = "Tiêu đề không được để trống.";
    }

    if (!form.content.trim()) {
      e.content = "Nội dung không được để trống.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleImageFileChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setForm((prev) => ({
    ...prev,
    mainImageUrl: file.name,
  }));
};

  const handleAddProduct = (product) => {
    setProducts((prev) => [
      ...prev,
      {
        product,
        note: "",
        displayOrder: prev.length + 1,
      },
    ]);

    setShowProductModal(false);
  };

  const handleRemoveProduct = (productId) => {
    setProducts((prev) =>
      prev
        .filter((item) => item.product.productId !== productId)
        .map((item, index) => ({
          ...item,
          displayOrder: index + 1,
        }))
    );
  };

  const handleProductNoteChange = (productId, note) => {
    setProducts((prev) =>
      prev.map((item) =>
        item.product.productId === productId
          ? { ...item, note }
          : item
      )
    );
  };

  const handleMoveProduct = (index, direction) => {
    setProducts((prev) => {
      const next = [...prev];
      const target = index + direction;

      if (target < 0 || target >= next.length) return prev;

      [next[index], next[target]] = [next[target], next[index]];

      return next.map((item, i) => ({
        ...item,
        displayOrder: i + 1,
      }));
    });
  };

  const buildPayload = () => ({
  title: form.title.trim(),
  summary: form.summary.trim() || undefined,
  content: form.content.trim(),

  images: form.mainImageUrl
    ? [
        {
          imageUrl: form.mainImageUrl.trim(),
          isMain: true,
          displayOrder: 1,
        },
      ]
    : [],

  products: products.map((item) => ({
    productId: item.product.productId,
    note: item.note.trim() || undefined,
    displayOrder: item.displayOrder,
  })),
});

  const handleSaveDraft = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      await axiosClient.post("/posts", buildPayload());
      showToast("Đã lưu bài viết thành công!");
      navigate("/posts/my");
    } catch (err) {
      showToast(
        err?.response?.data?.message ||
          "Lưu bài viết thất bại. Vui lòng thử lại.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndSubmit = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      const res = await axiosClient.post("/posts", buildPayload());
      const data = res?.data?.data || res?.data || res;
      const postId = data?.postId;

      if (postId) {
        await axiosClient.patch(`/posts/my/${postId}/submit`);
      }

      showToast("Đã gửi bài viết để duyệt!");
      navigate("/posts/my");
    } catch (err) {
      showToast(
        err?.response?.data?.message ||
          "Gửi duyệt thất bại. Vui lòng thử lại.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
          <span>{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.message}
        </div>
      )}

      {showProductModal && (
        <ProductSearchModal
          selectedIds={selectedProductIds}
          onSelect={handleAddProduct}
          onClose={() => setShowProductModal(false)}
        />
      )}

      <aside className={styles.sidebar}>
        <div className={styles.userBlock}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{initials}</div>
            <div>
              <h3>{user?.fullName || "Người viết"}</h3>
              <p>{roleLabel[user?.role] || "Cộng tác viên"}</p>
            </div>
          </div>
        </div>

        <nav className={styles.sideNav}>
          <Link to="/writer" className={styles.navActive}>
            <span>✎</span>Tạo bài viết
          </Link>

          <Link to="/posts/my">
            <span>▣</span>Bài viết của tôi
          </Link>

          <Link to="/posts">
            <span>◎</span>Xem bài đã duyệt
          </Link>
        </nav>

        <div className={styles.logout} onClick={handleLogout}>
          <span>↩</span>Đăng xuất
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <Link to="/posts/my" className={styles.backBtn}>
              ← Quay lại
            </Link>

            <div>
              <h1 className={styles.pageTitle}>Trang viết bài</h1>
              <p className={styles.pageDesc}>
                Dành cho cộng tác viên viết nội dung và gắn sản phẩm liên quan.
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              className={styles.btnDraft}
              onClick={handleSaveDraft}
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "💾 Lưu nháp"}
            </button>

            <button
              className={styles.btnSubmit}
              onClick={handleSaveAndSubmit}
              disabled={saving}
            >
              {saving ? "Đang gửi..." : "🚀 Lưu & Gửi duyệt"}
            </button>
          </div>
        </header>

        <div className={styles.formLayout}>
          <div className={styles.formMain}>
            <div className={styles.card}>
              <label className={styles.fieldLabel}>
                Tiêu đề bài viết <span className={styles.required}>*</span>
              </label>

              <input
                className={`${styles.titleInput} ${
                  errors.title ? styles.inputError : ""
                }`}
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Nhập tiêu đề bài viết..."
                maxLength={255}
              />

              <div className={styles.fieldMeta}>
                {errors.title && (
                  <span className={styles.errorMsg}>{errors.title}</span>
                )}
                <span className={styles.charCount}>
                  {form.title.length}/255
                </span>
              </div>
            </div>

            <div className={styles.card}>
              <label className={styles.fieldLabel}>Tóm tắt</label>
              <div className={styles.card}>
  <label className={styles.fieldLabel}>Ảnh bài viết</label>

  <input
    className={styles.titleInput}
    type="text"
    name="mainImageUrl"
    value={form.mainImageUrl}
    onChange={handleChange}
    placeholder="Ví dụ: post-laptop.jpg hoặc https://..."
  />

  <input
    type="file"
    accept="image/*"
    onChange={handleImageFileChange}
    className={styles.imageFileInput}
  />

  {form.mainImageUrl && (
    <div className={styles.imagePreviewBox}>
      <img
        src={imageUrl(form.mainImageUrl)}
        alt="Ảnh bài viết"
        className={styles.imagePreview}
      />
      <p>{form.mainImageUrl}</p>
    </div>
  )}
</div>
              <textarea
                className={styles.summaryInput}
                name="summary"
                value={form.summary}
                onChange={handleChange}
                placeholder="Mô tả ngắn gọn về bài viết..."
                rows={3}
                maxLength={500}
              />

              <div className={styles.fieldMeta}>
                <span />
                <span className={styles.charCount}>
                  {form.summary.length}/500
                </span>
              </div>
            </div>

            <div className={styles.card}>
              <label className={styles.fieldLabel}>
                Nội dung <span className={styles.required}>*</span>
              </label>

              <textarea
                className={`${styles.contentInput} ${
                  errors.content ? styles.inputError : ""
                }`}
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="Viết nội dung bài viết tại đây..."
                rows={16}
              />

              <div className={styles.fieldMeta}>
                {errors.content ? (
                  <span className={styles.errorMsg}>{errors.content}</span>
                ) : (
                  <span className={styles.wordCount}>{wordCount} từ</span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formSide}>
            <div className={styles.card}>
              <div className={styles.sideCardHeader}>
                <label className={styles.fieldLabel}>
                  Sản phẩm trong bài
                </label>

                <button
                  className={styles.btnAddProduct}
                  onClick={() => setShowProductModal(true)}
                  type="button"
                >
                  + Thêm
                </button>
              </div>

              {products.length === 0 ? (
                <div className={styles.productsEmpty}>
                  <span>📦</span>
                  <p>Chưa có sản phẩm nào</p>

                  <button
                    className={styles.btnAddProductOutline}
                    onClick={() => setShowProductModal(true)}
                    type="button"
                  >
                    Thêm sản phẩm
                  </button>
                </div>
              ) : (
                <div className={styles.productList}>
                  {products.map((item, index) => (
                    <div
                      key={item.product.productId}
                      className={styles.productItem}
                    >
                      <div className={styles.productItemTop}>
                        <div className={styles.productItemOrder}>
                          {item.displayOrder}
                        </div>

                        <img
                          src={imageUrl(item.product.mainImageUrl)}
                          alt={item.product.productName}
                          className={styles.productItemImg}
                        />

                        <div className={styles.productItemInfo}>
                          <span className={styles.productItemName}>
                            {item.product.productName}
                          </span>

                          <span className={styles.productItemPrice}>
                            {item.product.discountedPrice
                              ? formatPrice(item.product.discountedPrice)
                              : formatPrice(item.product.price)}
                          </span>
                        </div>

                        <div className={styles.productItemControls}>
                          <button
                            className={styles.moveBtn}
                            onClick={() => handleMoveProduct(index, -1)}
                            disabled={index === 0}
                            title="Lên"
                            type="button"
                          >
                            ↑
                          </button>

                          <button
                            className={styles.moveBtn}
                            onClick={() => handleMoveProduct(index, 1)}
                            disabled={index === products.length - 1}
                            title="Xuống"
                            type="button"
                          >
                            ↓
                          </button>

                          <button
                            className={styles.removeBtn}
                            onClick={() =>
                              handleRemoveProduct(item.product.productId)
                            }
                            title="Xoá"
                            type="button"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <input
                        className={styles.productNoteInput}
                        type="text"
                        placeholder="Ghi chú về sản phẩm..."
                        value={item.note}
                        onChange={(e) =>
                          handleProductNoteChange(
                            item.product.productId,
                            e.target.value
                          )
                        }
                        maxLength={255}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`${styles.card} ${styles.guideCard}`}>
              <h4 className={styles.guideTitle}>📋 Hướng dẫn</h4>

              <ul className={styles.guideList}>
                <li>
                  Trang này dành riêng cho <strong>WRITER</strong> và{" "}
                  <strong>ADMIN</strong>.
                </li>
                <li>
                  Người viết bài <strong>không cần mua hàng 30 ngày</strong>.
                </li>
                <li>
                  Có thể gắn sản phẩm liên quan để tăng tính thuyết phục.
                </li>
                <li>
                  Bài viết sau khi gửi sẽ chờ quản trị viên duyệt.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.bottomActions}>
          <button
            className={styles.btnDraft}
            onClick={handleSaveDraft}
            disabled={saving}
          >
            💾 Lưu nháp
          </button>

          <button
            className={styles.btnSubmit}
            onClick={handleSaveAndSubmit}
            disabled={saving}
          >
            🚀 Lưu & Gửi duyệt
          </button>
        </div>
      </main>
    </div>
  );
}