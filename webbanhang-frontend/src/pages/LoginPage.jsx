import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const result = await login(form);

    if (result.success) {
      if (remember) {
        localStorage.setItem("rememberLogin", "true");
      }
      navigate(from, { replace: true });
    } else {
      setError(result.message || "Đăng nhập thất bại");
    }
  };

  return (
    <main className="login-page">
      <section className="login-left">
        <div className="login-box">
          <div className="login-brand">
            <h2>TECH_STORE</h2>
            <p>Cổng thông tin giám tuyển công nghệ</p>
          </div>

          <div className="login-heading">
            <h1>Đăng nhập</h1>
            <p>Chào mừng bạn quay trở lại với không gian công nghệ.</p>
          </div>

          {error && <div className="login-error">{String(error)}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@techcurator.vn"
                required
              />
            </div>

            <div className="form-group">
              <label>Mật khẩu</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="login-options">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>

              <a href="#">Quên mật khẩu?</a>
            </div>

            <button type="submit" disabled={loading} className="login-submit">
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="divider">
            <span>Hoặc tiếp tục với</span>
          </div>

          <div className="social-login">
            <button type="button">
              <span className="google-icon">G</span>
              Google
            </button>

            <button type="button">
              <span className="facebook-icon">f</span>
              Facebook
            </button>
          </div>

          <p className="register-text">
            Chưa có tài khoản?
            <Link to="/register"> Đăng ký ngay</Link>
          </p>
        </div>
      </section>

      <section className="login-right">
        <div className="login-overlay"></div>

        <div className="login-content">
          <h2>Đọc review trước khi mua – lựa chọn thông minh hơn</h2>
          <div className="line"></div>

          <div className="article-card">
            <span>EDITOR'S CHOICE</span>

            <h3>Top laptop đáng mua 2026: Định nghĩa lại hiệu năng di động</h3>

            <p>
              Khám phá danh sách được tuyển chọn kỹ lưỡng những mẫu máy tính
              xách tay đột phá nhất, phù hợp cho học tập, làm việc và sáng tạo.
            </p>

            <div className="expert-row">
              <div className="avatar">A</div>
              <div className="avatar">B</div>
              <strong>và 12 chuyên gia khác đang thảo luận</strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}