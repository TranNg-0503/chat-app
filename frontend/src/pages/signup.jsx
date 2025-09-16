import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

const SEXES = ["Nam", "Nữ", "Khác"];

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    dateOfBirth: "",
    sex: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");

    // validate tối thiểu phía client
    if (
      !form.fullName ||
      !form.email ||
      !form.password ||
      !form.dateOfBirth ||
      !form.sex
    ) {
      setErrMsg("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (form.password.length < 8) {
      setErrMsg("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    try {
      setLoading(true);
      await api.post("/signup", {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        dateOfBirth: form.dateOfBirth, // YYYY-MM-DD
        sex: form.sex,
      });
      // cookie JWT đã được set; chuyển sang bước onboard
      navigate("/onboard", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Đăng ký thất bại";
      setErrMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero bg-base-200">
      <div className="hero-content w-full max-w-lg">
        <div className="card w-full bg-base-100 shadow-2xl">
          <form className="card-body" onSubmit={onSubmit} noValidate>
            <h2 className="card-title justify-center">Đăng ký</h2>

            {errMsg && (
              <div className="alert alert-error text-sm">
                <span>{errMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Họ và tên</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  className="input input-bordered"
                  placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChange={onChange}
                  required
                />
              </div>

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

              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text">Mật khẩu</span>
                </label>
                <div className="join w-full">
                  <input
                    type={showPwd ? "text" : "password"}
                    name="password"
                    className="input input-bordered join-item w-full"
                    placeholder="Ít nhất 8 ký tự"
                    minLength={8}
                    value={form.password}
                    onChange={onChange}
                    required
                    autoComplete="new-password"
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

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Ngày sinh</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  className="input input-bordered"
                  value={form.dateOfBirth}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Giới tính</span>
                </label>
                <select
                  name="sex"
                  className="select select-bordered"
                  value={form.sex}
                  onChange={onChange}
                  required
                >
                  <option value="" disabled>
                    Chọn giới tính
                  </option>
                  {SEXES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button className="btn btn-primary mt-2" disabled={loading}>
              {loading ? (
                <span className="loading loading-spinner" />
              ) : (
                "Tạo tài khoản"
              )}
            </button>

            <div className="divider">hoặc</div>
            <p className="text-center text-sm">
              Đã có tài khoản?{" "}
              <Link to="/login" className="link link-primary">
                Đăng nhập
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
