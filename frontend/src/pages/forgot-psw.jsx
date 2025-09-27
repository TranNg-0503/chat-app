import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErrMsg("");
    if (!email) {
      setErrMsg("Vui lòng nhập email");
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/forgot-password", { email });
      setMsg(res.data.message || "Đã gửi email đặt lại mật khẩu");
    } catch (err) {
      const msg = err?.response?.data?.message || "Gửi email thất bại";
      setErrMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero bg-base-200">
      <div className="hero-content w-full max-w-md">
        <div className="card w-full shadow-2xl bg-base-100">
          <form className="card-body" onSubmit={onSubmit}>
            <h2 className="card-title justify-center">Quên mật khẩu</h2>

            {errMsg && (
              <div className="alert alert-error text-sm">
                <span>{errMsg}</span>
              </div>
            )}
            {msg && (
              <div className="alert alert-success text-sm">
                <span>{msg}</span>
              </div>
            )}

            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                name="email"
                className="input input-bordered"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button className="btn btn-primary mt-2" disabled={loading}>
              {loading ? <span className="loading loading-spinner" /> : "Gửi yêu cầu"}
            </button>

            <p className="text-center text-sm mt-4">
              <Link to="/login" className="link link-primary">
                Quay lại đăng nhập
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
