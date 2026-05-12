import { Outlet, ScrollRestoration } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Chatbox from "../Chatbox/Chatbox";

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <ScrollRestoration />

      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      <Chatbox />
    </div>
  );
};

export default Layout;