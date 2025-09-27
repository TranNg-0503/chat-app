import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");
    setMsg("");

    if (!password || password.length < 8) {
      setErrMsg("Mật khẩu phải ít nhất 8 ký tự");
      return;
    }
    if (password !== confirmPwd) {
      setErrMsg("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(`/reset-password?token=${token}`, {
        newPassword: password,
      });
      setMsg(res.data.message || "Đặt lại mật khẩu thành công");
      // sau 2s chuyển về login
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      const msg = err?.response?.data?.message || "Đặt lại mật khẩu thất bại";
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
            <h2 className="card-title justify-center">Đặt lại mật khẩu</h2>

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

            {/* Mật khẩu mới */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Mật khẩu mới</span>
              </label>
              <div className="join w-full">
                <input
                  type={showPwd ? "text" : "password"}
                  className="input input-bordered join-item w-full"
                  placeholder="••••••••"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline join-item"
                  onClick={() => setShowPwd((s) => !s)}
                >
                  {showPwd ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div className="form-control mt-2">
              <label className="label">
                <span className="label-text">Xác nhận mật khẩu mới</span>
              </label>
              <div className="join w-full">
                <input
                  type={showConfirmPwd ? "text" : "password"}
                  className="input input-bordered join-item w-full"
                  placeholder="••••••••"
                  minLength={8}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline join-item"
                  onClick={() => setShowConfirmPwd((s) => !s)}
                >
                  {showConfirmPwd ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            <button className="btn btn-primary mt-4" disabled={loading}>
              {loading ? <span className="loading loading-spinner" /> : "Xác nhận"}
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
