import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { productApi, promotionApi, postApi } from "../api";
import { formatVND } from "../utils/format";
import { useCart } from "../context/CartContext";
import styles from "./PromotionsPage.module.css";

const fallbackImg =
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80";

const getImageUrl = (url) => {
  if (!url) return fallbackImg;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/images")) return url;
  return `/images/${url}`;
};

const getProductImage = (p) =>
  getImageUrl(p?.mainImageUrl || p?.imageUrl || p?.imageURL);

const getBrand = (p) => {
  const name = `${p?.productName || ""} ${p?.description || ""}`.toLowerCase();

  if (name.includes("apple") || name.includes("iphone") || name.includes("macbook") || name.includes("ipad")) return "Apple";
  if (name.includes("sony")) return "Sony";
  if (name.includes("keychron")) return "Keychron";
  if (name.includes("samsung")) return "Samsung";
  if (name.includes("asus")) return "ASUS";
  if (name.includes("dell")) return "Dell";

  return p?.categoryName || "Tech";
};

const getDiscountPercent = (p) => {
  if (p?.discountPercent) return p.discountPercent;

  if (p?.discountedPrice && p?.price && p.discountedPrice < p.price) {
    return Math.round(((p.price - p.discountedPrice) / p.price) * 100);
  }

  return 0;
};

const getFinalPrice = (p) => p?.discountedPrice || p?.price || 0;

const toArray = (data) => {
  const result =
    data?.content ||
    data?.data?.content ||
    data?.data ||
    data;

  return Array.isArray(result) ? result : [];
};

export default function PromotionsPage() {
  const { addToCart } = useCart();
  const [flashTime, setFlashTime] = useState({
  hours: 12,
  minutes: 45,
  seconds: 30,
});

  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [discountFilters, setDiscountFilters] = useState([]);
  const [brandFilters, setBrandFilters] = useState([]);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
  const timer = setInterval(() => {
    setFlashTime((prev) => {
      let { hours, minutes, seconds } = prev;

      if (seconds > 0) {
        seconds -= 1;
      } else if (minutes > 0) {
        minutes -= 1;
        seconds = 59;
      } else if (hours > 0) {
        hours -= 1;
        minutes = 59;
        seconds = 59;
      } else {
        hours = 12;
        minutes = 45;
        seconds = 30;
      }

      return { hours, minutes, seconds };
    });
  }, 1000);

  return () => clearInterval(timer);
}, []);

  const { data: products = [], isLoading: productsLoading } = useQuery({
  queryKey: ["promotion-products"],
  queryFn: async () => {
    const data = await productApi.getAll({ page: 0, size: 20 });
    return toArray(data);
  },
});

const { data: promotions = [] } = useQuery({
  queryKey: ["active-promotions"],
  queryFn: async () => {
    const data = await promotionApi.getActive();
    return toArray(data);
  },
});

const { data: posts = [] } = useQuery({
  queryKey: ["promotion-posts"],
  queryFn: async () => {
    const data = await postApi.getAll({ page: 0, size: 4 });
    return toArray(data);
  },
});

  const categories = useMemo(() => {
    const list = products.map((p) => p.categoryName).filter(Boolean);
    return ["Tất cả", ...new Set(list)];
  }, [products]);

  const brands = useMemo(() => {
    const list = products.map(getBrand).filter(Boolean);
    return [...new Set(list)].slice(0, 6);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const discount = getDiscountPercent(p);
      const brand = getBrand(p);

      const matchCategory =
        selectedCategory === "Tất cả" || p.categoryName === selectedCategory;

      const matchDiscount =
        discountFilters.length === 0 ||
        discountFilters.some((f) => {
          if (f === "over30") return discount > 30;
          if (f === "10to30") return discount >= 10 && discount <= 30;
          return true;
        });

      const matchBrand =
        brandFilters.length === 0 || brandFilters.includes(brand);

      return matchCategory && matchDiscount && matchBrand;
    });
  }, [products, selectedCategory, discountFilters, brandFilters]);

  const featuredProduct = filteredProducts[0] || products[0];
  const secondProduct = filteredProducts[1] || products[1];
  const gridProducts = filteredProducts.slice(2);

  const mainPromo = promotions[0];

  const toggleDiscount = (value) => {
    setDiscountFilters((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const toggleBrand = (value) => {
    setBrandFilters((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handleAddToCart = async (productId) => {
    try {
      setAddingId(productId);
      await addToCart(productId, 1);
    } finally {
      setAddingId(null);
    }
  };
  if (productsLoading) {
  return (
    <main className={styles.page}>
      <div className={styles.emptyBox}>Đang tải khuyến mãi...</div>
    </main>
  );
}
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <img
          className={styles.heroImage}
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80"
          alt="Khuyến mãi công nghệ"
        />

        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <span className={styles.flashBadge}>FLASH SALE</span>

            <h1>
              {mainPromo
                ? `${mainPromo.promotionName} - giảm đến ${mainPromo.discountPercent}%`
                : "Sale công nghệ - giảm đến 50%"}
            </h1>

            <p>
              Sở hữu những tuyệt phẩm công nghệ được giám tuyển kỹ lưỡng với
              mức giá không tưởng. Chỉ có tại TECH CURATOR.
            </p>

            <div className={styles.countdown}>
  <TimeBox value={String(flashTime.hours).padStart(2, "0")} label="Giờ" />
  <TimeBox value={String(flashTime.minutes).padStart(2, "0")} label="Phút" />
  <TimeBox value={String(flashTime.seconds).padStart(2, "0")} label="Giây" />
</div>

            <div className={styles.couponBox}>
              <div>
                <span>Nhập mã:</span>
                <strong>{mainPromo?.code || "DUY QUOC"}</strong>
              </div>
              <button type="button">SAO CHÉP</button>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.contentWrap}>
        <aside className={styles.sidebar}>
          <div>
            <h3>Danh mục</h3>

            <div className={styles.categoryList}>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`${styles.categoryItem} ${
                    selectedCategory === category ? styles.categoryActive : ""
                  }`}
                >
                  <span className={styles.materialIcon}>
                    {category === "Tất cả"
                      ? "▦"
                      : category.toLowerCase().includes("điện")
                      ? "▯"
                      : category.toLowerCase().includes("laptop")
                      ? "⌨"
                      : "◴"}
                  </span>
                  <span>{category}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3>Bộ lọc</h3>

            <div className={styles.filterBlock}>
              <div>
                <p className={styles.filterTitle}>Mức giảm</p>

                <div className={styles.checkboxList}>
                  <label>
                    <input
                      type="checkbox"
                      checked={discountFilters.includes("over30")}
                      onChange={() => toggleDiscount("over30")}
                    />
                    <span>Trên 30%</span>
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      checked={discountFilters.includes("10to30")}
                      onChange={() => toggleDiscount("10to30")}
                    />
                    <span>10% - 30%</span>
                  </label>
                </div>
              </div>

              <div>
                <p className={styles.filterTitle}>Hãng</p>

                <div className={styles.checkboxList}>
                  {brands.map((brand) => (
                    <label key={brand}>
                      <input
                        type="checkbox"
                        checked={brandFilters.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className={styles.productCanvas}>
          <section className={styles.highlightSection}>
            <div className={styles.sectionHead}>
              <div>
                <h2>Khuyến mãi hôm nay</h2>
                <p>Những lựa chọn hàng đầu từ đội ngũ giám tuyển.</p>
              </div>
            </div>

            <div className={styles.bentoGrid}>
              {featuredProduct && (
                <FeaturedProduct product={featuredProduct} />
              )}

              {secondProduct && (
                <SmallHotProduct
                  product={secondProduct}
                  onAdd={() => handleAddToCart(secondProduct.productId)}
                  adding={addingId === secondProduct.productId}
                />
              )}
            </div>
          </section>

          <section className={styles.allPromoSection}>
            <h2>Tất cả khuyến mãi</h2>

            {filteredProducts.length === 0 ? (
              <div className={styles.emptyBox}>
                Không có sản phẩm phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              <div className={styles.productGrid}>
                {(gridProducts.length ? gridProducts : filteredProducts).map((product) => (
                  <ProductCard key={product.productId} product={product} />
                ))}
              </div>
            )}
          </section>

          <section className={styles.articleSection}>
            <h2>Bí kíp mua sắm</h2>

            <div className={styles.articleGrid}>
              {(posts.length ? posts.slice(0, 2) : []).map((post) => (
                <ArticleCard key={post.postId} post={post} />
              ))}

              {posts.length === 0 && (
                <>
                  <StaticArticle
                    title="Cách chọn MacBook phù hợp cho sinh viên IT năm 2026"
                    desc="Đừng chỉ nhìn vào cấu hình, hãy nhìn vào nhu cầu thực tế của các đồ án chuyên ngành..."
                    tag="Tư vấn"
                    image="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80"
                  />

                  <StaticArticle
                    title="Top 5 phụ kiện không thể thiếu cho dân văn phòng Hybrid"
                    desc="Làm việc linh hoạt hiệu quả hơn với những giải pháp công nghệ nhỏ gọn và thông minh..."
                    tag="Cập nhật"
                    image="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80"
                  />
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function TimeBox({ value, label }) {
  return (
    <div className={styles.timeBox}>
      <span>{value}</span>
      <small>{label}</small>
    </div>
  );
}

function FeaturedProduct({ product }) {
  const discount = getDiscountPercent(product);
  const finalPrice = getFinalPrice(product);

  return (
    <div className={styles.largeCard}>
      <div className={styles.cardBadges}>
        <span>HOT</span>
        <span>BÁN CHẠY</span>
      </div>

      <div className={styles.largeCardInner}>
        <div className={styles.largeInfo}>
          <div className={styles.starRow}>★★★★★</div>

          <h3>{product.productName}</h3>

          <p>
            “Một lựa chọn công nghệ nổi bật, phù hợp cho học tập, làm việc và
            giải trí với mức giá hấp dẫn hơn.”
          </p>

          <ul>
            <li>✓ Sản phẩm chính hãng, bảo hành rõ ràng</li>
            <li>✓ Giá tốt trong thời gian khuyến mãi</li>
          </ul>

          <div className={styles.largePrice}>
            <span>{formatVND(finalPrice)}</span>
            {product.price && finalPrice < product.price && (
              <small>{formatVND(product.price)}</small>
            )}
            {discount > 0 && <em>-{discount}%</em>}
          </div>

          <div className={styles.largeActions}>
            <Link to={`/products/${product.productId}`}>Mua ngay</Link>
            <Link to={`/products/${product.productId}`}>Xem review chi tiết</Link>
          </div>
        </div>

        <div className={styles.largeImageWrap}>
          <img
  src={getProductImage(product)}
  alt={product.productName}
  onError={(e) => (e.currentTarget.src = fallbackImg)}
/>
        </div>
      </div>
    </div>
  );
}

function SmallHotProduct({ product, onAdd, adding }) {
  const discount = getDiscountPercent(product);
  const finalPrice = getFinalPrice(product);

  return (
    <div className={styles.smallHotCard}>
      <img
  src={getProductImage(product)}
  alt={product.productName}
  onError={(e) => (e.currentTarget.src = fallbackImg)}
/>

      <div className={styles.smallHotBody}>
        <span>HOT</span>
        <h3>{product.productName}</h3>

        <div className={styles.smallPrice}>
          <strong>{formatVND(finalPrice)}</strong>
          {product.price && finalPrice < product.price && (
            <small>{formatVND(product.price)}</small>
          )}
        </div>

        <div className={styles.stockBar}>
          <div style={{ width: `${Math.min(90, 40 + discount)}%` }} />
        </div>

        <p>Chỉ còn {product.stock ?? 3} sản phẩm - Sắp hết hàng!</p>

        <button type="button" onClick={onAdd} disabled={adding}>
          {adding ? "Đang thêm..." : "Thêm vào giỏ hàng"}
        </button>
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  const discount = getDiscountPercent(product);
  const finalPrice = getFinalPrice(product);

  return (
    <div className={styles.productCard}>
      <div className={styles.productImageWrap}>
        <img
  src={getProductImage(product)}
  alt={product.productName}
  onError={(e) => (e.currentTarget.src = fallbackImg)}
/>

        {discount > 0 && <span>-{discount}%</span>}
      </div>

      <div className={styles.productInfo}>
        <div className={styles.productMeta}>
          <span>{getBrand(product)}</span>
          <div>★ {product.averageRating || "4.8"}</div>
        </div>

        <h4>{product.productName}</h4>

        <p>
          “Sản phẩm công nghệ được tuyển chọn phù hợp với nhu cầu sử dụng thực
          tế.”
        </p>

        <div className={styles.productPrice}>
          <strong>{formatVND(finalPrice)}</strong>
          {product.price && finalPrice < product.price && (
            <small>{formatVND(product.price)}</small>
          )}
        </div>
      </div>

      <div className={styles.productBottom}>
        <div>✓ {product.categoryName || "Sản phẩm công nghệ chính hãng"}</div>
        <Link to={`/products/${product.productId}`}>Xem review chi tiết</Link>
      </div>
    </div>
  );
}

function ArticleCard({ post }) {
  return (
    <article className={styles.articleCard}>
      <div className={styles.articleImage}>
        <img
  src={getImageUrl(post.mainImageUrl || post.imageUrl)}
  alt={post.title}
  onError={(e) => (e.currentTarget.src = fallbackImg)}
/>
      </div>

      <div>
        <span>Tư vấn</span>
        <h3>{post.title}</h3>
        <p>{post.summary}</p>
      </div>
    </article>
  );
}

function StaticArticle({ title, desc, tag, image }) {
  return (
    <article className={styles.articleCard}>
      <div className={styles.articleImage}>
        <img src={image} alt={title} />
      </div>

      <div>
        <span>{tag}</span>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </article>
  );
}