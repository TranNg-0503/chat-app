import Header from "../Header";
import AuthProvider from "../providers/AuthProvider";
import Sidebar from "../sidebar";

const ProtectedLayout = ({ children }) => {
  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-base-200">
        {/* Sidebar bên trái */}
        <Sidebar />

        {/* Khu vực nội dung */}
        <div className="flex-1 flex flex-col">
          <Header className="flex-none" />

          {/* Nội dung chính */}
          {children}
        </div>
      </div>
    </AuthProvider>
  );
};

export default ProtectedLayout;
