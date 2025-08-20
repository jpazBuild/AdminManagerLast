import { useState } from "react";
import Image from "next/image";
import Logo from "../../../public/New_logo.svg";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const DashboardHeader = ({
  children,
  overflow = "overflow-y-auto",
  onDarkModeChange,
}: {
  children: React.ReactNode;
  overflow?: string;
  onDarkModeChange?: (isDark: boolean) => void;
}) => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const pathname = usePathname();

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

  const getLinkClasses = (path: string) => {
    const isActive =
      (path === "/dashboard" && pathname === "/dashboard") ||
      (path.startsWith("/dashboard/reusables") &&
        pathname.startsWith("/dashboard/reusables")) || path === pathname;

    if (isActive) {
      return `lg:inline-block text-md font-medium px-4 py-2 rounded-lg transition-colors duration-300 ${
        darkMode
          ? "bg-primary/5 text-gray-100"
          : "bg-primary/5 text-gray-900"
      }`;
    }

    return `lg:inline-block text-md font-medium px-4 py-2 rounded-lg transition-colors duration-300 ${
      darkMode
        ? "text-gray-100 hover:bg-gray-700"
        : "text-gray-900 hover:bg-gray-200"
    }`;
  };

  return (
    <div className={`min-h-screen flex flex-col top-0 w-full ${overflow}`}>
      <header
        className={`fixed top-0 left-0 w-full shadow-md p-4 z-20 transition-colors duration-300 ${
          darkMode ? "bg-[#101827] text-gray-100" : "bg-gray-50 text-gray-900"
        }`}
      >
        <div className="flex items-center justify-between">
          <Image
            src={Logo}
            alt="Blossom Logo"
            className="h-10 w-auto rounded-md p-2"
          />

          <div>
            <Link href="/dashboard" className={getLinkClasses("/dashboard")}>
              Dashboard
            </Link>
            <Link
              href="/dashboard/reusables"
              className={getLinkClasses("/dashboard/reusables")}
            >
              Reusables
            </Link>

            <Link
              href="/create"
              className={getLinkClasses("/create")}
            >
              Create Entities
            </Link>
          </div>

          <h1
            className={`text-xl font-bold transition-colors duration-300 ${
              darkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Admin Manager
          </h1>
        </div>
      </header>

      <main
        className={`flex justify-center mt-14 top-0 ${overflow} transition-colors duration-300 ${
          darkMode ? "bg-gray-900" : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
};
