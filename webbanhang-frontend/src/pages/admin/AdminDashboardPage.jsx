import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Package,
  ShoppingCart,
  Newspaper,
  Download,
  DollarSign,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Link } from "react-router-dom";
import { userApi, productApi, orderApi, postApi } from "../../api";

const unwrapPayload = (res) => res?.data?.data ?? res?.data ?? res;

const unwrapList = (res) => {
  const payload = unwrapPayload(res);

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;

  return [];
};

const getTotalPages = (res) => {
  const payload = unwrapPayload(res);
  return payload?.totalPages ?? payload?.data?.totalPages ?? 1;
};

const fetchAllPages = async (apiFn, params = {}, size = 100) => {
  const firstRes = await apiFn({ ...params, page: 0, size });
  const firstList = unwrapList(firstRes);
  const totalPages = getTotalPages(firstRes);

  if (totalPages <= 1) return firstList;

  const requests = [];

  for (let page = 1; page < totalPages; page += 1) {
    requests.push(apiFn({ ...params, page, size }));
  }

  const results = await Promise.all(requests);
  return [...firstList, ...results.flatMap(unwrapList)];
};

const formatVND = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value || 0));

const parseDate = (value) => {
  if (!value) return null;
  return new Date(String(value).replace(" ", "T"));
};

const getRevenueKey = (date, type) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (type === "year") return String(year);
  if (type === "month") return `${year}-${month}`;
  return `${year}-${month}-${day}`;
};

const formatRevenueLabel = (key, type) => {
  if (type === "year") return key;
  if (type === "month") {
    const [year, month] = key.split("-");
    return `Tháng ${month}/${year}`;
  }

  const [year, month, day] = key.split("-");
  return `${day}/${month}/${year}`;
};

const paymentMethodLabel = {
  COD: "Thanh toán khi nhận hàng",
  BANK_TRANSFER: "Chuyển khoản",
  MOMO: "Momo",
  VNPAY: "VNPay",
  CASH: "Tiền mặt",
};

export default function AdminDashboardPage() {
  const reportRef = useRef(null);

  const [revenueType, setRevenueType] = useState("day");
  const [exporting, setExporting] = useState(false);

  const {
  data: dashboardData = {
    counts: {
      users: 0,
      products: 0,
      orders: 0,
      posts: 0,
    },
    orders: [],
  },
  isLoading: loading,
} = useQuery({
  queryKey: ["admin-dashboard"],
  queryFn: async () => {
    const [users, products, allOrders, posts] = await Promise.all([
      fetchAllPages(userApi.getAll, {}, 100),
      fetchAllPages(productApi.getAll, {}, 100),
      fetchAllPages(orderApi.getAll, {}, 100),
      fetchAllPages(postApi.getAllAdmin, {}, 100),
    ]);

    return {
      counts: {
        users: users.length,
        products: products.length,
        orders: allOrders.length,
        posts: posts.length,
      },
      orders: allOrders,
    };
  },
});

const counts = dashboardData.counts;
const orders = dashboardData.orders;

  const completedOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.status === "DELIVERED" &&
        order.paymentStatus === "PAID"
    );
  }, [orders]);

  const revenueSummary = useMemo(() => {
    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + Number(order.finalAmount || 0),
      0
    );

    const totalSales = completedOrders.reduce(
      (sum, order) => sum + Number(order.itemCount || 0),
      0
    );

    const averageOrderValue =
      completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    return {
      totalRevenue,
      totalSales,
      averageOrderValue,
      completedOrderCount: completedOrders.length,
    };
  }, [completedOrders]);

  const revenueChartData = useMemo(() => {
    const map = new Map();

    completedOrders.forEach((order) => {
      const date = parseDate(order.createdAt);
      if (!date) return;

      const key = getRevenueKey(date, revenueType);

      const current = map.get(key) || {
        key,
        label: formatRevenueLabel(key, revenueType),
        revenue: 0,
        orders: 0,
      };

      current.revenue += Number(order.finalAmount || 0);
      current.orders += 1;

      map.set(key, current);
    });

    return Array.from(map.values()).sort((a, b) =>
      a.key.localeCompare(b.key)
    );
  }, [completedOrders, revenueType]);

  const paymentChartData = useMemo(() => {
    const map = new Map();

    completedOrders.forEach((order) => {
      const key = order.paymentMethod || "UNKNOWN";

      const current = map.get(key) || {
        key,
        label: paymentMethodLabel[key] || key,
        revenue: 0,
        orders: 0,
      };

      current.revenue += Number(order.finalAmount || 0);
      current.orders += 1;

      map.set(key, current);
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [completedOrders]);

  const stats = useMemo(
  () => [
    {
      label: "Người dùng",
      value: counts.users,
      desc: "Tài khoản trong hệ thống",
      icon: Users,
      to: "/admin/users",
    },
    {
      label: "Sản phẩm",
      value: counts.products,
      desc: "Sản phẩm đang bán",
      icon: Package,
      to: "/admin/products",
    },
    {
      label: "Đơn hàng",
      value: counts.orders,
      desc: "Tổng đơn hàng",
      icon: ShoppingCart,
      to: "/admin/orders",
    },
    {
      label: "Bài viết",
      value: counts.posts,
      desc: "Nội dung sản phẩm",
      icon: Newspaper,
      to: "/admin/posts",
    },
  ],
  [counts]
);

  const revenueStats = useMemo(
    () => [
      {
        label: "Tổng doanh thu",
        value: formatVND(revenueSummary.totalRevenue),
        desc: "Từ đơn đã giao và đã thanh toán",
        icon: DollarSign,
      },
      {
        label: "Đơn hoàn thành",
        value: revenueSummary.completedOrderCount,
        desc: "Trạng thái DELIVERED + PAID",
        icon: ShoppingCart,
      },
      {
        label: "Doanh số",
        value: revenueSummary.totalSales,
        desc: "Tổng số sản phẩm đã bán",
        icon: TrendingUp,
      },
      {
        label: "Giá trị TB/đơn",
        value: formatVND(revenueSummary.averageOrderValue),
        desc: "Trung bình mỗi đơn hoàn thành",
        icon: CreditCard,
      },
    ],
    [revenueSummary]
  );

  const handleExportPdf = async () => {
    if (!reportRef.current) return;

    setExporting(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f5f7fb",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const today = new Date().toISOString().slice(0, 10);
      pdf.save(`bao-cao-doanh-thu-${today}.pdf`);
    } catch (error) {
      console.error("Lỗi xuất PDF:", error);
    } finally {
      setExporting(false);
    }
  };

  const maxValue = Math.max(...stats.map((item) => Number(item.value)), 1);
  const maxRevenue = Math.max(
    ...revenueChartData.map((item) => Number(item.revenue)),
    1
  );
  const maxPaymentRevenue = Math.max(
    ...paymentChartData.map((item) => Number(item.revenue)),
    1
  );

  const totalValue = stats.reduce((sum, item) => sum + Number(item.value), 0);

  let currentDegree = 0;

  const pieGradient =
    totalValue === 0
      ? "#e5e7eb 0deg 360deg"
      : stats
          .map((item, index) => {
            const colors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626"];
            const degree = (Number(item.value) / totalValue) * 360;
            const start = currentDegree;
            const end = currentDegree + degree;
            currentDegree = end;

            return `${colors[index]} ${start}deg ${end}deg`;
          })
          .join(", ");

  return (
    <div>
      <div className="admin-page-title admin-page-title-row">
        <div>
          <h2>Tổng quan</h2>
          <p>Theo dõi nhanh tình trạng website bán hàng và doanh thu.</p>
        </div>

        <button
          className="admin-export-btn"
          type="button"
          onClick={handleExportPdf}
          disabled={loading || exporting}
        >
          <Download size={18} />
          {exporting ? "Đang xuất..." : "Xuất PDF"}
        </button>
      </div>

      <div ref={reportRef} className="admin-report-area">
        <div className="admin-grid">
  {stats.map((item) => {
    const Icon = item.icon;

    return (
      <Link
        to={item.to}
        className="admin-stat-card admin-stat-link"
        key={item.label}
      >
        <Icon size={26} />
        <span>{item.label}</span>
        <strong>{loading ? "..." : item.value}</strong>
        <p>{item.desc}</p>
      </Link>
    );
  })}
</div>

        <div className="admin-section-title">
          <h3>Doanh thu</h3>
          <p>
            Doanh thu được tính từ các đơn hàng có trạng thái DELIVERED và
            paymentStatus PAID.
          </p>
        </div>

        <div className="admin-grid">
          {revenueStats.map((item) => {
            const Icon = item.icon;

            return (
              <div className="admin-stat-card admin-revenue-card" key={item.label}>
                <Icon size={26} />
                <span>{item.label}</span>
                <strong>{loading ? "..." : item.value}</strong>
                <p>{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="admin-dashboard-charts">
          <div className="admin-card admin-chart-card admin-chart-card-wide">
            <div className="admin-chart-header admin-chart-header-row">
              <div>
                <h3>Biến động doanh thu</h3>
                <p>Thống kê doanh thu theo ngày, tháng hoặc năm.</p>
              </div>

              <select
                className="admin-filter-select"
                value={revenueType}
                onChange={(event) => setRevenueType(event.target.value)}
              >
                <option value="day">Theo ngày</option>
                <option value="month">Theo tháng</option>
                <option value="year">Theo năm</option>
              </select>
            </div>

            {revenueChartData.length === 0 ? (
              <div className="admin-empty-chart">
                Chưa có đơn hàng hoàn thành để tính doanh thu.
              </div>
            ) : (
              <div className="admin-revenue-chart">
                {revenueChartData.map((item) => {
                  const height = Math.max(
                    (Number(item.revenue) / maxRevenue) * 220,
                    24
                  );

                  return (
                    <div className="admin-revenue-item" key={item.key}>
                      <div className="admin-revenue-tooltip">
                        <strong>{formatVND(item.revenue)}</strong>
                        <span>{item.orders} đơn</span>
                      </div>

                      <div className="admin-revenue-track">
                        <div
                          className="admin-revenue-fill"
                          style={{ height: `${height}px` }}
                        />
                      </div>

                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="admin-card admin-chart-card">
            <div className="admin-chart-header">
              <h3>Doanh thu theo thanh toán</h3>
              <p>Phân loại doanh thu theo phương thức thanh toán.</p>
            </div>

            {paymentChartData.length === 0 ? (
              <div className="admin-empty-chart">
                Chưa có dữ liệu phương thức thanh toán.
              </div>
            ) : (
              <div className="admin-payment-list">
                {paymentChartData.map((item) => {
                  const percent =
                    revenueSummary.totalRevenue > 0
                      ? (item.revenue / revenueSummary.totalRevenue) * 100
                      : 0;

                  return (
                    <div className="admin-payment-item" key={item.key}>
                      <div className="admin-payment-info">
                        <strong>{item.label}</strong>
                        <span>
                          {item.orders} đơn • {percent.toFixed(1)}%
                        </span>
                      </div>

                      <div className="admin-payment-amount">
                        {formatVND(item.revenue)}
                      </div>

                      <div className="admin-payment-track">
                        <div
                          className="admin-payment-fill"
                          style={{
                            width: `${Math.max(
                              (item.revenue / maxPaymentRevenue) * 100,
                              4
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="admin-dashboard-charts">
          <div className="admin-card admin-chart-card">
            <div className="admin-chart-header">
              <h3>Biểu đồ cột</h3>
              <p>So sánh số lượng người dùng, sản phẩm, đơn hàng và bài viết.</p>
            </div>

            <div className="admin-column-chart">
              {stats.map((item) => {
                const height = loading
                  ? 20
                  : Math.max((Number(item.value) / maxValue) * 180, 20);

                return (
                  <div className="admin-column-item" key={item.label}>
                    <div className="admin-column-value">
                      {loading ? "..." : item.value}
                    </div>

                    <div className="admin-column-track">
                      <div
                        className="admin-column-fill"
                        style={{ height: `${height}px` }}
                      />
                    </div>

                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="admin-card admin-chart-card">
            <div className="admin-chart-header">
              <h3>Biểu đồ tròn</h3>
              <p>Tỷ trọng dữ liệu chính trong hệ thống.</p>
            </div>

            <div className="admin-pie-wrap">
              <div
                className="admin-pie-chart"
                style={{
                  background: `conic-gradient(${pieGradient})`,
                }}
              />

              <div className="admin-pie-legend">
                {stats.map((item, index) => (
                  <div className="admin-pie-legend-item" key={item.label}>
                    <span className={`admin-pie-dot dot-${index}`} />
                    <p>{item.label}</p>
                    <strong>{loading ? "..." : item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}