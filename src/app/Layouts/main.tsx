"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Logo from "../../../public/New_logo.svg";
import LogoDark from "../../../public/Blossom_logo_2.svg";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TbAutomation, TbReportSearch } from "react-icons/tb";
import { ChevronRight, DatabaseZapIcon, Locate, User } from "lucide-react";
import { RiFunctionLine } from "react-icons/ri";
import iconCollection from "../../assets/iconsSides/collections.svg";
import iconEnvironment from "../../assets/iconsSides/environment.svg";
import iconIterationData from "../../assets/iconsSides/iterationData.svg";
import iconFlows from "../../assets/iconsSides/flows.svg";
import { FaSuitcase } from "react-icons/fa";

export const DashboardSidebar = ({
  darkMode,
  isCollapsed,
  onToggleCollapse,
  pageType,
  hiddenSide,
}: {
  darkMode: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pageType?: string;
  hiddenSide?: boolean;
}) => {
  const pathname = usePathname();


  const getSidebarLinkClasses = (path: string) => {
    const starts = (p: string) => pathname === p || pathname.startsWith(`${p}/`);
    const isActive = starts(path);

    if (isActive) {
      return `flex items-center ${isCollapsed ? "p-2 justify-center text-center" : "px-4 py-3"} z-20 text-sm font-medium rounded-xl transition-all duration-300 ${darkMode
          ? "bg-gray-700 text-white shadow-lg"
          : "bg-primary/10 text-primary/90 border-r-2 border-primary/90 shadow-md"
        }`;
    }

    return `flex items-center ${isCollapsed ? "p-2 justify-center text-center" : "px-4 py-3"} z-20 text-sm font-medium rounded-xl transition-all duration-300 ${darkMode ? "text-gray-300 hover:bg-gray-700 hover:text-white" : "text-primary/70 hover:bg-primary/5"
      }`;
  };

  const menuItems =
    pageType === "api"
      ? [
        { name: "Collections", path: "/api/collections", icon: <Image src={iconCollection} alt="Collections" className="w-5 h-5" /> },
        { name: "Environments", path: "/api/environments", icon: <Image src={iconEnvironment} alt="Environments" className="w-5 h-5" /> },
        { name: "Iteration data", path: "/api/iterationData", icon: <Image src={iconIterationData} alt="Iteration data" className="w-5 h-5" /> },
        { name: "Flows", path: "/api/flows", icon: <Image src={iconFlows} alt="Flows" className="w-5 h-5" /> },
      ]
      : [
        { name: "Runner", path: "/dashboard", icon: <TbAutomation className="w-5 h-5" /> },
        { name: "Reports", path: "/reports", icon: <TbReportSearch className="w-5 h-5" /> },
        { name: "Reusables", path: "/dashboard/reusables", icon: <RiFunctionLine className="w-5 h-5" /> },
        { name: "Location Information", path: "/create", icon: <Locate className="w-5 h-5" /> },
        { name: "Users", path: "/users", icon: <User className="w-5 h-5" /> },
        { name: "Dynamic Data", path: "/dynamicData", icon: <DatabaseZapIcon className="w-5 h-5" /> },
        { name: "Test Suites", path: "/testSuites", icon: <FaSuitcase className="w-5 h-5" /> },
      ];

  return (
    <aside
      className={`fixed left top-20 bottom-4 rounded-2xl shadow-xl transform transition-all duration-500 ease-in-out ${hiddenSide ? "-z-10" : "z-10"} ${isCollapsed ? "w-16" : "w-64"
        } ${darkMode ? "bg-gray-800/90 backdrop-blur-md border border-gray-600/30" : "bg-gray-100 backdrop-blur-md border border-gray-200/30"}`}
      style={{ height: "calc(100vh - 6rem)", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1) inset" }}
    >
      <button
        onClick={onToggleCollapse}
        className={`absolute -right-3 top-1/2 z-40 p-2 rounded-full transition-all duration-300 ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600 shadow-lg" : "bg-white text-gray-700 hover:bg-gray-100 shadow-lg border border-gray-200"
          }`}
        style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 rotate-180" />}
      </button>

      <nav className="h-full px-3 py-6 overflow-y-auto">
        <ul className="space-y-3">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path} className={getSidebarLinkClasses(item.path)} title={isCollapsed ? item.name : undefined}>
                <span className={`transition-all duration-300 ${isCollapsed ? "mx-auto" : ""}`}>{item.icon}</span>
                {!isCollapsed && <span className="ml-1 transition-opacity duration-300">{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
        <div className={`my-6 mx-2 rounded-full h-0.5 ${darkMode ? "bg-gray-700" : "bg-gray-200/50"}`} />
      </nav>
    </aside>
  );
};

export const DashboardHeader = ({
  children,
  overflow = "overflow-y-auto",
  onDarkModeChange,
  pageType,
  callback,
  typeFixed = true,
  hiddenSide = false,
}: {
  children: React.ReactNode;
  overflow?: string;
  onDarkModeChange?: (isDark: boolean) => void;
  pageType?: string;
  callback?: (isOpen: boolean) => void;
  typeFixed?: boolean;
  hiddenSide?: boolean;
}) => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const pathname = usePathname();

  // const applyDarkModeClass = (enabled: boolean) => {
  //   if (enabled) document.documentElement.classList.add("dark");
  //   else document.documentElement.classList.remove("dark");
  // };

  const handleToggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    // applyDarkModeClass(newMode);
    onDarkModeChange?.(newMode);
  };

  const handleToggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  };

  const getLinkClasses = (path: string) => {
    const isActive =
      (path === "/dashboard" &&
        (pathname === "/dashboard" ||
          pathname.startsWith("/dashboard/") ||
          pathname === "/create" ||
          pathname === "/reports" ||
          pathname === "/users" ||
          pathname === "/dynamicData" || pathname.startsWith("/testSuites"))) ||
      pathname === path ||
      pathname.startsWith(path + "/");

    if (isActive) {
      return `lg:inline-block text-md font-medium px-4 py-2 rounded-lg transition-colors duration-300 ${darkMode ? "bg-gray-800 text-gray-100" : "bg-primary/5 text-gray-900"
        }`;
    }
    return `lg:inline-block text-md font-medium px-4 py-2 rounded-lg transition-colors duration-300 ${darkMode ? "text-gray-100 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-200"
      }`;
  };

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    const savedSidebarCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
    setDarkMode(savedDarkMode);
    // applyDarkModeClass(savedDarkMode);
    onDarkModeChange?.(savedDarkMode);
    setSidebarCollapsed(savedSidebarCollapsed);
  }, [onDarkModeChange]);

  useEffect(() => {
    callback?.(mobileSidebarOpen);
  }, [mobileSidebarOpen, callback]);

  return (
    <div className={`min-h-screen flex flex-col top-0 w-full ${overflow}`}>
      <header className={`fixed top-0 left-0 w-full shadow-md px-4 py-2 z-30 transition-colors duration-300 ${darkMode ? "bg-gray-900 text-gray-100 border-b border-gray-800" : "bg-gray-50 text-gray-900"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className={`lg:hidden mr-3 p-2 rounded-lg transition-colors duration-200 ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-200"}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>

            {darkMode ? (
              <>
                <Image src={LogoDark} alt="Blossom Logo Dark" className="h-12 w-auto rounded-md p-2" />
              </>
            ) : (
              <>
                <Image src={Logo} alt="Blossom Logo" className="h-12 w-auto rounded-md p-2" />
              </>

            )}

          </div>

          <div className="hidden lg:block">
            <Link href="/dashboard" className={getLinkClasses("/dashboard")}>
              Dashboard
            </Link>
            <Link href="/api" className={getLinkClasses("/api")}>
              API
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* <button
              onClick={handleToggleDarkMode}
              className={`p-2 rounded-lg transition-colors duration-200 ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-200"}`}
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button> */}

            <h1 className={`text-xl font-bold transition-colors duration-300 ${darkMode ? "text-gray-100" : "text-primary/70"}`}>Admin Manager</h1>
          </div>
        </div>
      </header>

      {mobileSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />}

      <div className="flex w-full h-full">
        <div className="hidden lg:block">
          <DashboardSidebar darkMode={darkMode} isCollapsed={sidebarCollapsed} onToggleCollapse={handleToggleSidebarCollapse} pageType={pageType} hiddenSide={hiddenSide} />
        </div>

        <div
          className={`fixed left-0 top-16 w-64 transform transition-transform duration-200 ease-in-out z-20 lg:hidden ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } ${darkMode ? "bg-gray-800 border-r border-gray-700" : "bg-white border-r border-gray-200"}`}
        >
          <nav className="h-full px-3 py-4 overflow-y-auto">
            <ul className="space-y-2">
              {[
                { name: "Dashboard", path: "/dashboard" },
                { name: "Reusables", path: "/dashboard/reusables" },
                { name: "Reports", path: "/reports" },
                { name: "Location Information", path: "/create" },
                { name: "Test Suites", path: "/testSuites" },
              ].map((item) => {
                const starts = (p: string) => pathname === p || pathname.startsWith(`${p}/`);
                const isActive = starts(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive
                        ? darkMode
                          ? "bg-gray-800 text-white"
                          : "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                        : darkMode
                          ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                          : "text-gray-700 hover:bg-gray-100"
                        }`}
                      onClick={() => setMobileSidebarOpen(false)}
                    >
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <main
          className={`flex w-full transition-all duration-500 ${typeFixed ? "fixed" : "overflow-y-auto"} right-0 min-h-screen h-full pt-16 pb-4 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-72"
            } ${darkMode ? "bg-gray-900" : ""} ${overflow}`}
        >
          <div className="py-4 px-2 w-full h-full flex flex-col">{children}</div>
        </main>
      </div>
    </div>
  );
};
