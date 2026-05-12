import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Zap, ChevronDown } from "lucide-react";
import { aiApi } from "../../api";
import "./Chatbox.css";

const QUICK_PROMPTS = [
  "Tư vấn laptop gaming",
  "So sánh iPhone vs Android",
  "Chính sách bảo hành",
];

export default function Chatbox() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Xin chào! Tôi là TechBot — trợ lý AI của TechStore. Tôi có thể giúp bạn tư vấn sản phẩm, so sánh thiết bị, tra cứu voucher và theo dõi đơn hàng.",
    },
  ]);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  const handleSend = async (text) => {
    const trimmed = (text || message).trim();
    if (!trimmed || loading) return;

    setMessage("");
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);

    try {
      setLoading(true);
      const res = await aiApi.chat(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            res?.answer ||
            res?.data?.answer ||
            "Xin lỗi, tôi chưa thể trả lời câu hỏi này.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Xin lỗi, TechBot đang bận. Vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const showQuickPrompts = messages.length === 1;

  return (
    <>
      {/* Toggle button */}
      <button
        className={`cb-toggle ${open ? "cb-toggle--open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Mở chat hỗ trợ"
      >
        <span className="cb-toggle__icon cb-toggle__icon--chat">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor" opacity=".15" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            <circle cx="8.5" cy="11" r="1" fill="currentColor"/>
            <circle cx="12" cy="11" r="1" fill="currentColor"/>
            <circle cx="15.5" cy="11" r="1" fill="currentColor"/>
          </svg>
        </span>
        <span className="cb-toggle__icon cb-toggle__icon--close">
          <X size={20} />
        </span>
        {!open && <span className="cb-toggle__badge">AI</span>}
      </button>

      {/* Chat window */}
      <div className={`cb-window ${open ? "cb-window--open" : ""} ${minimized ? "cb-window--minimized" : ""}`}>
        {/* Header */}
        <div className="cb-header">
          <div className="cb-header__left">
            <div className="cb-avatar">
              <Bot size={18} />
              <span className="cb-avatar__dot" />
            </div>
            <div className="cb-header__info">
              <span className="cb-header__name">TechBot</span>
              <span className="cb-header__status">
                <span className="cb-status-dot" />
                Trực tuyến
              </span>
            </div>
          </div>
          <div className="cb-header__actions">
            <button
              className="cb-icon-btn"
              onClick={() => setMinimized((v) => !v)}
              aria-label={minimized ? "Mở rộng" : "Thu nhỏ"}
            >
              <ChevronDown size={16} className={minimized ? "cb-rotate" : ""} />
            </button>
            <button
              className="cb-icon-btn"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="cb-body">
          <div className="cb-messages">
            {messages.map((item, i) => (
              <div key={i} className={`cb-msg cb-msg--${item.role}`}>
                {item.role === "ai" && (
                  <div className="cb-msg__avatar">
                    <Bot size={13} />
                  </div>
                )}
                <div className="cb-msg__bubble">{item.text}</div>
              </div>
            ))}

            {/* Quick prompt chips — show only on first load */}
            {showQuickPrompts && !loading && (
              <div className="cb-quick-prompts">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    className="cb-chip"
                    onClick={() => handleSend(q)}
                  >
                    <Zap size={11} />
                    {q}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="cb-msg cb-msg--ai">
                <div className="cb-msg__avatar">
                  <Bot size={13} />
                </div>
                <div className="cb-msg__bubble cb-msg__bubble--typing">
                  <span className="cb-dot" />
                  <span className="cb-dot" />
                  <span className="cb-dot" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="cb-footer">
          <div className="cb-input-row">
            <input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Nhập câu hỏi..."
              className="cb-input"
              disabled={loading}
            />
            <button
              className={`cb-send ${message.trim() && !loading ? "cb-send--active" : ""}`}
              onClick={() => handleSend()}
              disabled={loading || !message.trim()}
              aria-label="Gửi"
            >
              <Send size={15} />
            </button>
          </div>
          <p className="cb-footer__hint">TechBot · Powered by AI</p>
        </div>
      </div>
    </>
  );
}