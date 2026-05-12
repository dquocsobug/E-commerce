import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cartApi, productApi } from "../api";
import { formatVND } from "../utils/format";
import styles from "./CartPage.module.css";

const getImageUrl = (url) => {
  if (!url) return "/images/placeholder.png"; // fallback nếu null

  // Nếu backend trả full link thì dùng luôn
  if (url.startsWith("http")) return url;

  // Nếu bạn dùng public/images
  return `/images/${url}`;
};

export default function CartPage() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const items = cart?.items || [];
  const totalItems = cart?.totalItems || items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = cart?.totalAmount || items.reduce((sum, i) => sum + i.subtotal, 0);

  const freeShipTarget = 6600000;
  const remainForFreeShip = Math.max(0, freeShipTarget - totalAmount);
  const progress = Math.min(100, Math.round((totalAmount / freeShipTarget) * 100));

  const inStockItems = useMemo(
    () => items.filter((item) => item.product?.stock > 0),
    [items]
  );

  const fetchCart = async () => {
  try {
    setLoading(true);

    const res = await cartApi.getCart();
    const cartData = res?.data || res;

    const enrichedItems = await Promise.all(
      (cartData.items || []).map(async (item) => {
        try {
          const productRes = await productApi.getById(item.product.productId);
          const fullProduct = productRes?.data || productRes;

          const finalPrice =
            fullProduct.discountedPrice && fullProduct.discountedPrice < fullProduct.price
              ? fullProduct.discountedPrice
              : fullProduct.price;

          return {
            ...item,
            product: {
              ...item.product,
              ...fullProduct,
            },
            subtotal: finalPrice * item.quantity,
          };
        } catch {
          return item;
        }
      })
    );

    const newTotalAmount = enrichedItems.reduce(
      (sum, item) => sum + Number(item.subtotal || 0),
      0
    );

    setCart({
      ...cartData,
      items: enrichedItems,
      totalAmount: newTotalAmount,
    });
  } catch (err) {
    console.error("Lỗi tải giỏ hàng:", err);
  } finally {
    setLoading(false);
  }
};

  const fetchFeatured = async () => {
    try {
      const res = await productApi.getFeatured?.();
      const data = res?.data || res || [];
      setFeatured(Array.isArray(data) ? data.slice(0, 3) : []);
    } catch {
      setFeatured([]);
    }
  };

  useEffect(() => {
    fetchCart();
    fetchFeatured();
  }, []);

  const handleUpdateQuantity = async (cartItemId, nextQuantity) => {
    if (nextQuantity < 1) return;

    try {
      setUpdatingId(cartItemId);
      await cartApi.updateItem(cartItemId, nextQuantity);
      await fetchCart();
    } catch (err) {
      console.error("Lỗi cập nhật số lượng:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (cartItemId) => {
    try {
      setUpdatingId(cartItemId);
      await cartApi.removeItem(cartItemId);
      await fetchCart();
    } catch (err) {
      console.error("Lỗi xóa sản phẩm:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>Đang tải giỏ hàng...</div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.pageTitle}>
        <h1>Giỏ hàng của bạn</h1>
        <p>
          Đang có {totalItems} sản phẩm được giám tuyển trong danh sách.
        </p>
      </div>

      {items.length === 0 ? (
        <section className={styles.emptyCart}>
          <h2>Giỏ hàng đang trống</h2>
          <p>Hãy khám phá thêm những sản phẩm công nghệ phù hợp với bạn.</p>
          <Link to="/products">Tiếp tục mua sắm</Link>
        </section>
      ) : (
        <div className={styles.layout}>
          <section className={styles.leftColumn}>
            <div className={styles.shippingBox}>
              <span className={styles.shippingIcon}>🚚</span>

              <div>
                <p>Bạn sắp được freeship!</p>
                <small>
                  {remainForFreeShip > 0 ? (
                    <>
                      Mua thêm <b>{formatVND(remainForFreeShip)}</b> để nhận ưu đãi
                      miễn phí vận chuyển toàn quốc.
                    </>
                  ) : (
                    <>Bạn đã đủ điều kiện nhận ưu đãi miễn phí vận chuyển.</>
                  )}
                </small>

                <div className={styles.progressBar}>
                  <div style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            <div className={styles.itemList}>
              {items.map((item) => (
                <CartItem
                  key={item.cartItemId}
                  item={item}
                  disabled={updatingId === item.cartItemId}
                  onIncrease={() =>
                    handleUpdateQuantity(item.cartItemId, item.quantity + 1)
                  }
                  onDecrease={() =>
                    handleUpdateQuantity(item.cartItemId, item.quantity - 1)
                  }
                  onRemove={() => handleRemove(item.cartItemId)}
                />
              ))}
            </div>

            <section className={styles.featuredSection}>
              <div className={styles.featuredHead}>
                <div>
                  <span>KHÁM PHÁ THÊM</span>
                  <h2>Bạn có thể quan tâm</h2>
                </div>

                <Link to="/products">Xem tất cả</Link>
              </div>

              <div className={styles.featuredGrid}>
                {featured.map((product) => (
                  <Link
                    key={product.productId}
                    to={`/products/${product.productId}`}
                    className={styles.featuredCard}
                  >
                    <div>
                      <img
                        src={getImageUrl(product.mainImageUrl)}
                        alt={product.productName}
                      />
                    </div>

                    <h4>{product.productName}</h4>
                    <p>{formatVND(product.discountedPrice || product.price)}</p>
                  </Link>
                ))}
              </div>
            </section>
          </section>

          <aside className={styles.summary}>
            <div className={styles.summaryBox}>
              <h2>Tóm tắt đơn hàng</h2>

              <div className={styles.summaryRows}>
                <SummaryRow label="Tổng số sản phẩm" value={totalItems} />
                <SummaryRow label="Tạm tính" value={formatVND(totalAmount)} />
                <SummaryRow
                  label="Phí vận chuyển"
                  value="Liên hệ sau"
                  primary
                />
              </div>

              <div className={styles.voucher}>
                <label>MÃ GIẢM GIÁ</label>

                <div>
                  <input placeholder="TECHCURATOR10" />
                  <button>ÁP DỤNG</button>
                </div>
              </div>

              <div className={styles.totalBox}>
                <div className={styles.totalLine}>
                  <span>Tổng tiền</span>

                  <div>
                    <p>{formatVND(totalAmount)}</p>
                    <small>(Đã bao gồm VAT)</small>
                  </div>
                </div>

                <div className={styles.summaryActions}>
                  <button
                    onClick={() => navigate("/checkout")}
                    disabled={inStockItems.length === 0}
                  >
                    TIẾN HÀNH THANH TOÁN <span>→</span>
                  </button>

                  <button onClick={() => navigate("/products")}>
                    TIẾP TỤC MUA SẮM
                  </button>
                </div>
              </div>

              <div className={styles.secureBox}>
                <span>🛡️</span>

                <div>
                  <p>Thanh toán bảo mật</p>
                  <small>
                    Chúng tôi sử dụng mã hóa SSL 256-bit để đảm bảo mọi giao dịch
                    của bạn luôn được an toàn tuyệt đối.
                  </small>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

function CartItem({ item, disabled, onIncrease, onDecrease, onRemove }) {
  const product = item.product;
  const outOfStock = product?.stock <= 0;

  return (
    <div className={`${styles.cartItem} ${outOfStock ? styles.outOfStock : ""}`}>
      <div className={styles.itemImage}>
        <img src={getImageUrl(product?.mainImageUrl)} alt={product?.productName} />
      </div>

      <div className={styles.itemInfo}>
        <div className={styles.itemTop}>
          <div>
            <span>{product?.categoryName || "Sản phẩm"}</span>
            <h3>{product?.productName}</h3>
          </div>

          <button onClick={onRemove} disabled={disabled} className={styles.deleteBtn}>
            🗑
          </button>
        </div>

        <div className={styles.ratingLine}>
          <div>★★★★☆</div>
          <span>Sản phẩm này được đánh giá cao</span>
        </div>

        {!outOfStock && (
          <div className={styles.links}>
            <Link to={`/products/${product?.productId}`}>💬 Xem review sản phẩm</Link>
            <Link to={`/posts?productId=${product?.productId}`}>
  📰 Xem bài viết liên quan
</Link>
          </div>
        )}

        <div className={styles.itemBottom}>
          <div className={styles.quantityBox}>
            <button onClick={onDecrease} disabled={disabled || item.quantity <= 1}>
              -
            </button>
            <span>{item.quantity}</span>
            <button
              onClick={onIncrease}
              disabled={disabled || item.quantity >= product?.stock}
            >
              +
            </button>
          </div>

          <div className={styles.itemPrice}>
            <p className={outOfStock ? styles.stockError : styles.stockOk}>
              <i /> {outOfStock ? "Hết hàng" : "Còn hàng"}
            </p>
            <strong>{formatVND(item.subtotal)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, primary }) {
  return (
    <div className={styles.summaryRow}>
      <span>{label}</span>
      <strong className={primary ? styles.primaryText : ""}>{value}</strong>
    </div>
  );
}