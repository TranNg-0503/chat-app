import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Onboard() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", profile: "", location: "" });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Lấy sẵn thông tin user để prefill tên
  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const { data } = await api.get("/me");
        if (m && data?.success) {
          setForm((f) => ({
            ...f,
            fullName: data.user.fullName || "",
            location: data.user.location || "",
            profile: data.user.profile || "",
          }));
        }
      } catch {
        // nếu lỗi, vẫn cho điền tay
      } finally {
        if (m) setFetching(false);
      }
    })();
    return () => (m = false);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");
    if (!form.fullName || !form.profile || !form.location) {
      setErrMsg("Vui lòng điền đầy đủ thông tin");
      return;
    }
    try {
      setLoading(true);
      await api.post("/onboarding", {
        fullName: form.fullName.trim(),
        profile: form.profile.trim(),
        location: form.location.trim(),
      });
      navigate("/", { replace: true }); // vào trang chính
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.missingFields) &&
          "Thiếu: " + err.response.data.missingFields.join(", ")) ||
        "Cập nhật hồ sơ thất bại";
      setErrMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen grid place-items-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen hero bg-base-200">
      <div className="hero-content w-full max-w-2xl">
        <div className="card w-full bg-base-100 shadow-2xl">
          <form className="card-body" onSubmit={onSubmit} noValidate>
            <h2 className="card-title">Hoàn tất hồ sơ</h2>
            <p className="text-sm opacity-70">
              Điền thông tin để mọi người biết về bạn hơn.
            </p>

            {errMsg && (
              <div className="alert alert-error text-sm">
                <span>{errMsg}</span>
              </div>
            )}

            <div className="form-control">
              <label className="label">
                <span className="label-text">Họ và tên</span>
              </label>
              <input
                type="text"
                name="fullName"
                className="input input-bordered"
                value={form.fullName}
                onChange={onChange}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Giới thiệu (profile)</span>
              </label>
              <textarea
                name="profile"
                className="textarea textarea-bordered min-h-[120px]"
                placeholder="Mô tả ngắn về bạn, sở thích, công việc..."
                value={form.profile}
                onChange={onChange}
                required
                maxLength={500}
              />
              <label className="label">
                <span className="label-text-alt">
                  {form.profile.length}/500
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Khu vực sinh sống</span>
              </label>
              <input
                type="text"
                name="location"
                className="input input-bordered"
                placeholder="Hà Nội, TP.HCM, ..."
                value={form.location}
                onChange={onChange}
                required
              />
            </div>

            <div className="card-actions justify-end mt-2">
              <button className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <span className="loading loading-spinner" />
                ) : (
                  "Lưu & Tiếp tục"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
