import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");
    if (!form.email || !form.password) {
      setErrMsg("Vui lòng điền đầy đủ thông tin");
      return;
    }
    try {
      setLoading(true);
      await api.post("/login", {
        email: form.email.trim(),
        password: form.password,
      });
      // login ok thì chuyển sang trang cần (dashboard/onboard)
      navigate("/onboard", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Đăng nhập thất bại";
      setErrMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero bg-base-200">
      <div className="hero-content w-full max-w-md">
        <div className="card w-full shadow-2xl bg-base-100">
          <form className="card-body" onSubmit={onSubmit} noValidate>
            <h2 className="card-title justify-center">Đăng nhập</h2>

            {errMsg && (
              <div className="alert alert-error text-sm">
                <span>{errMsg}</span>
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
                value={form.email}
                onChange={onChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Mật khẩu</span>
              </label>
              <div className="join w-full">
                <input
                  type={showPwd ? "text" : "password"}
                  name="password"
                  className="input input-bordered join-item w-full"
                  placeholder="••••••••"
                  minLength={8}
                  value={form.password}
                  onChange={onChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="btn btn-outline join-item"
                  onClick={() => setShowPwd((s) => !s)}
                >
                  {showPwd ? "Ẩn" : "Hiện"}
                </button>
              </div>
              <label className="label">
                <a className="label-text-alt link link-hover">Quên mật khẩu?</a>
              </label>
            </div>

            <button className="btn btn-primary mt-2" disabled={loading}>
              {loading ? (
                <span className="loading loading-spinner" />
              ) : (
                "Đăng nhập"
              )}
            </button>

            <div className="divider">hoặc</div>
            <p className="text-center text-sm">
              Chưa có tài khoản?{" "}
              <Link to="/signup" className="link link-primary">
                Đăng ký
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
