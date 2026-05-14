import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useCart } from "../context/CartContext";
import styles from "./ProductsListPage.module.css";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatPrice = (n) => n?.toLocaleString("vi-VN") + "₫";

const StarRating = ({ rating }) => (
  <div className={styles.stars}>
    {[1, 2, 3, 4, 5].map((i) => (
      <span
        key={i}
        className={i <= Math.round(rating) ? styles.starOn : styles.starOff}
      >
        ★
      </span>
    ))}
  </div>
);

const getImageUrl = (url) => {
  if (!url) return "/images/placeholder.png";
  if (url.startsWith("http")) return url;
  return `/images/${url}`;
};

const categoryIcons = ["📱", "💻", "📟", "🧩", "🎧", "🎁", "⌚", "📺", "🏠", "📷"];

const serviceItems = [
  { icon: "🚚", title: "Giao hàng nhanh", desc: "Miễn phí từ 500K" },
  { icon: "🔄", title: "Đổi trả 7 ngày", desc: "Hoàn tiền nếu lỗi" },
  { icon: "💳", title: "Thanh toán linh hoạt", desc: "COD, thẻ, ví điện tử" },
  { icon: "🎧", title: "Hỗ trợ 24/7", desc: "Tư vấn mọi lúc" },
];

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ product }) => {
  const hasDiscount =
    product.discountedPrice && product.discountedPrice < product.price;

  const { addToCart } = useCart?.() || {};
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!addToCart) return;

    try {
      setAdding(true);
      await addToCart(product.productId, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link to={`/products/${product.productId}`} className={styles.card}>
      <div className={styles.cardImageWrap}>
        {hasDiscount && (
          <span className={styles.cardBadge}>-{product.discountPercent}%</span>
        )}

        {product.stock === 0 && (
          <div className={styles.cardOutOfStock}>Hết hàng</div>
        )}

        <img
          src={getImageUrl(product.mainImageUrl)}
          alt={product.productName}
          className={styles.cardImage}
          loading="lazy"
        />

        <div className={styles.cardOverlay}>
          <div className={styles.overlayActions}>
            <span className={styles.overlayBtn} title="Xem chi tiết">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>

            <button
              className={`${styles.overlayBtn} ${
                added ? styles.overlayBtnAdded : ""
              }`}
              title="Thêm vào giỏ hàng"
              onClick={handleAddToCart}
              disabled={adding || product.stock === 0}
            >
              {added ? "✓" : "🛒"}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.cardBody}>
        <span className={styles.cardCategory}>{product.categoryName}</span>

        <h3 className={styles.cardName}>{product.productName}</h3>

        <div className={styles.cardMeta}>
          <StarRating rating={product.averageRating} />
          <span className={styles.cardReviewCount}>({product.reviewCount})</span>
        </div>

        <div className={styles.cardPricing}>
          {hasDiscount ? (
            <>
              <span className={styles.priceNew}>
                {formatPrice(product.discountedPrice)}
              </span>
              <span className={styles.priceOld}>
                {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className={styles.priceNew}>
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {product.stock > 0 && product.stock <= 5 && (
          <span className={styles.lowStock}>
            Chỉ còn {product.stock} sản phẩm
          </span>
        )}
      </div>
    </Link>
  );
};

// ─── Price Range Slider ───────────────────────────────────────────────────────
const PriceRangeInput = ({ min, max, value, onChange }) => {
  const [localMin, setLocalMin] = useState(value[0]);
  const [localMax, setLocalMax] = useState(value[1]);
  const trackRef = useRef(null);

  useEffect(() => {
    setLocalMin(value[0]);
    setLocalMax(value[1]);
  }, [value]);

  const toPercent = (v) => ((v - min) / (max - min)) * 100;

  const commitChange = () => {
    onChange([localMin, localMax]);
  };

  return (
    <div className={styles.priceRange}>
      <div className={styles.priceRangeTrack} ref={trackRef}>
        <div
          className={styles.priceRangeFill}
          style={{
            left: `${toPercent(localMin)}%`,
            width: `${toPercent(localMax) - toPercent(localMin)}%`,
          }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={100000}
          value={localMin}
          className={`${styles.rangeInput} ${styles.rangeMin}`}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), localMax - 100000);
            setLocalMin(v);
          }}
          onMouseUp={commitChange}
          onTouchEnd={commitChange}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={100000}
          value={localMax}
          className={`${styles.rangeInput} ${styles.rangeMax}`}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), localMin + 100000);
            setLocalMax(v);
          }}
          onMouseUp={commitChange}
          onTouchEnd={commitChange}
        />
      </div>

      <div className={styles.priceRangeLabels}>
        <span>{formatPrice(localMin)}</span>
        <span>{formatPrice(localMax)}</span>
      </div>
    </div>
  );
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className={styles.skeleton}>
    <div className={styles.skeletonImg} />
    <div className={styles.skeletonBody}>
      <div className={styles.skeletonLine} style={{ width: "40%" }} />
      <div className={styles.skeletonLine} style={{ width: "80%" }} />
      <div className={styles.skeletonLine} style={{ width: "60%" }} />
    </div>
  </div>
);

// ─── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "", label: "Mặc định" },
  { value: "price,asc", label: "Giá: Thấp → Cao" },
  { value: "price,desc", label: "Giá: Cao → Thấp" },
  { value: "averageRating,desc", label: "Đánh giá cao nhất" },
  { value: "createdAt,desc", label: "Mới nhất" },
];

const PRICE_MIN = 0;
const PRICE_MAX = 50000000;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");

  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get("categoryId")
      ? [Number(searchParams.get("categoryId"))]
      : []
  );

  const [priceRange, setPriceRange] = useState([
    Number(searchParams.get("minPrice")) || PRICE_MIN,
    Number(searchParams.get("maxPrice")) || PRICE_MAX,
  ]);

  const [sort, setSort] = useState(searchParams.get("sort") || "");
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState("grid");
  const [flashTime, setFlashTime] = useState({
  hours: 12,
  minutes: 37,
  seconds: 16,
});
  const [sidebarOpen, setSidebarOpen] = useState(false);
const [inputValue, setInputValue] = useState(keyword);
const debounceRef = useRef(null);
const {
  data: categoriesData = [],
  isLoading: catLoading,
} = useQuery({
  queryKey: ["categories"],
  queryFn: async () => {
    const res = await axiosClient.get("/categories");
    return res?.data?.data || res?.data || res || [];
  },
  staleTime: 1000 * 60 * 30,
});

const categories = categoriesData;

const {
  data: productData,
  isLoading,
  isFetching,
} = useQuery({
  queryKey: [
    "products",
    page,
    keyword,
    selectedCategories,
    priceRange,
    sort,
  ],

  queryFn: async () => {
    const params = { page, size: 12 };

    if (keyword) params.keyword = keyword;

    if (selectedCategories.length === 1) {
      params.categoryId = selectedCategories[0];
    }

    if (priceRange[0] > PRICE_MIN) {
      params.minPrice = priceRange[0];
    }

    if (priceRange[1] < PRICE_MAX) {
      params.maxPrice = priceRange[1];
    }

    if (sort) params.sort = sort;

    const res = await axiosClient.get("/products", { params });

    return res?.data?.data || res?.data || res;
  },

  placeholderData: keepPreviousData,
});

const products = productData?.content || [];
const totalPages = productData?.totalPages || 0;
const totalElements = productData?.totalElements || 0;
const loading = isLoading;


  useEffect(() => {
  const timer = setInterval(() => {
    setFlashTime((prev) => {
      let { hours, minutes, seconds } = prev;

      if (seconds > 0) {
        seconds--;
      } else {
        if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else {
          if (hours > 0) {
            hours--;
            minutes = 59;
            seconds = 59;
          } else {
            hours = 12;
            minutes = 37;
            seconds = 16;
          }
        }
      }

      return { hours, minutes, seconds };
    });
  }, 1000);

  return () => clearInterval(timer);
}, []);



  useEffect(() => {
    const p = {};

    if (keyword) p.keyword = keyword;
    if (selectedCategories.length === 1) p.categoryId = selectedCategories[0];
    if (priceRange[0] > PRICE_MIN) p.minPrice = priceRange[0];
    if (priceRange[1] < PRICE_MAX) p.maxPrice = priceRange[1];
    if (sort) p.sort = sort;
    if (page > 0) p.page = page;

    setSearchParams(p, { replace: true });
  }, [keyword, selectedCategories, priceRange, sort, page, setSearchParams]);

  const handleKeywordChange = (e) => {
    setInputValue(e.target.value);
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setKeyword(e.target.value);
      setPage(0);
    }, 400);
  };

  const handleCategoryToggle = (id) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? [] : [id]
    );
    setPage(0);
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
    setPage(0);
  };

  const handlePriceChange = (range) => {
    setPriceRange(range);
    setPage(0);
  };

  const handleClearFilters = () => {
    setKeyword("");
    setInputValue("");
    setSelectedCategories([]);
    setPriceRange([PRICE_MIN, PRICE_MAX]);
    setSort("");
    setPage(0);
  };

  const hasActiveFilters =
    keyword ||
    selectedCategories.length > 0 ||
    priceRange[0] > PRICE_MIN ||
    priceRange[1] < PRICE_MAX ||
    sort;

  const activeFilterCount = [
    keyword ? 1 : 0,
    selectedCategories.length > 0 ? 1 : 0,
    priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX ? 1 : 0,
    sort ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className={styles.page}>
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Header bar ── */}
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.breadcrumb}>
            <Link to="/" className={styles.breadcrumbLink}>
              Trang chủ
            </Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span>Sản phẩm</span>
          </div>

          <div className={styles.searchWrap}>
            <svg
              className={styles.searchIcon}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>

            <input
              className={styles.searchInput}
              type="text"
              placeholder="Tìm sản phẩm..."
              value={inputValue}
              onChange={handleKeywordChange}
            />

            {inputValue && (
              <button
                className={styles.searchClear}
                onClick={() => {
                  setInputValue("");
                  setKeyword("");
                  setPage(0);
                }}
              >
                ✕
              </button>
            )}
          </div>

          <div className={styles.topBarRight}>
            <select
  className={styles.priceQuickFilter}
  value={`${priceRange[0]}-${priceRange[1]}`}
  onChange={(e) => {
    const value = e.target.value;

    if (value === "all") {
      setPriceRange([PRICE_MIN, PRICE_MAX]);
      return;
    }

    const [min, max] = value.split("-").map(Number);
    setPriceRange([min, max]);
    setPage(0);
  }}
>
  <option value="all">Tất cả mức giá</option>
  <option value="0-1000000">Dưới 1 triệu</option>
  <option value="1000000-5000000">1 - 5 triệu</option>
  <option value="5000000-10000000">5 - 10 triệu</option>
  <option value="10000000-20000000">10 - 20 triệu</option>
  <option value="20000000-50000000">Trên 20 triệu</option>
</select>
            <select
              className={styles.sortSelect}
              value={sort}
              onChange={handleSortChange}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewBtn} ${
                  viewMode === "grid" ? styles.viewBtnActive : ""
                }`}
                onClick={() => setViewMode("grid")}
                title="Lưới"
              >
                ▦
              </button>

              <button
                className={`${styles.viewBtn} ${
                  viewMode === "list" ? styles.viewBtnActive : ""
                }`}
                onClick={() => setViewMode("list")}
                title="Danh sách"
              >
                ☰
              </button>
            </div>

            <button
              className={`${styles.filterToggleBtn} ${
                sidebarOpen ? styles.filterToggleBtnActive : ""
              }`}
              onClick={() => setSidebarOpen((v) => !v)}
            >
              Bộ lọc
              {activeFilterCount > 0 && (
                <span className={styles.filterBadge}>{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Category + Service + Flash Sale ── */}
      <div className={styles.shopHeader}>
        <div className={styles.categoryShortcut}>
          <button
            className={`${styles.categoryCard} ${
              selectedCategories.length === 0 ? styles.categoryCardActive : ""
            }`}
            onClick={() => {
              setSelectedCategories([]);
              setPage(0);
            }}
          >
            <span className={styles.categoryIcon}>🛒</span>
            <span>Tất cả</span>
          </button>

          {catLoading
            ? Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className={styles.categoryCardSkeleton} />
              ))
            : categories.map((cat, index) => (
                <button
                  key={cat.categoryId}
                  className={`${styles.categoryCard} ${
                    selectedCategories.includes(cat.categoryId)
                      ? styles.categoryCardActive
                      : ""
                  }`}
                  onClick={() => handleCategoryToggle(cat.categoryId)}
                >
                  <span className={styles.categoryIcon}>
                    {categoryIcons[index % categoryIcons.length]}
                  </span>
                  <span>{cat.categoryName}</span>
                </button>
              ))}
        </div>

        <div className={styles.serviceBar}>
          {serviceItems.map((item) => (
            <div key={item.title} className={styles.serviceItem}>
              <span className={styles.serviceIcon}>{item.icon}</span>
              <div>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.flashSaleBar}>
          <div className={styles.flashLeft}>
            <span className={styles.flashIcon}>⚡</span>
            <div>
              <h3>FLASH SALE</h3>
              <p>Giảm giá sốc - Số lượng có hạn</p>
            </div>
          </div>

          <div className={styles.flashRight}>
            <span>Kết thúc sau</span>
            <div className={styles.flashRight}>
  <span>Kết thúc sau</span>

  <strong>{String(flashTime.hours).padStart(2, "0")}</strong>
  <span className={styles.flashColon}>:</span>

  <strong>{String(flashTime.minutes).padStart(2, "0")}</strong>
  <span className={styles.flashColon}>:</span>

  <strong>{String(flashTime.seconds).padStart(2, "0")}</strong>
</div>
            <Link to="/promotions" className={styles.flashBtn}>
              Xem tất cả →
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.layout}>
        {/* ── SIDEBAR FILTER PRICE ── */}

        {/* ── MAIN CONTENT ── */}
        <main className={styles.main}>
          <div className={styles.resultBar}>
            {loading ? (
              <span className={styles.resultText}>Đang tải...</span>
            ) : (
              <span className={styles.resultText}>
                {totalElements > 0
                  ? `${totalElements} sản phẩm`
                  : "Không có sản phẩm"}
                {keyword && (
                  <>
                    {" "}
                    cho "<strong>{keyword}</strong>"
                  </>
                )}
              </span>
            )}

            <div className={styles.filterChips}>
              {selectedCategories.length > 0 &&
                categories
                  .filter((c) => selectedCategories.includes(c.categoryId))
                  .map((c) => (
                    <span key={c.categoryId} className={styles.chip}>
                      {c.categoryName}
                      <button onClick={() => handleCategoryToggle(c.categoryId)}>
                        ✕
                      </button>
                    </span>
                  ))}

              {(priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX) && (
                <span className={styles.chip}>
                  {formatPrice(priceRange[0])} – {formatPrice(priceRange[1])}
                  <button
                    onClick={() => {
                      setPriceRange([PRICE_MIN, PRICE_MAX]);
                      setPage(0);
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}

              {sort && (
                <span className={styles.chip}>
                  {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                  <button
                    onClick={() => {
                      setSort("");
                      setPage(0);
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🔍</div>
              <h3 className={styles.emptyTitle}>Không tìm thấy sản phẩm</h3>
              <p className={styles.emptyDesc}>
                Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.
              </p>
              <button
                className={styles.emptyBtn}
                onClick={handleClearFilters}
              >
                Xoá bộ lọc
              </button>
            </div>
          ) : (
            <div
              className={`${styles.grid} ${
                viewMode === "list" ? styles.gridList : ""
              }`}
            >
              {products.map((p) => (
                <ProductCard key={p.productId} product={p} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page === 0}
                onClick={() => setPage(0)}
              >
                «
              </button>

              <button
                className={styles.pageBtn}
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i)
                .filter((i) => Math.abs(i - page) <= 2)
                .map((i) => (
                  <button
                    key={i}
                    className={`${styles.pageBtn} ${
                      i === page ? styles.pageBtnActive : ""
                    }`}
                    onClick={() => setPage(i)}
                  >
                    {i + 1}
                  </button>
                ))}

              <button
                className={styles.pageBtn}
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                ›
              </button>

              <button
                className={styles.pageBtn}
                disabled={page >= totalPages - 1}
                onClick={() => setPage(totalPages - 1)}
              >
                »
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}