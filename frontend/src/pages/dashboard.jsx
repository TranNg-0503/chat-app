
export default function Dashboard() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="card bg-base-100 shadow-xl p-8 w-full max-w-lg text-center">
        <h2 className="card-title text-2xl font-bold mb-4">
          Chào mừng bạn đến ZooLaa
        </h2>
        <p className="text-gray-600 mb-6">
          Đây là Project của <span className="font-semibold">Nhóm 3</span>.
        </p>
        <div className="space-y-3">
          <p className="text-gray-700">
            Hãy bắt đầu quản lý dữ liệu của bạn bằng cách sử dụng menu bên trái.
          </p>
          <p className="text-sm text-gray-500">
            Click vào ảnh đại diện ở góc trên bên phải để xem và chỉnh sửa thông
            tin tài khoản của bạn.
          </p>
        </div>
      </div>
    </main>
  );
}
