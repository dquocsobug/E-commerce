import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { postApi, productApi } from "../api";
import styles from "./PostListPage.module.css";

const fallbackImg =
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80";

const authorName = (post) =>
  post?.author?.fullName || post?.authorName || "Admin TechCurator";

const getImageUrl = (url) => {
  if (!url) return fallbackImg;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/images")) return url;
  return `/images/${url}`;
};

const postImage = (post) =>
  getImageUrl(
    post?.mainImageUrl ||
    post?.imageUrl ||
    post?.images?.[0]?.imageUrl
  );

const guessTag = (post) => {
  const title = (post?.title || "").toLowerCase();

  if (title.includes("review") || title.includes("đánh giá")) return "Review";
  if (title.includes("hướng dẫn") || title.includes("cách")) return "Hướng dẫn";
  if (title.includes("so sánh") || title.includes("vs")) return "So sánh";
  if (title.includes("tin") || title.includes("ra mắt")) return "Tin công nghệ";

  return "Review sản phẩm";
};

const ADMIN_EMAILS = ["admin@gmail.com", "writer@gmail.com"];

const isCustomerPost = (post) => {
  const email = post?.author?.email?.toLowerCase() || "";

  return !ADMIN_EMAILS.includes(email);
};

export default function PostListPage() {
  const [searchParams] = useSearchParams();
const productId = searchParams.get("productId");
  const [posts, setPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [authorFilter, setAuthorFilter] = useState("ALL");
  const [tagFilter, setTagFilter] = useState("ALL");
  const [sort, setSort] = useState("NEWEST");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postRes, productRes] = await Promise.allSettled([
          postApi.getAll({
  page: 0,
  size: 12,
  productId: productId || undefined,
}),
          productApi.getAll({ page: 0, size: 6 }),
        ]);

        if (postRes.status === "fulfilled") {
          const data = postRes.value;
          setPosts(data?.content || data?.data?.content || data?.data || []);
        }

        if (productRes.status === "fulfilled") {
          const data = productRes.value;
          setProducts(data?.content || data?.data?.content || data?.data || []);
        }
      } catch (err) {
        console.error("Lỗi tải bài viết:", err);
      }
    };

    fetchData();
  }, [productId]);

  const spotlight = posts[0];

  const filteredPosts = useMemo(() => {
  let result = posts.filter((p) => p.postId !== spotlight?.postId);

  if (authorFilter === "ADMIN") {
    result = result.filter((p) => !isCustomerPost(p));
  }

  if (authorFilter === "CUSTOMER") {
    result = result.filter((p) => isCustomerPost(p));
  }

  if (tagFilter !== "ALL") {
    result = result.filter((p) => guessTag(p) === tagFilter);
  }

  if (sort === "OLDEST") {
    result = [...result].reverse();
  }

  return result;
}, [posts, spotlight, authorFilter, tagFilter, sort]);

  return (
    <main className={styles.page}>
      <section className={styles.main}>
        <header className={styles.header}>
          <h1>
            Khám phá Công nghệ qua góc nhìn{" "}
            <span>Giám tuyển</span>
          </h1>
          <p>
            Chúng tôi không chỉ đưa tin, chúng tôi chọn lọc những tinh hoa công
            nghệ đỉnh cao nhất để định hình tương lai số của bạn.
          </p>
        </header>

        {spotlight && <SpotlightPost post={spotlight} />}

        <div className={styles.layout}>
          <div className={styles.content}>
            <Toolbar
              authorFilter={authorFilter}
              setAuthorFilter={setAuthorFilter}
              tagFilter={tagFilter}
              setTagFilter={setTagFilter}
              sort={sort}
              setSort={setSort}
            />

            <div className={styles.articleGrid}>
              {filteredPosts.map((post) => (
                <ArticleCard key={post.postId} post={post} />
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className={styles.emptyBox}>
                Không có bài viết phù hợp với bộ lọc hiện tại.
              </div>
            )}

            <div className={styles.loadMore}>
              <Link to={productId ? `/posts?productId=${productId}` : "/posts"}>
  Xem thêm bài viết
</Link>
            </div>
          </div>

          <aside className={styles.sidebar}>
            <MostMentioned products={products} />

            <div className={styles.hotBox}>
              <h4>Chủ đề đang hot</h4>
              <div>
                {[
                  "#AppleEvent",
                  "#AIComputing",
                  "#ReviewDạo",
                  "#DeskSetup",
                  "#GamingGear",
                  "#SmartHome",
                ].map((tag) => (
                  <button key={tag}>{tag}</button>
                ))}
              </div>
            </div>

            <div className={styles.newsletter}>
              <h4>Đăng ký nhận bản tin sớm nhất</h4>
              <p>
                Những cập nhật công nghệ quan trọng nhất, gửi trực tiếp vào hòm
                thư của bạn mỗi sáng Thứ Hai.
              </p>
              <form>
                <input type="email" placeholder="Email của bạn" />
                <button type="button">Đăng ký ngay</button>
              </form>
              <div className={styles.newsGlow}></div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function SpotlightPost({ post }) {
  return (
    <section className={styles.spotlight}>
      <div className={styles.spotImage}>
        <img
  src={postImage(post)}
  alt={post.title}
  onError={(e) => (e.currentTarget.src = fallbackImg)}
/>
        <div />
      </div>

      <div className={styles.spotContent}>
        <div className={styles.spotMeta}>
          <span>Bản tin đặc biệt</span>
          <small>10 phút đọc</small>
        </div>

        <h2>{post.title}</h2>

        <p>{post.summary || post.content || "Bài viết nổi bật từ TechCurator."}</p>

        <div className={styles.authorRow}>
          <div className={styles.avatar}>
            {authorName(post).charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{authorName(post)}</strong>
            <small>Giám đốc Nội dung</small>
          </div>
        </div>

        <Link to={`/posts/${post.postId}`} className={styles.primaryBtn}>
          Đọc bài viết ngay <span>→</span>
        </Link>
      </div>
    </section>
  );
}

function Toolbar({
  authorFilter,
  setAuthorFilter,
  tagFilter,
  setTagFilter,
  sort,
  setSort,
}) {
  const tags = ["Review sản phẩm", "Hướng dẫn", "So sánh", "Tin công nghệ"];

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarTop}>
        <div className={styles.segment}>
          <button
            className={authorFilter === "ALL" ? styles.active : ""}
            onClick={() => setAuthorFilter("ALL")}
          >
            Tất cả
          </button>
          <button
            className={authorFilter === "ADMIN" ? styles.active : ""}
            onClick={() => setAuthorFilter("ADMIN")}
          >
            Đội ngũ Admin
          </button>
          <button
            className={authorFilter === "CUSTOMER" ? styles.active : ""}
            onClick={() => setAuthorFilter("CUSTOMER")}
          >
            Khách hàng <em>Đã mua hàng</em>
          </button>
        </div>

        <div className={styles.sortBox}>
          <span>Sắp xếp:</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="NEWEST">Mới nhất</option>
            <option value="OLDEST">Cũ nhất</option>
          </select>
        </div>
      </div>

      <div className={styles.tagRow}>
        <button
          onClick={() => setTagFilter("ALL")}
          className={tagFilter === "ALL" ? styles.tagActive : ""}
        >
          Tất cả
        </button>

        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setTagFilter(tag)}
            className={tagFilter === tag ? styles.tagActive : ""}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

function ArticleCard({ post }) {
  const customer = isCustomerPost(post);
  const tag = customer ? "Đã mua hàng" : guessTag(post);

  return (
    <article className={styles.articleCard}>
      <Link to={`/posts/${post.postId}`} className={styles.cardImage}>
        <img
  src={postImage(post)}
  alt={post.title}
  onError={(e) => (e.currentTarget.src = fallbackImg)}
/>
        <span className={customer ? styles.customerBadge : ""}>{tag}</span>
      </Link>

      <div className={styles.cardBody}>
        {!customer && (
          <div className={styles.rating}>
            <span>★★★★★</span>
            <strong>(4.9/5)</strong>
          </div>
        )}

        {customer && <div className={styles.experience}>Trải nghiệm người dùng</div>}

        <Link to={`/posts/${post.postId}`} className={styles.cardTitle}>
          {post.title}
        </Link>

        <p>{post.summary || "Bài viết chia sẻ góc nhìn công nghệ hữu ích."}</p>

        <div className={styles.cardFooter}>
          <div className={styles.authorInfo}>
            <div className={styles.avatarSmall}>
              {authorName(post).charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{authorName(post)}</strong>
              <small>{customer ? "Khách hàng" : "Đội ngũ Admin"}</small>
            </div>
          </div>

          <div className={styles.cardStats}>
            <span>👁 {post.viewCount || "1.2k"}</span>
            <span>{post.createdAt?.slice(0, 10) || "2026"}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function MostMentioned({ products }) {
  const data = products.slice(0, 3);

  return (
    <div className={styles.mentioned}>
      <h4>
        <span>↗</span>
        Nhắc đến nhiều nhất
      </h4>

      <div className={styles.mentionedList}>
        {data.map((product, index) => (
          <Link
            to={`/products/${product.productId}`}
            key={product.productId}
            className={styles.mentionedItem}
          >
            <div className={styles.productThumb}>
              <img
  src={getImageUrl(product.mainImageUrl)}
  alt={product.productName}
  onError={(e) => (e.currentTarget.src = fallbackImg)}
/>
            </div>

            <div>
              <strong>{product.productName}</strong>
              <small>{45 - index * 8} bài viết</small>
            </div>

            <span>›</span>
          </Link>
        ))}

        {data.length === 0 && (
          <p className={styles.noMention}>Chưa có sản phẩm nổi bật.</p>
        )}
      </div>
    </div>
  );
}