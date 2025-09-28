import Header from "../Header";
import Sidebar from "../sidebar";

const ProtectedLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-base-200">
      {/* Sidebar bên trái */}
      <Sidebar />

      {/* Khu vực nội dung */}
      <div className="flex-1 flex flex-col">
        <Header className="flex-none" />

        {/* Nội dung chính */}
        {children}
      </div>
    </div>
  );
};

export default ProtectedLayout;
