import { useState, useEffect } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { WiDaySunny } from "react-icons/wi";
import { CiDark } from "react-icons/ci";
import Image from "next/image";
import Logo from "../../../public/blossom_logo.svg";

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

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved === null ? prefersDark : saved === "true";

    setDarkMode(initial);
    applyDarkModeClass(initial);
    onDarkModeChange?.(initial);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem("darkMode") === null) {
        setDarkMode(e.matches);
        applyDarkModeClass(e.matches);
        onDarkModeChange?.(e.matches);
      }
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [onDarkModeChange]);

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
    <div className={`min-h-screen flex flex-col top-0 ${overflow}`}>
      <header
        className={`fixed top-0 left-0 w-full shadow-md p-4 z-20 transition-colors duration-300 ${
          darkMode 
            ? "bg-[#101827] text-gray-100" 
            : "bg-gray-50 text-gray-900"
        }`}
      >
        <div className="flex items-center justify-between mx-auto">
          <Image
            src={Logo}
            alt="Blossom Logo"
            className="h-10 w-auto bg-white/90 rounded-md p-2 shadow-md"
          />

          <div className="flex items-center gap-4 lg:hidden">
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
          </div>

          <h1 className={`text-xl hidden sm:block font-bold transition-colors duration-300 ${
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

      <main className={`flex-1 pt-20 h-screen top-0 ${overflow} transition-colors duration-300 ${
        darkMode ? "bg-gray-900" : "bg-gray-100"
      }`}>
        {children}
      </main>
    </div>
  );
};