import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import styles from "./PostDetailPage.module.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatPrice = (n) => n?.toLocaleString("vi-VN") + "₫";

const formatDate = (str) => {
  if (!str) return "";
  const d = new Date(str.replace(" ", "T"));
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const timeAgo = (str) => {
  const diff = Date.now() - new Date(str.replace(" ", "T")).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "Vừa xong";
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const StarRating = ({ rating, count }) => (
  <div className={styles.stars}>
    {[1, 2, 3, 4, 5].map((i) => (
      <span key={i} className={i <= Math.round(rating) ? styles.starFilled : styles.starEmpty}>
        ★
      </span>
    ))}
    <span className={styles.ratingCount}>({count} đánh giá)</span>
  </div>
);
const getImageUrl = (url) => {
  if (!url) return fallbackImg;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/images")) return url;
  return `/images/${url}`;
};

const ProductCard = ({ item, onAddToCart }) => {
  const { product, note } = item;
  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;

  return (
    <div className={styles.productCard}>
      <div className={styles.productCardInner}>
        <div className={styles.productImageWrap}>
          {hasDiscount && (
            <span className={styles.discountBadge}>-{product.discountPercent}%</span>
          )}
          <img
  src={getImageUrl(product.mainImageUrl)}
  alt={product.productName}
  className={styles.productImage}
  onError={(e) => (e.currentTarget.src = fallbackImg)}
/>
        </div>
        <div className={styles.productInfo}>
          <span className={styles.productCategory}>{product.categoryName}</span>
          <h3 className={styles.productName}>{product.productName}</h3>
          <StarRating rating={product.averageRating} count={product.reviewCount} />
          {note && <p className={styles.productNote}>{note}</p>}
          <div className={styles.productPricing}>
            {hasDiscount ? (
              <>
                <span className={styles.priceNew}>{formatPrice(product.discountedPrice)}</span>
                <span className={styles.priceOld}>{formatPrice(product.price)}</span>
              </>
            ) : (
              <span className={styles.priceNew}>{formatPrice(product.price)}</span>
            )}
          </div>
          <div className={styles.productActions}>
            <button className={styles.btnBuy} onClick={() => onAddToCart(product)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Thêm vào giỏ
            </button>
            <Link to={`/products/${product.productId}`} className={styles.btnView}>
              Xem sản phẩm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const Toast = ({ toasts }) => (
  <div className={styles.toastContainer}>
    {toasts.map((t) => (
      <div key={t.id} className={`${styles.toast} ${styles[`toast_${t.type}`]}`}>
        <span className={styles.toastIcon}>
          {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
        </span>
        <span className={styles.toastMsg}>{t.message}</span>
      </div>
    ))}
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const show = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return { toasts, show };
};

const CommentItem = ({ comment }) => (
  <div className={styles.commentItem}>
    <div className={styles.commentAvatar}>
      {comment.user.fullName.charAt(0).toUpperCase()}
    </div>
    <div className={styles.commentBody}>
      <div className={styles.commentHeader}>
        <span className={styles.commentAuthor}>{comment.user.fullName}</span>
        <span className={styles.commentTime}>{timeAgo(comment.createdAt)}</span>
      </div>
      <p className={styles.commentContent}>{comment.content}</p>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PostDetail() {
  const { id } = useParams();
const postId = id;

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(0);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentLast, setCommentLast] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const { toasts, show: showToast } = useToast();

  // Fetch post + comments
  useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Tải bài viết trước
      const postRes = await axiosClient.get(`/posts/${postId}`);

const postData =
  postRes?.data?.data || // axios thường
  postRes?.data ||       // response.data
  postRes;               // axiosClient đã unwrap sẵn

if (!postData) {
  throw new Error("Không có dữ liệu bài viết");
}

setPost(postData);
setCommentTotal(postData.commentCount ?? 0);

      setPost(postData);
      setCommentTotal(postData.commentCount || 0);

      // 2. Tải comment riêng, lỗi comment không làm hỏng bài viết
      try {
        const cmtRes = await axiosClient.get(`/comments/post/${postId}`, {
          params: { page: 0, size: 10 },
        });

        const cmtData =
  cmtRes?.data?.data ||
  cmtRes?.data ||
  cmtRes;
        setComments(cmtData?.content || []);
        setCommentTotal(cmtData?.totalElements ?? postData.commentCount ?? 0);
        setCommentLast(cmtData?.last ?? true);
        setCommentPage(0);
      } catch (commentErr) {
        console.warn("Không tải được bình luận:", commentErr);
        setComments([]);
        setCommentLast(true);
      }
    } catch (err) {
      console.error("Lỗi tải bài viết:", err);
      console.error("Status:", err.response?.status);
      console.error("Data:", err.response?.data);
      console.error("URL:", err.config?.url);

      setError("Không thể tải bài viết. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (postId) fetchData();
}, [postId]);

  // Load more comments
  const handleLoadMoreComments = async () => {
    try {
      const nextPage = commentPage + 1;
      const res = await axiosClient.get(`/comments/post/${postId}`, {
        params: { page: nextPage, size: 10 },
      });
      setComments((prev) => [...prev, ...res.data.data.content]);
      setCommentPage(nextPage);
      setCommentLast(res.data.data.last);
    } catch {
      // silent
    }
  };

  // Reading progress bar
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const progress = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setReadingProgress(Math.min(100, progress));
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Add to cart — POST /cart/items
  const handleAddToCart = async (product) => {
    try {
      await axiosClient.post("/cart/items", {
        productId: product.productId,
        quantity: 1,
      });
      showToast(`Đã thêm "${product.productName}" vào giỏ hàng!`, "success");
    } catch {
      showToast("Bạn cần đăng nhập để thêm vào giỏ hàng.", "error");
    }
  };

  // Submit comment — POST /comments
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
  showToast("Vui lòng nhập nội dung bình luận.", "error");
  return;
}
    try {
      setSubmitting(true);
      const res = await axiosClient.post("/comments", {
        postId: Number(postId),
        content: newComment.trim(),
      });
      setComments((prev) => [res.data.data, ...prev]);
      setCommentTotal((t) => t + 1);
      showToast("Bình luận của bạn đã được gửi.", "success");
    } catch {
      showToast("Bạn cần đăng nhập để bình luận.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render states ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>Đang tải bài viết...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.loadingScreen}>
        <p>{error}</p>
        <Link to="/posts" className={styles.btnView}>Quay lại danh sách bài viết</Link>
      </div>
    );
  }

  if (!post) return null;

  const paragraphs = post.content.split("\n\n").filter(Boolean);
  const sortedProducts = [...(post.products || [])].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
  <div className={styles.page}>
    <Toast toasts={toasts} />
      {/* Reading progress */}
      <div className={styles.progressBar} style={{ width: `${readingProgress}%` }} />

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <div className={styles.breadcrumbInner}>
          <Link to="/" className={styles.breadcrumbLink}>Trang chủ</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <Link to="/posts" className={styles.breadcrumbLink}>Bài viết</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{post.title}</span>
        </div>
      </div>

      <div className={styles.container}>
        {/* ── ARTICLE ── */}
        <article className={styles.article}>

          {/* Header */}
          <header className={styles.articleHeader}>
            <h1 className={styles.articleTitle}>{post.title}</h1>
            {post.summary && (
              <p className={styles.articleSummary}>{post.summary}</p>
            )}
            <div className={styles.metaBar}>
              <div className={styles.metaAuthor}>
                <div className={styles.metaAvatarCircle}>
                  {post.author.fullName.charAt(0)}
                </div>
                <div>
                  <div className={styles.metaAuthorName}>{post.author.fullName}</div>
                  <div className={styles.metaAuthorRole}>{post.author.email}</div>
                </div>
              </div>
              <div className={styles.metaDivider} />
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Ngày đăng</span>
                <span className={styles.metaValue}>{formatDate(post.createdAt)}</span>
              </div>
              {post.publishedAt && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Xuất bản</span>
                  <span className={styles.metaValue}>{formatDate(post.publishedAt)}</span>
                </div>
              )}
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Bình luận</span>
                <span className={styles.metaValue}>{commentTotal}</span>
              </div>
            </div>
          </header>

          {/* Hero image */}
          {post.mainImageUrl && (
            <div className={styles.heroWrap}>
              <img
  src={getImageUrl(post.mainImageUrl)}
  alt={post.title}
  className={styles.heroImage}
  onError={(e) => (e.currentTarget.src = fallbackImg)}
/>
              <div className={styles.heroOverlay} />
            </div>
          )}

          {/* Article body */}
          <div className={styles.articleBody}>
            {paragraphs.map((para, idx) => (
              <p key={idx} className={idx === 0 ? styles.leadPara : styles.bodyPara}>
                {para}
              </p>
            ))}

            {/* Sản phẩm trong bài viết */}
            {sortedProducts.length > 0 && (
              <div className={styles.productsSection}>
                <div className={styles.productsSectionHeader}>
                  <span className={styles.productsSectionLine} />
                  <h2 className={styles.productsSectionTitle}>Sản phẩm trong bài viết</h2>
                  <span className={styles.productsSectionLine} />
                </div>
                <div className={styles.productsList}>
                  {sortedProducts.map((item) => (
                    <ProductCard key={item.id} item={item} onAddToCart={handleAddToCart} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comments */}
          <section className={styles.commentsSection}>
            <h3 className={styles.commentsSectionTitle}>
              Bình luận
              <span className={styles.commentsBadge}>{commentTotal}</span>
            </h3>

            {/* Comment form */}
            <form className={styles.commentForm} onSubmit={handleSubmitComment}>
              <div className={styles.commentFormInner}>
                <div className={styles.commentFormAvatar}>B</div>
                <div className={styles.commentFormField}>
                  <textarea
                    className={styles.commentTextarea}
                    placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <div className={styles.commentFormActions}>
                    <button
                      type="submit"
                      className={styles.btnSubmitComment}
                      disabled={submitting || !newComment.trim()}
                    >
                      {submitting ? "Đang gửi..." : "Gửi bình luận"}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Comment list */}
            <div className={styles.commentList}>
              {comments.map((c) => (
                <CommentItem key={c.commentId} comment={c} />
              ))}
              {!commentLast && (
                <button className={styles.btnLoadMore} onClick={handleLoadMoreComments}>
                  Xem thêm bình luận
                </button>
              )}
            </div>
          </section>
        </article>

        {/* ── SIDEBAR ── */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSticky}>

            {/* Sản phẩm đề cập */}
            {sortedProducts.length > 0 && (
              <div className={styles.sidebarCard}>
                <h4 className={styles.sidebarTitle}>Sản phẩm đề cập</h4>
                <div className={styles.sidebarProductList}>
                  {sortedProducts.map((item) => (
                    <Link
                      to={`/products/${item.product.productId}`}
                      key={item.id}
                      className={styles.sidebarProduct}
                    >
                      <img
  src={getImageUrl(item.product.mainImageUrl)}
  alt={item.product.productName}
  className={styles.sidebarProductImg}
  onError={(e) => (e.currentTarget.src = fallbackImg)}
/>
                      <div>
                        <div className={styles.sidebarProductName}>{item.product.productName}</div>
                        <div className={styles.sidebarProductPrice}>
                          {item.product.discountedPrice
                            ? formatPrice(item.product.discountedPrice)
                            : formatPrice(item.product.price)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tác giả */}
            <div className={styles.sidebarAuthorCard}>
              <div className={styles.sidebarAuthorAvatar}>
                {post.author.fullName.charAt(0)}
              </div>
              <div className={styles.sidebarAuthorName}>{post.author.fullName}</div>
              <div className={styles.sidebarAuthorEmail}>{post.author.email}</div>
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
}