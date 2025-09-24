import Header from "../Header";
import AuthProvider from "../providers/AuthProvider";
import Sidebar from "../sidebar";

const ProtectedLayout = ({ children }) => {
  return (
    <AuthProvider>


        {/* Khu vực nội dung */}
        <div className="flex-1 flex flex-col">
          <Header className="flex-none" />

          {/* Nội dung chính */}
          {children}
        
      </div>
    </AuthProvider>
  );
};

export default ProtectedLayout;
