import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api";
import "./RegisterPage.css";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (!agree) {
      setError("Bạn cần đồng ý với điều khoản dịch vụ");
      return;
    }

    try {
      setLoading(true);

      await authApi.register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      navigate("/login", {
        replace: true,
        state: { message: "Đăng ký thành công, vui lòng đăng nhập" },
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Đăng ký thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page">
      <div className="register-shell">
        <section className="register-form-side">
          <div className="register-header">
            <h1>Tạo tài khoản</h1>
            <p>Chào mừng bạn đến với cộng đồng giám tuyển công nghệ.</p>
          </div>

          {error && <div className="register-error">{error}</div>}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="field">
              <label>Họ tên</label>
              <input
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                required
              />
            </div>

            <div className="field">
              <label>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="field">
              <label>Số điện thoại</label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="0901234567"
                required
              />
            </div>

            <div className="password-grid">
              <div className="field">
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

              <div className="field">
                <label>Xác nhận</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <label className="terms">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span>
                Tôi đồng ý với <a href="#">điều khoản dịch vụ</a> và{" "}
                <a href="#">chính sách bảo mật</a> của Tech Store.
              </span>
            </label>

            <button className="register-submit" disabled={loading}>
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </form>

          <div className="register-divider">
            <span>Hoặc tiếp tục với</span>
          </div>

          <div className="social-row">
            <button type="button">
              <span className="google">G</span>
              Google
            </button>

            <button type="button">
              <span className="facebook">f</span>
              Facebook
            </button>
          </div>

          <p className="login-link">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </section>

        <section className="register-info-side">
          <div className="brand-row">
            <span>TC</span>
            <strong>Tech Store</strong>
          </div>

          <div className="benefits">
            <Benefit
              icon="🔖"
              title="Lưu trữ bài viết yêu thích"
              desc="Đánh dấu những kiến thức quan trọng và truy cập lại bất cứ lúc nào."
            />

            <Benefit
              icon="✨"
              title="Gợi ý sản phẩm phù hợp"
              desc="Hệ thống cá nhân hóa sẽ tìm kiếm thiết bị công nghệ tối ưu cho nhu cầu của bạn."
            />

            <Benefit
              icon="🛡️"
              title="Review từ chuyên gia"
              desc="Nhận những đánh giá khách quan và chuyên sâu trước khi quyết định mua hàng."
            />
          </div>

          <div className="preview-card">
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"
              alt="Tech workspace"
            />

            <div className="preview-content">
              <div>
                <span>Editorial</span>
                <small>5 phút đọc</small>
              </div>

              <h3>Kỷ nguyên của Laptop AI: Điều gì đang thay đổi?</h3>
              <p>
                Khám phá cách các dòng chip mới đang định nghĩa lại hiệu năng và
                trải nghiệm người dùng.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Benefit({ icon, title, desc }) {
  return (
    <div className="benefit">
      <div className="benefit-icon">{icon}</div>
      <div>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </div>
  );
}