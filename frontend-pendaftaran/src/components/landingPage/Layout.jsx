import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { LandingProvider } from "../../context/LandingProvider";

const Layout = () => {
  return (
    <LandingProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </LandingProvider>
  );
};

export default Layout;