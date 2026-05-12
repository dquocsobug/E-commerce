import { Menu, Search, Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AdminHeader() {
  const { user } = useAuth();

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button type="button" className="admin-menu-btn">
          <Menu size={22} />
        </button>

        <div>
          <h1>Quản trị hệ thống</h1>
          <p>Quản lý sản phẩm, đơn hàng, người dùng và nội dung.</p>
        </div>
      </div>

      <div className="admin-header-right">
        <div className="admin-search-box">
          <Search size={18} />
          <input type="text" placeholder="Tìm kiếm trong admin..." />
        </div>

        <button type="button" className="admin-icon-btn">
          <Bell size={20} />
        </button>

        <div className="admin-user-box">
          <div className="admin-avatar">
            {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div>
            <strong>{user?.fullName || "Admin"}</strong>
            <span>{user?.email || "admin@gmail.com"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}