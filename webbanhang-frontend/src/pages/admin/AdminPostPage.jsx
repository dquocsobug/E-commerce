import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Search,
  RefreshCcw,
  Eye,
  CheckCircle2,
  XCircle,
  Trash2,
  Newspaper,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Package,
  MessageCircle,
  X,
  Plus,
  Pencil,
  Save,
} from "lucide-react";
import { postApi, productApi } from "../../api";
import "./AdminPostPage.css";

const POST_STATUS = ["DRAFT", "PENDING", "APPROVED", "REJECTED"];

const statusLabel = {
  DRAFT: "Bản nháp",
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

const statusClass = {
  DRAFT: "admin-post-badge draft",
  PENDING: "admin-post-badge pending",
  APPROVED: "admin-post-badge approved",
  REJECTED: "admin-post-badge rejected",
};

const fallbackImg = "https://placehold.co/900x560/f1f5f9/94a3b8?text=Post";

const emptyForm = {
  title: "",
  summary: "",
  content: "",
  mainImageUrl: "",
  productId: "",
  productNote: "",
};

const getImageUrl = (url) => {
  if (!url) return fallbackImg;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/images")) return url;
  return `/images/${url}`;
};

const unwrapList = (res) => {
  const payload = res?.data?.data ?? res?.data ?? res;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;

  return [];
};

const unwrapObject = (res) => res?.data?.data ?? res?.data ?? res ?? null;

const shortText = (text, max = 120) => {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

export default function AdminPostPage() {
  const [posts, setPosts] = useState([]);
  const [products, setProducts] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [selectedPost, setSelectedPost] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [rejectPost, setRejectPost] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formSaving, setFormSaving] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
  open: false,
  type: "",
  post: null,
});

  const fetchPosts = async () => {
    setLoading(true);

    try {
      const params = { page: 0, size: 100 };

      if (keyword.trim()) params.keyword = keyword.trim();
      if (status) params.status = status;

      const res = await postApi.getAllAdmin(params);
      setPosts(unwrapList(res));
    } catch (error) {
      console.error("Lỗi tải bài viết admin:", error);
      toast.error(
        error?.response?.data?.message || "Không tải được danh sách bài viết"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await productApi.getAll({ page: 0, size: 100 });
      setProducts(unwrapList(res));
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    return {
      total: posts.length,
      pending: posts.filter((p) => p.status === "PENDING").length,
      approved: posts.filter((p) => p.status === "APPROVED").length,
      rejected: posts.filter((p) => p.status === "REJECTED").length,
    };
  }, [posts]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleReset = () => {
    setKeyword("");
    setStatus("");
    setTimeout(fetchPosts, 0);
  };

  const openCreateForm = () => {
    setEditingPost(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingPost(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const openEditForm = async (post) => {
    setActionId(post.postId);

    try {
      const res = await postApi.getById(post.postId);
      const data = unwrapObject(res);

      const mainImage =
        data?.mainImageUrl ||
        data?.images?.find((img) => img.isMain)?.imageUrl ||
        data?.images?.[0]?.imageUrl ||
        "";

      const firstProduct = data?.products?.[0];

      setEditingPost(data);
      setForm({
        title: data?.title || "",
        summary: data?.summary || "",
        content: data?.content || "",
        mainImageUrl: mainImage,
        productId: firstProduct?.product?.productId || "",
        productNote: firstProduct?.note || "",
      });
      setShowForm(true);
    } catch (error) {
      console.error("Lỗi tải bài viết để sửa:", error);
      toast.error(
        error?.response?.data?.message || "Không tải được dữ liệu bài viết"
      );
    } finally {
      setActionId(null);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildPostPayload = () => {
    const images = form.mainImageUrl.trim()
      ? [
          {
            imageUrl: form.mainImageUrl.trim(),
            isMain: true,
            displayOrder: 1,
          },
        ]
      : [];

    const products = form.productId
      ? [
          {
            productId: Number(form.productId),
            displayOrder: 1,
            note: form.productNote.trim() || null,
          },
        ]
      : [];

    return {
      title: form.title.trim(),
      summary: form.summary.trim(),
      content: form.content.trim(),
      images,
      products,
    };
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài viết");
      return false;
    }

    if (!form.content.trim()) {
      toast.error("Vui lòng nhập nội dung bài viết");
      return false;
    }

    return true;
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setFormSaving(true);

    try {
      const payload = buildPostPayload();

      if (editingPost) {
        await postApi.updateAdminPost(editingPost.postId, payload);
        toast.success("Cập nhật bài viết thành công");
      } else {
        await postApi.create(payload);
        toast.success("Tạo bài viết thành công");
      }

      closeForm();
      await fetchPosts();
    } catch (error) {
      console.error("Lỗi lưu bài viết:", error);
      toast.error(error?.response?.data?.message || "Lưu bài viết thất bại");
    } finally {
      setFormSaving(false);
    }
  };

  const handleViewDetail = async (post) => {
    setSelectedPost(post);
    setDetailLoading(true);

    try {
      const res = await postApi.getById(post.postId);
      setSelectedPost(unwrapObject(res));
    } catch (error) {
      console.error("Lỗi tải chi tiết bài viết:", error);
      toast.error(
        error?.response?.data?.message ||
          "Không tải được chi tiết bài viết. Vẫn hiển thị dữ liệu tóm tắt."
      );
    } finally {
      setDetailLoading(false);
    }
  };
  const openConfirmModal = (type, post) => {
  setConfirmModal({
    open: true,
    type,
    post,
  });
};

  const closeConfirmModal = () => {
    setConfirmModal({
      open: false,
      type: "",
      post: null,
    });
  };

  const handleApprove = async (post) => {
  setActionId(post.postId);

  try {
    await postApi.reviewPost(post.postId, {
      approved: true,
      rejectionReason: null,
    });

    toast.success("Đã duyệt bài viết");
    closeConfirmModal();
    await fetchPosts();

    if (selectedPost?.postId === post.postId) {
      setSelectedPost(null);
    }
  } catch (error) {
    console.error("Lỗi duyệt bài:", error);
    toast.error(error?.response?.data?.message || "Duyệt bài thất bại");
  } finally {
    setActionId(null);
  }
};
  const openRejectModal = (post) => {
    setRejectPost(post);
    setRejectReason("");
  };

  const handleReject = async (e) => {
    e.preventDefault();

    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    setActionId(rejectPost.postId);

    try {
      await postApi.reviewPost(rejectPost.postId, {
        approved: false,
        rejectionReason: rejectReason.trim(),
      });

      toast.success("Đã từ chối bài viết");
      setRejectPost(null);
      setRejectReason("");
      await fetchPosts();

      if (selectedPost?.postId === rejectPost.postId) {
        setSelectedPost(null);
      }
    } catch (error) {
      console.error("Lỗi từ chối bài:", error);
      toast.error(error?.response?.data?.message || "Từ chối bài thất bại");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (post) => {
  setActionId(post.postId);

  try {
    await postApi.deleteAdmin(post.postId);
    toast.success("Đã xóa bài viết");
    closeConfirmModal();
    await fetchPosts();

    if (selectedPost?.postId === post.postId) {
      setSelectedPost(null);
    }
  } catch (error) {
    console.error("Lỗi xóa bài viết:", error);
    toast.error(error?.response?.data?.message || "Xóa bài viết thất bại");
  } finally {
    setActionId(null);
  }
};

  return (
    <div className="admin-post-page">
      <div className="admin-page-title">
        <h2>Quản lý bài viết</h2>
        <p>
          Duyệt bài viết, từ chối bài viết, tạo bài viết admin và quản lý nội
          dung định hướng mua hàng.
        </p>
      </div>

      <div className="admin-post-stats">
        <div className="admin-post-stat">
          <Newspaper size={24} />
          <div>
            <span>Tổng bài viết</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="admin-post-stat">
          <Clock size={24} />
          <div>
            <span>Chờ duyệt</span>
            <strong>{stats.pending}</strong>
          </div>
        </div>

        <div className="admin-post-stat">
          <ShieldCheck size={24} />
          <div>
            <span>Đã duyệt</span>
            <strong>{stats.approved}</strong>
          </div>
        </div>

        <div className="admin-post-stat">
          <AlertTriangle size={24} />
          <div>
            <span>Từ chối</span>
            <strong>{stats.rejected}</strong>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <form className="admin-post-toolbar" onSubmit={handleSearch}>
          <div className="admin-post-search">
            <Search size={18} />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tiêu đề, tác giả, nội dung..."
            />
          </div>

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {POST_STATUS.map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>

          <button type="submit" className="admin-btn primary">
            <Search size={17} />
            Tìm kiếm
          </button>

          <button type="button" className="admin-btn ghost" onClick={handleReset}>
            <RefreshCcw size={17} />
            Làm mới
          </button>

          <button type="button" className="admin-btn success" onClick={openCreateForm}>
            <Plus size={17} />
            Thêm bài viết
          </button>
        </form>

        <div className="admin-post-table-wrap">
          <table className="admin-post-table">
            <thead>
              <tr>
                <th>Bài viết</th>
                <th>Tác giả</th>
                <th>Trạng thái</th>
                <th>Bình luận</th>
                <th>Ngày tạo</th>
                <th>Ngày đăng</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="admin-post-empty">
                    Đang tải danh sách bài viết...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="admin-post-empty">
                    Không có bài viết nào.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.postId}>
                    <td>
                      <div className="admin-post-cell">
                        <img
                          src={getImageUrl(post.mainImageUrl)}
                          alt={post.title}
                          onError={(e) => {
                            e.currentTarget.src = fallbackImg;
                          }}
                        />

                        <div>
                          <strong>{post.title}</strong>
                          <span>ID: {post.postId}</span>
                          <p>{shortText(post.summary, 100)}</p>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="admin-post-author">
                        <strong>{post.author?.fullName || "—"}</strong>
                        <span>{post.author?.email || "—"}</span>
                      </div>
                    </td>

                    <td>
                      <span className={statusClass[post.status]}>
                        {statusLabel[post.status] || post.status}
                      </span>
                    </td>

                    <td>
                      <div className="admin-post-comment-count">
                        <MessageCircle size={15} />
                        {post.commentCount || 0}
                      </div>
                    </td>

                    <td>{post.createdAt || "—"}</td>
                    <td>
  {post.publishedAt
    ? post.publishedAt
    : post.status === "APPROVED"
    ? post.createdAt
    : "Chưa đăng"}
</td>

                    <td>
                      <div className="admin-post-actions">
                        <button
                          type="button"
                          className="admin-post-action view"
                          title="Xem chi tiết"
                          onClick={() => handleViewDetail(post)}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          className="admin-post-action edit"
                          title="Sửa bài viết"
                          disabled={actionId === post.postId}
                          onClick={() => openEditForm(post)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
  type="button"
  className="admin-post-action approve"
  title="Duyệt bài"
  disabled={actionId === post.postId || post.status === "APPROVED"}
  onClick={() => openConfirmModal("approve", post)}
>
  <CheckCircle2 size={16} />
</button>

                        <button
                          type="button"
                          className="admin-post-action reject"
                          title="Từ chối bài"
                          disabled={
                            actionId === post.postId ||
                            post.status === "REJECTED"
                          }
                          onClick={() => openRejectModal(post)}
                        >
                          <XCircle size={16} />
                        </button>

                        <button
                          type="button"
                          className="admin-post-action danger"
                          title="Xóa bài"
                          disabled={actionId === post.postId}
                          onClick={() => openConfirmModal("delete", post)}
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

      {showForm && (
        <div className="admin-post-modal-overlay" onClick={closeForm}>
          <form
            className="admin-post-form-modal"
            onSubmit={handleSubmitPost}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-post-modal-head">
              <div>
                <h3>{editingPost ? "Cập nhật bài viết" : "Thêm bài viết"}</h3>
                <p>
                  Bài viết do admin tạo hoặc cập nhật sẽ được hiển thị ngay sau
                  khi lưu.
                </p>
              </div>

              <button type="button" onClick={closeForm}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-post-form-body">
              <div className="admin-post-form-group full">
                <label>Tiêu đề bài viết</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="Ví dụ: Top tai nghe tốt nhất 2026"
                />
              </div>

              <div className="admin-post-form-group full">
                <label>Tóm tắt</label>
                <textarea
                  name="summary"
                  value={form.summary}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Nhập tóm tắt ngắn cho bài viết..."
                />
              </div>

              <div className="admin-post-form-group full">
                <label>Nội dung</label>
                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleFormChange}
                  rows={9}
                  placeholder="Nhập nội dung chi tiết bài viết..."
                />
              </div>

              <div className="admin-post-form-group">
                <label>Ảnh chính</label>
                <input
                  name="mainImageUrl"
                  value={form.mainImageUrl}
                  onChange={handleFormChange}
                  placeholder="post1.jpg"
                />
              </div>

              <div className="admin-post-form-group">
                <label>Gắn sản phẩm</label>
                <select
                  name="productId"
                  value={form.productId}
                  onChange={handleFormChange}
                >
                  <option value="">Không gắn sản phẩm</option>
                  {products.map((product) => (
                    <option key={product.productId} value={product.productId}>
                      {product.productName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-post-form-group full">
                <label>Ghi chú sản phẩm gắn kèm</label>
                <input
                  name="productNote"
                  value={form.productNote}
                  onChange={handleFormChange}
                  placeholder="Ví dụ: Phù hợp người cần chống ồn mạnh"
                />
              </div>

              <div className="admin-post-form-preview full">
                <img
                  src={getImageUrl(form.mainImageUrl)}
                  alt="preview"
                  onError={(e) => {
                    e.currentTarget.src = fallbackImg;
                  }}
                />

                <div>
                  <span>Xem trước</span>
                  <strong>{form.title || "Tiêu đề bài viết"}</strong>
                  <p>{form.summary || "Tóm tắt bài viết sẽ hiển thị tại đây."}</p>
                </div>
              </div>

              <div className="admin-post-form-actions full">
                <button type="submit" className="admin-btn primary" disabled={formSaving}>
                  <Save size={17} />
                  {formSaving
                    ? "Đang lưu..."
                    : editingPost
                    ? "Lưu thay đổi"
                    : "Tạo bài viết"}
                </button>

                <button type="button" className="admin-btn ghost" onClick={closeForm}>
                  Hủy
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Phần selectedPost và rejectPost giữ nguyên như file cũ của bạn */}
      {/* Bạn copy tiếp phần selectedPost + rejectPost cũ xuống dưới nếu bị thiếu */}
            {confirmModal.open && (
        <div className="admin-post-confirm-overlay" onClick={closeConfirmModal}>
          <div
            className="admin-post-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="admin-post-confirm-close"
              onClick={closeConfirmModal}
            >
              <X size={18} />
            </button>

            <div
              className={
                confirmModal.type === "delete"
                  ? "admin-post-confirm-icon danger"
                  : "admin-post-confirm-icon approve"
              }
            >
              {confirmModal.type === "delete" ? (
                <Trash2 size={28} />
              ) : (
                <CheckCircle2 size={28} />
              )}
            </div>

            <h3>
              {confirmModal.type === "delete"
                ? "Xóa bài viết?"
                : "Duyệt bài viết?"}
            </h3>

            <p>
              {confirmModal.type === "delete"
                ? `Bạn có chắc muốn xóa bài viết "${
                    confirmModal.post?.title || "này"
                  }" không?`
                : `Bạn có chắc muốn duyệt bài viết "${
                    confirmModal.post?.title || "này"
                  }" không?`}
            </p>

            <div className="admin-post-confirm-actions">
              <button
                type="button"
                className="admin-post-confirm-btn cancel"
                onClick={closeConfirmModal}
              >
                Hủy
              </button>

              <button
                type="button"
                className={
                  confirmModal.type === "delete"
                    ? "admin-post-confirm-btn danger"
                    : "admin-post-confirm-btn approve"
                }
                disabled={actionId === confirmModal.post?.postId}
                onClick={() =>
                  confirmModal.type === "delete"
                    ? handleDelete(confirmModal.post)
                    : handleApprove(confirmModal.post)
                }
              >
                {actionId === confirmModal.post?.postId
                  ? "Đang xử lý..."
                  : confirmModal.type === "delete"
                  ? "Xóa bài"
                  : "Duyệt bài"}
              </button>
            </div>
          </div>
        </div>
      )}
                {selectedPost && (
        <div
          className="admin-post-detail-overlay"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="admin-post-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="admin-post-detail-close"
              onClick={() => setSelectedPost(null)}
            >
              <X size={18} />
            </button>

            <div className="admin-post-detail-hero">
              <img
                src={getImageUrl(selectedPost.mainImageUrl)}
                alt={selectedPost.title}
                onError={(e) => {
                  e.currentTarget.src = fallbackImg;
                }}
              />

              <div className="admin-post-detail-status">
                <span className={statusClass[selectedPost.status]}>
                  {statusLabel[selectedPost.status] || selectedPost.status}
                </span>
              </div>
            </div>

            <div className="admin-post-detail-body">
              {detailLoading ? (
                <div className="admin-post-detail-loading">
                  Đang tải chi tiết bài viết...
                </div>
              ) : (
                <>
                  <h2>{selectedPost.title}</h2>

                  <div className="admin-post-detail-meta">
                    <span>👤 {selectedPost.author?.fullName || "—"}</span>
                    <span>📧 {selectedPost.author?.email || "—"}</span>
                    <span>💬 {selectedPost.commentCount || 0} bình luận</span>
                    <span>🕒 {selectedPost.createdAt || "—"}</span>
                  </div>

                  <p className="admin-post-detail-summary">
                    {selectedPost.summary || "Không có tóm tắt."}
                  </p>

                  {selectedPost.products?.length > 0 && (
                    <div className="admin-post-linked-products">
                      <div className="admin-post-linked-head">
                        <Package size={18} />
                        <strong>Sản phẩm gắn trong bài viết</strong>
                      </div>

                      <div className="admin-post-linked-grid">
                        {selectedPost.products.map((item, index) => {
                          const product = item.product || item;

                          return (
                            <div
                              className="admin-post-linked-item"
                              key={product.productId || index}
                            >
                              <img
                                src={getImageUrl(product.mainImageUrl)}
                                alt={product.productName}
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://placehold.co/300x300/f1f5f9/94a3b8?text=Product";
                                }}
                              />

                              <div>
                                <strong>{product.productName || "Sản phẩm"}</strong>
                                <span>ID: {product.productId || "—"}</span>

                                {item.note && <p>{item.note}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="admin-post-detail-content">
                    {selectedPost.content || "Không có nội dung bài viết."}
                  </div>

                  <div className="admin-post-detail-actions">
                    <button
                      type="button"
                      className="admin-btn ghost"
                      onClick={() => setSelectedPost(null)}
                    >
                      Đóng
                    </button>

                    <button
                      type="button"
                      className="admin-btn primary"
                      onClick={() => {
                        setSelectedPost(null);
                        openEditForm(selectedPost);
                      }}
                    >
                      <Pencil size={17} />
                      Sửa bài viết
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

}