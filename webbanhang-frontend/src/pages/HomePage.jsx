import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { postApi, productApi, promotionApi } from "../api";
import { formatVND } from "../utils/format";
import { useCart } from "../context/CartContext";
import styles from "./HomePage.module.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const imgFallback = (e) =>
  (e.target.src = "https://placehold.co/900x560/f1f5f9/94a3b8?text=TechStore");

const productImgFallback = (e) =>
  (e.target.src = "https://placehold.co/400x400/f8f9fa/94a3b8?text=No+Image");

const getImageUrl = (url) => {
  if (!url) return "https://placehold.co/600x400";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/images")) return url;
  return `/images/${url}`;
};

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_POSTS = [
  {
    postId: 1,
    title: "Top tai nghe tốt nhất 2026",
    summary: "Danh sách tai nghe nổi bật năm 2026 dành cho sinh viên và dân văn phòng.",
    mainImageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=80",
    commentCount: 48,
    author: { userId: 1, fullName: "Quản trị viên" },
    status: "APPROVED",
  },
  {
    postId: 2,
    title: "Review AirPods Pro 2 sau 1 tháng sử dụng",
    summary: "Trải nghiệm thực tế sau khi dùng AirPods Pro 2 trong học tập và giải trí.",
    mainImageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=900&q=80",
    commentCount: 31,
    author: { userId: 2, fullName: "Nguyễn Văn A" },
    status: "APPROVED",
  },
  {
    postId: 3,
    title: "Sony WH-1000XM5 có còn đáng mua?",
    summary: "Sau 2 năm ra mắt, chiếc tai nghe flagship của Sony vẫn giữ ngôi vương phân khúc chống ồn.",
    mainImageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=900&q=80",
    commentCount: 22,
    author: { userId: 1, fullName: "Quản trị viên" },
    status: "APPROVED",
  },
  {
    postId: 4,
    title: "So sánh tai nghe có dây vs không dây 2026",
    summary: "Latency, chất âm, tiện lợi — bên nào thắng trong cuộc chiến năm 2026?",
    mainImageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=900&q=80",
    commentCount: 17,
    author: { userId: 1, fullName: "Quản trị viên" },
    status: "APPROVED",
  },
  {
    postId: 5,
    title: "Hướng dẫn chọn tai nghe theo nhu cầu",
    summary: "Gaming, nhạc studio, hay commute hàng ngày — mỗi use case cần một loại tai nghe khác nhau.",
    mainImageUrl: "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=900&q=80",
    commentCount: 63,
    author: { userId: 2, fullName: "Nguyễn Văn A" },
    status: "APPROVED",
  },
];

const MOCK_PRODUCTS = [
  {
    productId: 1,
    productName: "AirPods Pro 2",
    price: 5500000,
    discountedPrice: 4950000,
    discountPercent: 10,
    stock: 50,
    categoryName: "Tai nghe",
    mainImageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&q=80",
    averageRating: 5.0,
    reviewCount: 1,
  },
  {
    productId: 2,
    productName: "Sony WH-1000XM5",
    price: 8000000,
    discountedPrice: 6400000,
    discountPercent: 20,
    stock: 30,
    categoryName: "Tai nghe",
    mainImageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
    averageRating: 4.0,
    reviewCount: 1,
  },
  {
    productId: 3,
    productName: "Sạc nhanh 20W",
    price: 300000,
    discountedPrice: null,
    discountPercent: 0,
    stock: 100,
    categoryName: "Phụ kiện",
    mainImageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&q=80",
    averageRating: 4.5,
    reviewCount: 8,
  },
  {
    productId: 4,
    productName: "Cáp USB-C to Lightning 1m",
    price: 450000,
    discountedPrice: 390000,
    discountPercent: 13,
    stock: 200,
    categoryName: "Phụ kiện",
    mainImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80",
    averageRating: 4.3,
    reviewCount: 5,
  },
];

// ─── Micro components ─────────────────────────────────────────────────────────

const Tag = ({ label }) => <span className={styles.tag}>{label}</span>;

const Stars = ({ rating = 0, count }) => (
  <div className={styles.stars}>
    <div className={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={styles.star} fill={i <= Math.round(rating) ? "#fbbf24" : "#e2e8f0"} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    {count !== undefined && <span className={styles.starCount}>({count})</span>}
  </div>
);

const ArrowIcon = ({ className = "" }) => (
  <svg className={className} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

// ─── 1. PROMO BAR ─────────────────────────────────────────────────────────────

const PromoBanner = ({ promotions }) => {
  if (!promotions?.length) return null;
  const promo = promotions[0];
  return (
    <div className={styles.promoBar}>
      <div className={styles.promoBarLeft}>
        <div className={styles.promoIcon}>🎁</div>
        <div>
          <p className={styles.promoName}>{promo.promotionName}</p>
          <p className={styles.promoSub}>Giảm đến {promo.discountPercent}% · Số lượng có hạn</p>
        </div>
      </div>
      <Link to="/promotions" className={styles.promoBtn}>Xem ưu đãi →</Link>
    </div>
  );
};

// ─── 2. HERO BANNER ───────────────────────────────────────────────────────────

const HeroBanner = ({ post }) => {
  const [ref, visible] = useReveal();
  if (!post) return null;
  return (
    <section className={styles.hero}>
      <div className={styles.heroBg}>
        <img src={getImageUrl(post.mainImageUrl)} alt="" onError={imgFallback} className={styles.heroBgImg} />
        <div className={styles.heroOverlayH} />
        <div className={styles.heroOverlayV} />
      </div>
      <div className={styles.heroGrid} />
      <div className={styles.heroInner}>
        <div ref={ref} className={`${styles.heroContent} ${visible ? styles.visible : styles.hidden}`}>
          <div className={styles.heroMeta}>
            <Tag label="Nổi bật" />
            <span className={styles.heroMetaDot}>• Bài viết của tuần</span>
          </div>
          <h1 className={styles.heroTitle}>{post.title}</h1>
          <p className={styles.heroSummary}>{post.summary}</p>
          <div className={styles.heroActions}>
            <Link to={`/posts/${post.postId}`} className={styles.heroCta}>
              Đọc ngay <ArrowIcon />
            </Link>
            <span className={styles.heroComments}>💬 {post.commentCount} bình luận</span>
          </div>
        </div>
      </div>
      <div className={styles.heroFade} />
    </section>
  );
};

// ─── 3. FEATURED POSTS ────────────────────────────────────────────────────────

const POST_CATEGORIES = [
  { label: "Tất cả", icon: "✦" },
  { label: "Review", icon: "⭐" },
  { label: "So sánh", icon: "⚖️" },
  { label: "Hướng dẫn", icon: "📖" },
  { label: "Tin tức", icon: "📡" },
];

const guessCategory = (post) => {
  const t = post.title?.toLowerCase() || "";
  if (t.includes("so sánh") || t.includes("vs")) return "So sánh";
  if (t.includes("hướng dẫn") || t.includes("cách chọn") || t.includes("cách")) return "Hướng dẫn";
  if (t.includes("review") || t.includes("trải nghiệm") || t.includes("tháng")) return "Review";
  if (t.includes("ra mắt") || t.includes("mới") || t.includes("top")) return "Tin tức";
  return "Review";
};

const FeaturedPosts = ({ posts }) => {
  const [active, setActive] = useState("Tất cả");
  const postsWithCat = posts.map((p) => ({ ...p, _cat: p.category || guessCategory(p) }));
  const filtered = active === "Tất cả" ? postsWithCat : postsWithCat.filter((p) => p._cat === active);
  const [hero, ...rest] = filtered;

  return (
    <section className={`${styles.section} ${styles.sectionWhite}`}>
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>Khám phá</p>
            <h2 className={styles.sectionTitle}>Bài viết công nghệ nổi bật</h2>
          </div>
          <Link to="/posts" className={styles.seeAll}>Xem tất cả <ArrowIcon className={styles.seeAllArrow} /></Link>
        </div>
        <div className={styles.pillRow}>
          {POST_CATEGORIES.map((c) => (
            <button key={c.label} onClick={() => setActive(c.label)}
              className={`${styles.pill} ${active === c.label ? styles.pillActive : ""}`}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        {hero && (
          <div className={styles.featuredGrid}>
            <Link to={`/posts/${hero.postId}`} className={styles.bigCard}>
              <div className={styles.bigCardImg}>
                <img src={getImageUrl(hero.mainImageUrl)} alt={hero.title} onError={imgFallback} />
              </div>
              <div className={styles.bigCardOverlay} />
              <div className={styles.bigCardBody}>
                <Tag label={hero._cat} />
                <h3 className={styles.bigCardTitle}>{hero.title}</h3>
                <p className={styles.bigCardSummary}>{hero.summary}</p>
                <p className={styles.bigCardMeta}>💬 {hero.commentCount} bình luận</p>
              </div>
            </Link>
            <div className={styles.smallList}>
              {rest.slice(0, 4).map((post) => (
                <Link key={post.postId} to={`/posts/${post.postId}`} className={styles.smallItem}>
                  <div className={styles.smallThumb}>
                    <img src={getImageUrl(post.mainImageUrl)} alt={post.title} onError={imgFallback} />
                  </div>
                  <div className={styles.smallMeta}>
                    <Tag label={post._cat} />
                    <h4 className={styles.smallTitle}>{post.title}</h4>
                    <span className={styles.smallComments}>💬 {post.commentCount}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// ─── 4. PRODUCT CARD — Redesigned ────────────────────────────────────────────

const ProductCard = ({ product, delay = 0 }) => {
  const { addToCart } = useCart();
  const [ref, visible] = useReveal();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    await addToCart(product.productId, 1);
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const hasDiscount =
    product.discountPercent > 0 &&
    product.discountedPrice != null &&
    product.discountedPrice < product.price;

  const displayPrice = product.discountedPrice ?? product.price;

  return (
    <div
      ref={ref}
      className={`${styles.productCard} ${visible ? styles.visible : styles.hidden}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Link to={`/products/${product.productId}`} style={{ textDecoration: "none" }}>
        {/* Ảnh */}
        <div className={styles.productImgWrap}>
          <img
            src={getImageUrl(product.mainImageUrl)}
            alt={product.productName}
            onError={productImgFallback}
            className={styles.productImg}
          />
          {hasDiscount && (
            <span className={styles.discountBadge}>-{product.discountPercent}%</span>
          )}
          <span className={styles.categoryBadge}>{product.categoryName}</span>
        </div>

        {/* Nội dung */}
        <div className={styles.productBody}>
          <p className={styles.productName}>{product.productName}</p>
          <Stars rating={product.averageRating} count={product.reviewCount} />

          {/* Khối giá — luôn cùng chiều cao để cards đều nhau */}
          <div className={styles.priceBlock}>
            {/* Hàng giá cũ — luôn chiếm chỗ */}
            <div className={styles.priceOldRow}>
              {hasDiscount && (
                <span className={styles.priceOld}>{formatVND(product.price)}</span>
              )}
            </div>
            {/* Giá hiển thị chính */}
            <span className={`${styles.priceMain} ${hasDiscount ? styles.priceMainSale : ""}`}>
              {formatVND(displayPrice)}
            </span>
          </div>
        </div>
      </Link>

      {/* Nút thêm giỏ */}
      <div className={styles.productFoot}>
        <button onClick={handleAdd} disabled={adding} className={styles.addBtn}>
          {adding ? (
            <span className={styles.spinner} />
          ) : added ? (
            <>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Đã thêm
            </>
          ) : (
            <>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z" />
              </svg>
              Thêm vào giỏ
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ─── 5. REVIEWS SECTION ──────────────────────────────────────────────────────

const ReviewsSection = ({ products }) => (
  <section className={`${styles.section} ${styles.sectionBg}`}>
    <div className={styles.container}>
      <div className={styles.sectionHead}>
        <div>
          <p className={styles.eyebrow}>Đã kiểm chứng</p>
          <h2 className={styles.sectionTitle}>Chúng tôi đã dùng thử cho bạn</h2>
          <p className={styles.sectionDesc}>
            Mỗi sản phẩm được đội ngũ biên tập trải nghiệm ít nhất 2 tuần. Không quảng cáo, không thiên vị.
          </p>
        </div>
        <Link to="/products" className={styles.seeAll}>
          Xem tất cả <ArrowIcon className={styles.seeAllArrow} />
        </Link>
      </div>
      <div className={styles.productGrid}>
        {products.map((p, i) => (
          <ProductCard key={p.productId} product={p} delay={i * 80} />
        ))}
      </div>
      <div className={styles.viewAllWrap}>
        <Link to="/products" className={styles.viewAllBtn}>
          Xem tất cả sản phẩm <ArrowIcon />
        </Link>
      </div>
    </div>
  </section>
);

// ─── 6. EDITORIAL BRIDGE ─────────────────────────────────────────────────────

const EditorialBridge = ({ posts }) => {
  const [ref, visible] = useReveal();
  const ctaPost = posts?.[1];
  return (
    <section className={`${styles.section} ${styles.sectionWhite}`}>
      <div className={styles.container}>
        <div ref={ref} className={`${styles.bridgeReveal} ${visible ? styles.visible : styles.hidden}`}>
          <div className={styles.bridgeGrid}>
            <Link to={ctaPost ? `/posts/${ctaPost.postId}` : "/posts"} className={styles.darkCard}>
              <div className={styles.darkCardBg}>
                <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=60" alt="" />
              </div>
              <div className={styles.darkCardContent}>
                <Tag label="Hướng dẫn mua" />
                <h3 className={styles.darkCardTitle}>
                  {ctaPost?.title || "Hướng dẫn chọn sản phẩm phù hợp với nhu cầu"}
                </h3>
                <p className={styles.darkCardDesc}>
                  {ctaPost?.summary || "Đừng chỉ nhìn vào giá. Chúng tôi giúp bạn hiểu thứ thực sự quan trọng."}
                </p>
              </div>
              <div className={styles.darkCardLink}>
                Đọc bài viết <ArrowIcon className={styles.darkCardLinkArrow} />
              </div>
            </Link>
            <div className={styles.bridgeRight}>
              <div className={styles.statsGrid}>
                {[{ num: "200+", label: "Bài review" }, { num: "50k+", label: "Độc giả/tháng" }, { num: "98%", label: "Hài lòng" }].map(({ num, label }) => (
                  <div key={label} className={styles.statBox}>
                    <p className={styles.statNum}>{num}</p>
                    <p className={styles.statLabel}>{label}</p>
                  </div>
                ))}
              </div>
              <div className={styles.newsletter}>
                <div>
                  <div className={styles.newsletterEmoji}>📬</div>
                  <h3 className={styles.newsletterTitle}>Bản tin công nghệ tuần</h3>
                  <p className={styles.newsletterDesc}>Review mới, so sánh sâu, gợi ý mua hàng — mỗi tuần một lần, không spam.</p>
                </div>
                <div className={styles.newsletterForm}>
                  <input type="email" placeholder="email@của.bạn" className={styles.newsletterInput} />
                  <button type="button" className={styles.newsletterBtn}>Đăng ký</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── 7. SUGGESTION SECTION ───────────────────────────────────────────────────

const SuggestionCard = ({ post, delay }) => {
  const [ref, visible] = useReveal();
  return (
    <Link
      ref={ref}
      to={`/posts/${post.postId}`}
      className={`${styles.suggestionCard} ${visible ? styles.visible : styles.hidden}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={styles.suggestionThumb}>
        <img src={getImageUrl(post.mainImageUrl)} alt={post.title} onError={imgFallback} />
      </div>
      <div className={styles.suggestionBody}>
        <Tag label={post._cat || guessCategory(post)} />
        <h4 className={styles.suggestionTitle}>{post.title}</h4>
        <p className={styles.suggestionSummary}>{post.summary}</p>
        <div className={styles.suggestionFoot}>
          <span className={styles.suggestionComments}>💬 {post.commentCount}</span>
          <span className={styles.suggestionReadMore}>Đọc →</span>
        </div>
      </div>
    </Link>
  );
};

const SuggestionsSection = ({ posts }) => (
  <section className={`${styles.section} ${styles.sectionBg}`} style={{ borderTop: "1px solid #f1f5f9" }}>
    <div className={styles.container}>
      <div className={styles.sectionHead}>
        <div>
          <p className={styles.eyebrow}>Dành riêng cho bạn</p>
          <h2 className={styles.sectionTitle}>Có thể bạn quan tâm</h2>
        </div>
        <Link to="/posts" className={styles.seeAll}>Xem thêm <ArrowIcon className={styles.seeAllArrow} /></Link>
      </div>
      <div className={styles.suggestionGrid}>
        {posts.map((post, i) => (
          <SuggestionCard key={post.postId} post={post} delay={i * 80} />
        ))}
      </div>
    </div>
  </section>
);

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [postsRes, productsRes, promoRes] = await Promise.allSettled([
        postApi.getAll({ page: 0, size: 8 }),
        productApi.getAll({ page: 0, size: 4 }),
        promotionApi.getActive(),
      ]);
      if (postsRes.status === "fulfilled" && postsRes.value?.content?.length) setPosts(postsRes.value.content);
      if (productsRes.status === "fulfilled" && productsRes.value?.content?.length) setProducts(productsRes.value.content);
      if (promoRes.status === "fulfilled" && Array.isArray(promoRes.value)) setPromotions(promoRes.value);
    };
    fetchAll();
  }, []);

  return (
    <div className={styles.page}>
      <PromoBanner promotions={promotions} />
      <HeroBanner post={posts[0]} />
      <FeaturedPosts posts={posts} />
      <ReviewsSection products={products} />
      <EditorialBridge posts={posts} />
      <SuggestionsSection posts={posts.slice(1, 5)} />
    </div>
  );
}