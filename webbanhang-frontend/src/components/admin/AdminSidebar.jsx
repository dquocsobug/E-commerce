import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  FolderTree,
  ShoppingCart,
  Newspaper,
  BadgePercent,
  TicketPercent,
  LogOut,
  Home,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const menuItems = [
  { to: "/admin", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Người dùng", icon: Users },
  { to: "/admin/products", label: "Sản phẩm", icon: Package },
  { to: "/admin/categories", label: "Danh mục", icon: FolderTree },
  { to: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
  { to: "/admin/posts", label: "Bài viết", icon: Newspaper },
  { to: "/admin/promotions", label: "Khuyến mãi", icon: BadgePercent },
  { to: "/admin/vouchers", label: "Voucher", icon: TicketPercent },
];

export default function AdminSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <div className="admin-brand-icon">T</div>
        <div>
          <h2>TechStore</h2>
          <p>Admin Panel</p>
        </div>
      </div>

      <nav className="admin-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "admin-nav-link active" : "admin-nav-link"
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <NavLink to="/" className="admin-nav-link">
          <Home size={18} />
          <span>Về trang chủ</span>
        </NavLink>

        <button type="button" className="admin-logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}