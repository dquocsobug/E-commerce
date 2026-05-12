import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-black text-sm">T</span>
              </div>

              <span className="font-black text-lg text-white tracking-tight">
                Tech<span className="text-indigo-400">Store</span>
              </span>
            </div>

            <p className="text-sm text-gray-400 leading-6 max-w-xs">
              Cửa hàng công nghệ uy tín hàng đầu. Sản phẩm chính hãng, bảo hành toàn quốc.
            </p>

            <div className="flex gap-3 mt-4">
              {["F", "I", "Y"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-indigo-600 flex items-center justify-center transition"
                >
                  <span className="text-xs text-gray-300">{s}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
              Sản phẩm
            </h4>

            <ul className="space-y-2 text-sm">
              {["Điện thoại", "Laptop", "Máy tính bảng", "Phụ kiện", "Đồng hồ"].map((item) => (
                <li key={item}>
                  <Link to="/products" className="hover:text-indigo-400 transition">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
              Hỗ trợ
            </h4>

            <ul className="space-y-2 text-sm">
              {["Hướng dẫn mua hàng", "Đổi trả", "Bảo hành", "Thanh toán", "Vận chuyển"].map(
                (item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-indigo-400 transition">
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
              Liên hệ
            </h4>

            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="shrink-0">📍</span>
                <span>123 Nguyễn Văn Cừ, Q5, TP.HCM</span>
              </li>

              <li className="flex items-center gap-2">
                <span>📞</span>
                <span>1800 xxxx</span>
              </li>

              <li className="flex items-center gap-2">
                <span>✉️</span>
                <span>support@techstore.vn</span>
              </li>

              <li className="flex items-center gap-2">
                <span>🕐</span>
                <span>8:00 – 22:00</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} TechStore. Tất cả quyền được bảo lưu.</p>

          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-300 transition">
              Điều khoản
            </a>
            <a href="#" className="hover:text-gray-300 transition">
              Bảo mật
            </a>
            <a href="#" className="hover:text-gray-300 transition">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;