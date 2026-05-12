import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { productApi, postApi, reviewApi } from "../api";
import { useCart } from "../context/CartContext";
import { formatVND } from "../utils/format";
import styles from "./ProductDetailPage.module.css";

const fallbackImage =
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80";

const getImageUrl = (url) => {
  if (!url) return fallbackImage;

  // Nếu backend trả full URL
  if (url.startsWith("http")) return url;

  // Nếu đã có /images thì giữ nguyên
  if (url.startsWith("/images")) return url;

  // Chuẩn hóa về public/images
  return `/images/${url}`;
};

const getFinalPrice = (product) => product?.discountedPrice || product?.price || 0;

const getDiscount = (product) => {
  if (product?.discountPercent) return product.discountPercent;
  if (product?.discountedPrice && product?.price && product.discountedPrice < product.price) {
    return Math.round(((product.price - product.discountedPrice) / product.price) * 100);
  }
  return 0;
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const productId = id;
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [reviews, setReviews] = useState([]);
  const [product, setProduct] = useState(null);
  const [ratingStats, setRatingStats] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [activeImage, setActiveImage] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, ratingRes, featuredRes, saleRes, postRes, reviewRes] =
          await Promise.allSettled([
            productApi.getById(productId),
            productApi.getRatingStats?.(productId),
            productApi.getFeatured?.(),
            productApi.getOnSale?.(),
            postApi.getAll?.({ page: 0, size: 3 }),
            reviewApi.getByProduct(productId, { page: 0, size: 10 }),
          ]);

        if (productRes.status === "fulfilled") {
          const data = productRes.value?.data || productRes.value;
          setProduct(data);
          setActiveImage(data?.mainImageUrl || data?.images?.find((i) => i.isMain)?.imageUrl || "");
        }

        if (ratingRes.status === "fulfilled") {
          setRatingStats(ratingRes.value?.data || ratingRes.value);
        }

        if (featuredRes.status === "fulfilled") {
          const data = featuredRes.value?.data || featuredRes.value;
          setFeaturedProducts(Array.isArray(data) ? data : []);
        }

        if (saleRes.status === "fulfilled") {
          const data = saleRes.value?.data || saleRes.value;
          setSaleProducts(Array.isArray(data) ? data : []);
        }

        if (postRes.status === "fulfilled") {
          const data = postRes.value?.data || postRes.value;
          setRelatedPosts(data?.content || data || []);
        }

        if (reviewRes.status === "fulfilled") {
          const data = reviewRes.value?.data || reviewRes.value;
          setReviews(Array.isArray(data?.content) ? data.content : []);
        }

      } catch (error) {
        console.error("Lỗi tải chi tiết sản phẩm:", error);
      }
    };

    fetchData();
  }, [productId]);

  const galleryImages = useMemo(() => {
    if (!product) return [];

    const imgs = product.images?.length
      ? product.images
          .slice()
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
          .map((img) => img.imageUrl)
      : [product.mainImageUrl];

    return [...new Set(imgs.filter(Boolean))];
  }, [product]);

  if (!product) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>Đang tải chi tiết sản phẩm...</div>
      </main>
    );
  }

  const finalPrice = getFinalPrice(product);
  const discount = getDiscount(product);
  const avgRating = ratingStats?.averageRating || product.averageRating || 0;
  const totalReviews = ratingStats?.totalReviews || product.reviewCount || 0;

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      await addToCart(product.productId, 1);
    } finally {
      setAdding(false);
    }
  };
  const handleBuyNow = () => {
  navigate("/checkout", {
    state: {
      mode: "DIRECT",
      productId: product.productId,
      quantity: 1,
      product,
    },
  });
};
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.gallery}>
          <div className={styles.mainImageBox}>
            <img
  src={getImageUrl(activeImage)}
  alt={product.productName}
  onError={(e) => (e.currentTarget.src = fallbackImage)}
/>
          </div>

          <div className={styles.thumbGrid}>
            {galleryImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveImage(image)}
                className={`${styles.thumb} ${activeImage === image ? styles.thumbActive : ""}`}
              >
                <img
  src={getImageUrl(image)}
  alt={`${product.productName} ${index + 1}`}
  onError={(e) => (e.currentTarget.src = fallbackImage)}
/>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.info}>
          <span className={styles.category}>{product.categoryName}</span>

          <h1>{product.productName}</h1>

          <div className={styles.reviewLine}>
            <div className={styles.stars}>{renderStars(avgRating)}</div>
            <span>
              ({Number(avgRating).toFixed(1)} / 5) • {totalReviews} đánh giá
            </span>
          </div>

          <p className={styles.description}>{product.description}</p>

          <div className={styles.priceBlock}>
            <div>
              <strong>{formatVND(finalPrice)}</strong>
              {discount > 0 && <span>-{discount}%</span>}
            </div>

            {product.discountedPrice && product.discountedPrice < product.price && (
              <small>{formatVND(product.price)}</small>
            )}
          </div>

          <div className={styles.stockLine}>
            <span>▣</span>
            Còn hàng: {product.stock} sản phẩm tại kho
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={handleBuyNow} className={styles.buyBtn}>
  Mua ngay
</button>

            <button type="button" onClick={handleAddToCart} className={styles.cartBtn}>
              <span>🛒</span>
              {adding ? "Đang thêm..." : "Thêm vào giỏ hàng"}
            </button>
          </div>
        </div>
      </section>

      <section className={styles.usp}>
        <h2>Vì sao nên mua sản phẩm này?</h2>

        <div className={styles.uspGrid}>
          <FeatureCard icon="🚀" title="Hiệu năng mạnh mẽ" color="blue">
            Sản phẩm được tuyển chọn để đáp ứng tốt nhu cầu học tập, làm việc và
            giải trí hằng ngày.
          </FeatureCard>

          <FeatureCard icon="📷" title="Trải nghiệm cao cấp" color="orange" offset>
            Thiết kế hiện đại, dễ sử dụng và phù hợp với phong cách sống công nghệ.
          </FeatureCard>

          <FeatureCard icon="🛡️" title="Bảo hành rõ ràng" color="indigo">
            Hàng chính hãng, thông tin minh bạch, hỗ trợ sau bán hàng đáng tin cậy.
          </FeatureCard>
        </div>
      </section>

      <section className={styles.expert}>
        <div className={styles.expertContent}>
          <div>
            <span>Đánh giá từ chuyên gia</span>

            <h2>
              “Một lựa chọn đáng chú ý trong phân khúc, cân bằng tốt giữa trải
              nghiệm, hiệu năng và giá bán.”
            </h2>

            <p>
              Đội ngũ Tech Curator tập trung vào trải nghiệm sử dụng thực tế:
              chất lượng hoàn thiện, hiệu năng, độ tiện dụng và mức giá sau ưu
              đãi. Đây là sản phẩm phù hợp cho người dùng muốn mua công nghệ một
              cách thông minh hơn.
            </p>

            <Link to="/posts">
              Xem bài review chi tiết <b>→</b>
            </Link>
          </div>

          <div className={styles.expertImage}>
            <img
  src={getImageUrl(product.mainImageUrl)}
  alt={product.productName}
  onError={(e) => (e.currentTarget.src = fallbackImage)}
/>
          </div>
        </div>

        <div className={styles.blurCircle} />
      </section>

      <section className={styles.ratingSection}>
        <div className={styles.ratingSummary}>
          <h3>{Number(avgRating).toFixed(1)}</h3>
          <div>{renderStars(avgRating)}</div>
          <p>Dựa trên {totalReviews} lượt đánh giá</p>
        </div>

        <div className={styles.ratingBars}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingStats?.ratingDistribution?.[String(star)] || 0;
            const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

            return (
              <div key={star} className={styles.ratingRow}>
                <span>{star} sao</span>
                <div>
                  <i style={{ width: `${percent}%` }} />
                </div>
                <b>{percent}%</b>
              </div>
            );
          })}
        </div>
      </section>
          <section className={styles.reviewComments}>
  <div className={styles.reviewHeader}>
    <div>
      <span>Đánh giá khách hàng</span>
      <h2>Đánh giá từ người đã mua sản phẩm</h2>
    </div>

    <p>{reviews.length} đánh giá</p>
  </div>

  {reviews.length > 0 ? (
    <div className={styles.reviewList}>
      {reviews.map((review) => (
        <article key={review.reviewId} className={styles.reviewCard}>
          <div className={styles.reviewAvatar}>
            {(review.user?.fullName || "U").charAt(0).toUpperCase()}
          </div>

          <div className={styles.reviewBody}>
            <div className={styles.reviewTop}>
              <div>
                <h4>{review.user?.fullName || "Người dùng"}</h4>
                <small>{review.createdAt}</small>
              </div>

              <div className={styles.reviewStars}>
                {renderStars(review.rating)}
              </div>
            </div>

            <p>{review.comment}</p>
          </div>
        </article>
      ))}
    </div>
  ) : (
    <div className={styles.emptyReviews}>
      <h3>Chưa có đánh giá nào</h3>
      <p>Sản phẩm này chưa có đánh giá từ khách hàng.</p>
    </div>
  )}
</section>
      <ProductSlider title="Sản phẩm nổi bật" products={featuredProducts} />
      <ProductSlider title="Đang khuyến mãi" products={saleProducts} sale />

      <section className={styles.related}>
        <h2>Bài viết liên quan</h2>

        <div className={styles.relatedGrid}>
          {(relatedPosts.length ? relatedPosts.slice(0, 3) : fallbackPosts).map((post, index) => (
            <Link
              key={post.postId || index}
              to={post.postId ? `/posts/${post.postId}` : "/posts"}
              className={styles.article}
            >
              <div>
                <img
  src={getImageUrl(post.mainImageUrl || post.image)}
  alt={post.title}
  onError={(e) => (e.currentTarget.src = fallbackImage)}
/>
              </div>

              <h4>{post.title}</h4>
              <p>{post.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, children, color, offset }) {
  return (
    <div className={`${styles.featureCard} ${offset ? styles.offsetCard : ""}`}>
      <div className={`${styles.featureIcon} ${styles[color]}`}>{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

function ProductSlider({ title, products = [], sale = false }) {
  if (!products.length) return null;

  return (
    <section className={styles.sliderSection}>
      <h2>{title}</h2>

      <div className={styles.productScroller}>
        {products.map((product) => {
          const finalPrice = getFinalPrice(product);
          const discount = getDiscount(product);

          return (
            <Link
              key={product.productId}
              to={`/products/${product.productId}`}
              className={styles.slideCard}
            >
              {sale && <span className={styles.saleBadge}>HOT SALE</span>}

              <img
  src={getImageUrl(product.mainImageUrl)}
  alt={product.productName}
  onError={(e) => (e.currentTarget.src = fallbackImage)}
/>

              <h4>{product.productName}</h4>

              <div className={styles.slidePrice}>
                <strong>{formatVND(finalPrice)}</strong>

                {product.discountedPrice && product.discountedPrice < product.price && (
                  <small>{formatVND(product.price)}</small>
                )}
              </div>

              {sale && discount > 0 && <em>-{discount}%</em>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function renderStars(rating) {
  const rounded = Math.round(Number(rating || 0));

  return Array.from({ length: 5 }).map((_, index) => (
    <span key={index}>{index < rounded ? "★" : "☆"}</span>
  ));
}

const fallbackPosts = [
  {
    title: "10 mẹo chọn sản phẩm công nghệ phù hợp nhu cầu",
    summary: "Hướng dẫn chuyên sâu giúp bạn mua đúng thiết bị, tránh lãng phí.",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=700&q=80",
  },
  {
    title: "Cách đọc thông số sản phẩm trước khi mua",
    summary: "Hiểu đúng cấu hình, hiệu năng và giá trị thực tế của sản phẩm.",
    image:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=700&q=80",
  },
  {
    title: "So sánh sản phẩm cùng phân khúc: nên chọn thế nào?",
    summary: "Những tiêu chí quan trọng khi cân nhắc giữa nhiều lựa chọn.",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=700&q=80",
  },
];