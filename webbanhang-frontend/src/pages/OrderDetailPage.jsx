import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { orderApi, productApi, postApi } from "../api";
import { formatVND } from "../utils/format";
import styles from "./OrderDetailPage.module.css";

const fallbackImg =
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80";

const imageUrl = (url) => {
  if (!url) return fallbackImg;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/images")) return url;
  return `/images/${url}`;
};

const statusMap = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

const paymentMap = {
  CASH: "Tiền mặt",
  COD: "Thanh toán khi nhận hàng",
  BANK_TRANSFER: "Chuyển khoản",
  MOMO: "MoMo",
  VNPAY: "VNPay",
  APPLE_PAY: "Apple Pay",
};

const stepByStatus = {
  PENDING: 1,
  CONFIRMED: 2,
  SHIPPING: 3,
  DELIVERED: 4,
  CANCELLED: 1,
};

export default function OrderDetailPage() {
  const { id } = useParams();

  const [cancelling, setCancelling] = useState(false);

const {
  data: orderDetailData = {
    order: null,
    relatedProducts: [],
    guides: [],
  },
  isLoading: loading,
  error,
  refetch,
} = useQuery({
  queryKey: ["order-detail", id],
  queryFn: async () => {
    const [orderRes, productRes, postRes] = await Promise.allSettled([
      orderApi.getOrderById(id),
      productApi.getAll?.({ page: 0, size: 2 }),
      postApi.getAll?.({ page: 0, size: 2 }),
    ]);

    if (orderRes.status !== "fulfilled") {
      throw orderRes.reason;
    }

    const order = orderRes.value?.data || orderRes.value;

    let relatedProducts = [];
    let guides = [];

    if (productRes.status === "fulfilled") {
      const data =
        productRes.value?.content ||
        productRes.value?.data?.content ||
        [];
      relatedProducts = data.slice(0, 2);
    }

    if (postRes.status === "fulfilled") {
      const data =
        postRes.value?.content ||
        postRes.value?.data?.content ||
        [];
      guides = data.slice(0, 2);
    }

    return {
      order,
      relatedProducts,
      guides,
    };
  },
  enabled: !!id,
});

const order = orderDetailData.order;
const relatedProducts = orderDetailData.relatedProducts;
const guides = orderDetailData.guides;


  const currentStep = useMemo(() => {
    if (!order) return 1;
    return stepByStatus[order.status] || 1;
  }, [order]);

  const handleCancelOrder = async () => {
  const confirmed = window.confirm(
    "🛑 Huỷ đơn hàng?\n\n" +
      "Sau khi huỷ:\n" +
      "• Đơn hàng sẽ chuyển sang trạng thái Đã huỷ\n" +
      "• Bạn cần đặt lại nếu muốn mua sản phẩm này\n" +
      "• Hệ thống sẽ hoàn lại tồn kho sản phẩm\n\n" +
      "Bạn có chắc chắn muốn tiếp tục?"
  );

  if (!confirmed) return;

  try {
    setCancelling(true);

    await orderApi.cancelOrder(order.orderId);

    await refetch();
  } catch (err) {
    alert(err?.response?.data?.message || "Không thể hủy đơn hàng");
  } finally {
    setCancelling(false);
  }
};

  const canWritePost = order?.status === "DELIVERED";
  const canCancelOrder = order?.status === "PENDING";

  if (loading) {
    return <div className={styles.loading}>Đang tải chi tiết đơn hàng...</div>;
  }

  if (error || !order) {
  return (
    <div className={styles.errorBox}>
      {error?.response?.data?.message ||
        error?.message ||
        "Không tìm thấy đơn hàng"}
    </div>
  );
}

  return (
    <main className={styles.page}>
      <header className={styles.orderHeader}>
        <div className={styles.headerRow}>
          <div>
            <h1>Đơn hàng #{order.orderId}</h1>
            <p>
              Ngày đặt: {order.createdAt} •{" "}
              <span className={`${styles.statusBadge} ${styles[order.status] || ""}`}>
                {statusMap[order.status] || order.status}
              </span>
            </p>
          </div>

          <div className={styles.headerActions}>
            <button type="button">
              <span>⬇</span>
              Tải hóa đơn PDF
            </button>
          </div>
        </div>

        <div className={styles.timeline}>
          <div className={styles.timelineLine}></div>

          <div className={styles.timelineSteps}>
            <TimelineStep active={currentStep >= 1} label="Đặt hàng" />
            <TimelineStep active={currentStep >= 2} label="Xác nhận" />
            <TimelineStep active={currentStep >= 3} label="Giao hàng" />
            <TimelineStep active={currentStep >= 4} label="Hoàn thành" />
          </div>
        </div>
      </header>

      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          <section className={styles.whiteCard}>
            <h3 className={styles.cardTitle}>
              <span>📦</span>
              Sản phẩm đã mua
            </h3>

            <div className={styles.productList}>
              {order.orderDetails?.map((item) => (
                <div key={item.orderDetailId} className={styles.orderItem}>
                  <div className={styles.itemImage}>
                    <img
                      src={imageUrl(item.product?.mainImageUrl)}
                      alt={item.product?.productName}
                    />
                  </div>

                  <div className={styles.itemInfo}>
                    <span>{item.product?.categoryName || "Sản phẩm"}</span>
                    <h4>{item.product?.productName}</h4>
                    <p>Số lượng: {item.quantity}</p>
                  </div>

                  <div className={styles.itemPrice}>
                    <p>{formatVND(item.subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {canWritePost && (
            <section className={styles.reviewBox}>
              <div className={styles.reviewGlow}></div>

              <div className={styles.reviewContent}>
                <div className={styles.reviewIcon}>✍️</div>

                <div className={styles.reviewText}>
                  <h3>Chia sẻ trải nghiệm của bạn</h3>
                  <p>
                    Bạn đã trải nghiệm sản phẩm hơn 1 tháng. Hãy chia sẻ bài viết
                    đánh giá để giúp người mua khác.
                    <span>
                      Bài viết của bạn có thể được duyệt và nhận voucher giảm giá đến 10%.
                    </span>
                  </p>

                  <div className={styles.reviewActions}>
                    <Link to="/posts/my/create">Viết bài trải nghiệm</Link>
                    <Link to="/posts">Xem mẫu bài viết</Link>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className={styles.rightCol}>
          <section className={styles.sideCard}>
            <h3>Thông tin người nhận</h3>

            <div className={styles.receiverInfo}>
              <div>
                <p>{order.receiverName}</p>
                <span>{order.receiverPhone}</span>
              </div>

              <div>
                <span>{order.shippingAddress}</span>
              </div>
            </div>
          </section>

          <section className={styles.sideCard}>
            <h3>Chi tiết thanh toán</h3>

            <div className={styles.paymentRows}>
              <div>
                <span>Tạm tính</span>
                <span>{formatVND(order.totalAmount)}</span>
              </div>

              <div>
                <span>Phí vận chuyển</span>
                <span className={styles.freeShip}>Miễn phí</span>
              </div>

              <div className={styles.discountRow}>
                <span>Giảm giá voucher</span>
                <span>-{formatVND(order.discountAmount || 0)}</span>
              </div>

              <div className={styles.finalRow}>
                <span>Tổng cộng</span>
                <strong>{formatVND(order.finalAmount)}</strong>
              </div>
            </div>

            <div className={styles.paymentMethod}>
              <span>Phương thức</span>
              <div>
                <span>💳</span>
                <strong>{paymentMap[order.paymentMethod] || order.paymentMethod}</strong>
              </div>
            </div>

            <div className={styles.paymentMethod}>
              <span>Trạng thái</span>
              <div>
                <strong>{order.paymentStatus === "PAID" ? "Đã thanh toán" : order.paymentStatus}</strong>
              </div>
            </div>
          </section>

          {canCancelOrder && (
  <button
    type="button"
    className={styles.cancelOrderBtn}
    onClick={handleCancelOrder}
    disabled={cancelling}
  >
    <span>✕</span>
    {cancelling ? "Đang hủy đơn..." : "Hủy đơn hàng"}
  </button>
)}

<button type="button" className={styles.supportBtn}>
  <span>🎧</span>
  Yêu cầu hỗ trợ
</button>
        </aside>
      </div>

      <section className={styles.recommendSection}>
        <div className={styles.recommendGrid}>
          <div>
            <h2>Sản phẩm liên quan</h2>

            <div className={styles.relatedGrid}>
              {(relatedProducts.length ? relatedProducts : []).map((product) => (
                <Link
                  to={`/products/${product.productId}`}
                  key={product.productId}
                  className={styles.relatedCard}
                >
                  <div>
                    <img
                      src={imageUrl(product.mainImageUrl)}
                      alt={product.productName}
                    />
                  </div>

                  <h4>{product.productName}</h4>
                  <p>{formatVND(product.discountedPrice || product.price)}</p>
                </Link>
              ))}

              {relatedProducts.length === 0 && (
                <>
                  <StaticProduct
                    title="Logitech MX Master 3S"
                    price="2.490.000đ"
                    image="https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80"
                  />
                  <StaticProduct
                    title="AudioEngine A2+ Wireless"
                    price="6.990.000đ"
                    image="https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80"
                  />
                </>
              )}
            </div>
          </div>

          <div>
            <h2>Hướng dẫn dành cho bạn</h2>

            <div className={styles.guideList}>
              {(guides.length ? guides : []).map((post) => (
                <Link
                  to={`/posts/${post.postId}`}
                  key={post.postId}
                  className={styles.guideCard}
                >
                  <div>
                    <img src={imageUrl(post.mainImageUrl)} alt={post.title} />
                  </div>

                  <section>
                    <h4>{post.title}</h4>
                    <p>Đọc trong 5 phút • Hướng dẫn</p>
                  </section>
                </Link>
              ))}

              {guides.length === 0 && (
                <>
                  <StaticGuide
                    title="Cách vệ sinh bàn phím nhôm Keychron đúng cách"
                    meta="Đọc trong 5 phút • Hướng dẫn"
                    image="https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80"
                  />
                  <StaticGuide
                    title="Tối ưu hóa chống ồn trên Sony WH-1000XM5"
                    meta="Đọc trong 4 phút • Thủ thuật"
                    image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function TimelineStep({ active, label }) {
  return (
    <div className={styles.timelineStep}>
      <div className={active ? styles.stepActive : styles.stepInactive}>
        {active ? "✓" : ""}
      </div>
      <span className={active ? styles.stepTextActive : ""}>{label}</span>
    </div>
  );
}

function StaticProduct({ title, price, image }) {
  return (
    <div className={styles.relatedCard}>
      <div>
        <img src={image} alt={title} />
      </div>

      <h4>{title}</h4>
      <p>{price}</p>
    </div>
  );
}

function StaticGuide({ title, meta, image }) {
  return (
    <div className={styles.guideCard}>
      <div>
        <img src={image} alt={title} />
      </div>

      <section>
        <h4>{title}</h4>
        <p>{meta}</p>
      </section>
    </div>
  );
}