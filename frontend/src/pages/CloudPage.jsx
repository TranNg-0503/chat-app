import Sidebar from "../components/sidebar";
import Cloud from "./MyCloud"; // chính là file Cloud.jsx bạn viết

export default function CloudPage() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar trái */}
      <Sidebar />

      {/* Cloud bên phải */}
      <div className="flex-1 overflow-hidden">
        <Cloud />
      </div>
    </div>
  );
}
