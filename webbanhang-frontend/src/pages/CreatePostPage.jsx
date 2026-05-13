import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import styles from "./CreatePostPage.module.css";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const roleLabel = {
  CUSTOMER: "Thành viên",
  LOYAL_CUSTOMER: "Thành viên thân thiết",
  ADMIN: "Quản trị viên",
  WRITER: "Cộng tác viên",
};

const formatPrice = (n) => n?.toLocaleString("vi-VN") + "₫";

const fallbackImg =
  "https://placehold.co/400x400/f8fafc/94a3b8?text=No+Image";

const imageUrl = (url) => {
  if (!url) return fallbackImg;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/images")) return url;
  return `/images/${url}`;
};

const parseDate = (value) => {
  if (!value) return null;
  return new Date(value.replace(" ", "T"));
};

const isAfter30Days = (dateValue) => {
  const date = parseDate(dateValue);
  if (!date || Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const diffMs = now - date;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays >= 30;
};

// ─── Product Search Modal ─────────────────────────────────────────────────────
function ProductSearchModal({
  onSelect,
  onClose,
  selectedIds,
  eligibleProductIds,
}) {
  const [keyword, setKeyword] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    const search = async (kw) => {
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
    search(keyword);
  }, []);

  const handleKeywordChange = (e) => {
    const val = e.target.value;
    setKeyword(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get("/products", {
          params: { keyword: val || undefined, size: 12 },
        });
        const data = res?.data?.data || res?.data || res;
        setProducts(data?.content || []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Thêm sản phẩm vào bài viết</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalSearch}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
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
              const isEligible = eligibleProductIds.includes(p.productId);
              const isSelected = selectedIds.includes(p.productId);
              return (
                <button
  key={p.productId}
  className={`${styles.modalProductItem} ${
    isSelected ? styles.modalProductSelected : ""
  }`}
  onClick={() => !isSelected && isEligible && onSelect(p)}
  disabled={isSelected || !isEligible}
>
                  <img
  src={imageUrl(p.mainImageUrl)}
  alt={p.productName}
  className={styles.modalProductImg}
/>
                  <div className={styles.modalProductInfo}>
                    <span className={styles.modalProductName}>{p.productName}</span>
                    <span className={styles.modalProductCat}>{p.categoryName}</span>
                    <span className={styles.modalProductPrice}>
                      {p.discountedPrice ? formatPrice(p.discountedPrice) : formatPrice(p.price)}
                    </span>
                  </div>
                  {isSelected && (
  <span className={styles.modalProductAdded}>✓ Đã thêm</span>
)}

{!isSelected && !isEligible && (
  <span className={styles.modalProductAdded}>
    ⛔ Chưa đủ 30 ngày
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreatePostPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
  title: "",
  summary: "",
  content: "",
  mainImageUrl: "",
});
  const [products, setProducts] = useState([]); // [{product, note, displayOrder}]
  const [showProductModal, setShowProductModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

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

    const {
  data: permissionData = {
    eligibleProductIds: [],
    permissionMessage: "",
  },
  isLoading: checkingPermission,
} = useQuery({
  queryKey: ["create-post-permission"],
  queryFn: async () => {
    const res = await axiosClient.get("/orders/my", {
      params: { page: 0, size: 100 },
    });

    const data = res?.data?.data || res?.data || res;
    const orders = data?.content || [];

    const eligibleOrders = orders.filter(
      (order) =>
        order.status === "DELIVERED" &&
        isAfter30Days(order.createdAt)
    );

    if (eligibleOrders.length === 0) {
      return {
        eligibleProductIds: [],
        permissionMessage:
          "Bạn chỉ được viết bài sau khi mua hàng thành công và đơn hàng đã qua ít nhất 30 ngày.",
      };
    }

    const detailResponses = await Promise.allSettled(
      eligibleOrders.map((order) =>
        axiosClient.get(`/orders/my/${order.orderId}`)
      )
    );

    const productIds = [];

    detailResponses.forEach((result) => {
      if (result.status !== "fulfilled") return;

      const detail =
        result.value?.data?.data ||
        result.value?.data ||
        result.value;

      detail?.orderDetails?.forEach((item) => {
        const productId = item?.product?.productId;
        if (productId) productIds.push(productId);
      });
    });

    const uniqueIds = [...new Set(productIds)];

    if (uniqueIds.length === 0) {
      return {
        eligibleProductIds: [],
        permissionMessage:
          "Không tìm thấy sản phẩm đủ điều kiện để viết bài.",
      };
    }

    return {
      eligibleProductIds: uniqueIds,
      permissionMessage: "",
    };
  },
  retry: 1,
});

const eligibleProductIds = permissionData?.eligibleProductIds || [];
const permissionMessage = permissionData?.permissionMessage || "";


  // Validation
  const validate = () => {
  const e = {};

  if (checkingPermission) {
    e.permission = "Đang kiểm tra điều kiện viết bài.";
  }

  if (eligibleProductIds.length === 0) {
    e.permission =
      permissionMessage ||
      "Bạn chưa có sản phẩm đủ điều kiện viết bài.";
  }

  if (!form.title.trim()) e.title = "Tiêu đề không được để trống.";
  if (!form.content.trim()) e.content = "Nội dung không được để trống.";

  if (products.length === 0) {
    e.products = "Vui lòng chọn ít nhất 1 sản phẩm đã mua đủ 30 ngày.";
  }

  const invalidProduct = products.find(
    (p) => !eligibleProductIds.includes(p.product.productId)
  );

  if (invalidProduct) {
    e.products =
      "Bạn chỉ được viết bài về sản phẩm đã mua thành công sau ít nhất 30 ngày.";
  }

  setErrors(e);
  return Object.keys(e).length === 0;
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((err) => ({ ...err, [name]: "" }));
  };

  const handleImageFileChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setForm((prev) => ({
    ...prev,
    mainImageUrl: file.name,
  }));
};

  // Thêm sản phẩm từ modal
  const handleAddProduct = (product) => {
    setProducts((prev) => [
      ...prev,
      { product, note: "", displayOrder: prev.length + 1 },
    ]);
    setShowProductModal(false);
  };

  // Xoá sản phẩm
  const handleRemoveProduct = (productId) => {
    setProducts((prev) =>
      prev
        .filter((p) => p.product.productId !== productId)
        .map((p, i) => ({ ...p, displayOrder: i + 1 }))
    );
  };

  // Cập nhật note sản phẩm
  const handleProductNoteChange = (productId, note) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.product.productId === productId ? { ...p, note } : p
      )
    );
  };

  // Đổi thứ tự sản phẩm
  const handleMoveProduct = (index, dir) => {
    setProducts((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((p, i) => ({ ...p, displayOrder: i + 1 }));
    });
  };

  // Build payload theo đúng structure backend
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

  products: products.map((p) => ({
    productId: p.product.productId,
    note: p.note.trim() || undefined,
    displayOrder: p.displayOrder,
  })),
});

  // POST /posts — lưu nháp
  const handleSaveDraft = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      const res = await axiosClient.post("/posts", buildPayload());
      const data = res?.data?.data || res?.data || res;
      showToast("Đã lưu nháp thành công!");
      navigate(`/posts/my`);
    } catch {
      showToast("Lưu nháp thất bại. Vui lòng thử lại.", "error");
    } finally {
      setSaving(false);
    }
  };

  // POST /posts + PATCH submit — lưu và gửi duyệt
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
    } catch {
      showToast("Gửi duyệt thất bại. Vui lòng thử lại.", "error");
    } finally {
      setSaving(false);
    }
  };

  const selectedProductIds = products.map((p) => p.product.productId);
  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
          <span>{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.message}
        </div>
      )}

      {/* Product modal */}
      {showProductModal && (
        <ProductSearchModal
  selectedIds={selectedProductIds}
  eligibleProductIds={eligibleProductIds}
  onSelect={handleAddProduct}
  onClose={() => setShowProductModal(false)}
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
          <Link to="/posts/my" className={location.pathname.startsWith("/posts/my") ? styles.navActive : ""}>
            <span>✎</span>Bài viết của tôi
          </Link>
        </nav>

        <div className={styles.logout} onClick={handleLogout}>
          <span>↩</span>Đăng xuất
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className={styles.main}>
        {/* Header */}
                  {checkingPermission && (
  <div className={styles.card}>
    Đang kiểm tra điều kiện viết bài...
  </div>
)}

{!checkingPermission && permissionMessage && (
  <div className={styles.card}>
    ⚠️ {permissionMessage}
  </div>
)}
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <Link to="/posts/my" className={styles.backBtn}>
              ← Quay lại
            </Link>
            <div>
              <h1 className={styles.pageTitle}>Tạo bài viết mới</h1>
              <p className={styles.pageDesc}>
                Chia sẻ trải nghiệm và gợi ý sản phẩm với cộng đồng.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className={styles.headerActions}>
            <button
              className={styles.btnDraft}
              onClick={handleSaveDraft}
              disabled={saving || checkingPermission || eligibleProductIds.length === 0}
            >
              {saving ? "Đang lưu..." : "💾 Lưu nháp"}
            </button>
            <button
              className={styles.btnSubmit}
              onClick={handleSaveAndSubmit}
              disabled={saving || checkingPermission || eligibleProductIds.length === 0}
            >
              {saving ? "Đang gửi..." : "🚀 Lưu & Gửi duyệt"}
            </button>
          </div>
        </header>

        <div className={styles.formLayout}>
          {/* ── Cột trái: nội dung chính ── */}
          <div className={styles.formMain}>

            {/* Tiêu đề */}
            <div className={styles.card}>
              <label className={styles.fieldLabel}>
                Tiêu đề bài viết <span className={styles.required}>*</span>
              </label>
              <input
                className={`${styles.titleInput} ${errors.title ? styles.inputError : ""}`}
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Nhập tiêu đề hấp dẫn..."
                maxLength={255}
              />
              <div className={styles.fieldMeta}>
                {errors.title && <span className={styles.errorMsg}>{errors.title}</span>}
                <span className={styles.charCount}>{form.title.length}/255</span>
              </div>
            </div>

            {/* Tóm tắt */}
            <div className={styles.card}>
              <label className={styles.fieldLabel}>Tóm tắt</label>
              <textarea
                className={styles.summaryInput}
                name="summary"
                value={form.summary}
                onChange={handleChange}
                placeholder="Mô tả ngắn gọn về bài viết (không bắt buộc)..."
                rows={3}
                maxLength={500}
              />
              <div className={styles.fieldMeta}>
                <span />
                <span className={styles.charCount}>{form.summary.length}/500</span>
              </div>
            </div>
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
        onError={(e) => {
          e.currentTarget.src = fallbackImg;
        }}
      />
      <p>{form.mainImageUrl}</p>
    </div>
  )}
</div>
            {/* Nội dung */}
            <div className={styles.card}>
              <label className={styles.fieldLabel}>
                Nội dung <span className={styles.required}>*</span>
              </label>
              <textarea
                className={`${styles.contentInput} ${errors.content ? styles.inputError : ""}`}
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="Viết nội dung bài viết của bạn tại đây..."
                rows={16}
              />
              <div className={styles.fieldMeta}>
                {errors.content
                  ? <span className={styles.errorMsg}>{errors.content}</span>
                  : <span className={styles.wordCount}>{wordCount} từ</span>
                }
              </div>
            </div>
          </div>

          {/* ── Cột phải: sản phẩm ── */}
          <div className={styles.formSide}>
            <div className={styles.card}>
              <div className={styles.sideCardHeader}>
                <label className={styles.fieldLabel}>Sản phẩm trong bài</label>
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
                  >
                    Thêm sản phẩm
                  </button>
                </div>
              ) : (
                <div className={styles.productList}>
                  {products.map((item, index) => (
                    <div key={item.product.productId} className={styles.productItem}>
                      <div className={styles.productItemTop}>
                        <div className={styles.productItemOrder}>{item.displayOrder}</div>
                        <img
                          src={imageUrl(item.product.mainImageUrl)}
                          alt={item.product.productName}
                          className={styles.productItemImg}
                        />
                        <div className={styles.productItemInfo}>
                          <span className={styles.productItemName}>{item.product.productName}</span>
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
                          >↑</button>
                          <button
                            className={styles.moveBtn}
                            onClick={() => handleMoveProduct(index, 1)}
                            disabled={index === products.length - 1}
                            title="Xuống"
                          >↓</button>
                          <button
                            className={styles.removeBtn}
                            onClick={() => handleRemoveProduct(item.product.productId)}
                            title="Xoá"
                          >✕</button>
                        </div>
                      </div>
                      <input
                        className={styles.productNoteInput}
                        type="text"
                        placeholder="Ghi chú về sản phẩm (không bắt buộc)..."
                        value={item.note}
                        onChange={(e) => handleProductNoteChange(item.product.productId, e.target.value)}
                        maxLength={255}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hướng dẫn */}
            <div className={`${styles.card} ${styles.guideCard}`}>
              <h4 className={styles.guideTitle}>📋 Hướng dẫn</h4>
              <ul className={styles.guideList}>
                <li>Bài viết sẽ được lưu dưới dạng <strong>nháp</strong> cho đến khi bạn gửi duyệt.</li>
                <li>Sau khi gửi, quản trị viên sẽ <strong>duyệt trong 1-2 ngày</strong>.</li>
                <li>Bạn có thể thêm <strong>sản phẩm liên quan</strong> để bài viết hữu ích hơn.</li>
                <li>Bài bị từ chối có thể <strong>chỉnh sửa và gửi lại</strong>.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom actions (mobile) */}
        <div className={styles.bottomActions}>
          <button className={styles.btnDraft} onClick={handleSaveDraft} disabled={saving || checkingPermission || eligibleProductIds.length === 0}>
            💾 Lưu nháp
          </button>
          <button className={styles.btnSubmit} onClick={handleSaveAndSubmit} disabled={saving || checkingPermission || eligibleProductIds.length === 0}>
            🚀 Lưu & Gửi duyệt
          </button>
        </div>
      </main>
    </div>
  );
}