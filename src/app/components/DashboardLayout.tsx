import Image from "next/image";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import Logo from "../../../public/blossom_logo.svg";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-[#101827] text-gray-900 dark:text-gray-100">
      <header className="fixed top-0 left-0 w-full bg-white dark:bg-[#101827] shadow-md p-4 z-30">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Image
            src={Logo}
            alt="Blossom Logo"
            className="h-10 w-auto bg-white/90 rounded-md p-2 shadow-md"
          />

          <h1 className="text-xl font-bold hidden sm:block">Admin Manager</h1>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-2xl p-2 rounded-md focus:outline-none"
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          >
            <nav
              className="absolute top-0 left-0 w-64 h-full bg-white dark:bg-[#021d3d] text-[#021d3d] dark:text-white shadow-lg p-6 z-30"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="text-2xl mb-4 self-end"
                onClick={() => setMobileMenuOpen(false)}
              >
                ✕
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="pt-20 px-4 flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;