import { useState, useEffect } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { WiDaySunny } from "react-icons/wi";
import { CiDark } from "react-icons/ci";
import Image from "next/image";
import Logo from "../../../public/New_logo.svg";
import Link from "next/link";

export const DashboardHeader = ({
  children,
  overflow = "overflow-y-auto",
  onDarkModeChange,
}: {
  children: React.ReactNode;
  overflow?: string;
  onDarkModeChange?: (isDark: boolean) => void;
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const applyDarkModeClass = (enabled: boolean) => {
    if (enabled) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleToggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    applyDarkModeClass(newMode);
    onDarkModeChange?.(newMode);
  };

  return (
    <div className={`min-h-screen flex flex-col top-0 w-full ${overflow}`}>
      <header
        className={`fixed top-0 left-0 w-full shadow-md p-4 z-20 transition-colors duration-300 ${
          darkMode 
            ? "bg-[#101827] text-gray-100" 
            : "bg-gray-50 text-gray-900"
        }`}
      >
        <div className="flex items-center justify-between">
          <Image
            src={Logo}
            alt="Blossom Logo"
            className="h-10 w-auto rounded-md p-2"
          />

          {/* <div className="flex items-center gap-4 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`text-2xl cursor-pointer p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#021d3d] transition-colors duration-300 ${
                darkMode 
                  ? "text-gray-100 hover:bg-gray-700" 
                  : "text-gray-900 hover:bg-gray-200"
              }`}
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div> */}

          <div>
            <Link 
              href="/dashboard" 
              className={`lg:inline-block text-md font-medium px-4 py-2 rounded-lg transition-colors duration-300 ${
                darkMode 
                  ? "text-gray-100 hover:bg-gray-700" 
                  : "text-gray-900 hover:bg-gray-200"
              }`}
            >
              Dashboard
            </Link>


          </div>

          <h1 className={`text-xl font-bold transition-colors duration-300 ${
            darkMode ? "text-gray-100" : "text-gray-900"
          }`}>
            Admin Manager
          </h1>

          {/* <button
            onClick={handleToggleDarkMode}
            className={`text-2xl p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#021d3d] transition-colors duration-300 ${
              darkMode 
                ? "text-gray-100 hover:bg-gray-700" 
                : "text-gray-900 hover:bg-gray-200"
            }`}
            title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            {darkMode ? <WiDaySunny /> : <CiDark />}
          </button> */}
        </div>
      </header>

      <main className={`flex justify-center mt-14 top-0 ${overflow} transition-colors duration-300 ${
        darkMode ? "bg-gray-900" : ""
      }`}>
        {children}
      </main>
    </div>
  );
};