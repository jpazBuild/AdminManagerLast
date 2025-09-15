import { useState } from "react";
import Image from "next/image";
import Logo from "../../../public/New_logo.svg";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const DashboardSidebar = ({
  darkMode,
  isOpen,
  onToggle,
}: {
  darkMode: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const pathname = usePathname();

  const getSidebarLinkClasses = (path: string) => {
    const isActive = pathname === path || pathname.startsWith(path);

    if (isActive) {
      return `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
        darkMode
          ? "bg-blue-600 text-white"
          : "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
      }`;
    }

    return `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      darkMode
        ? "text-gray-300 hover:bg-gray-700 hover:text-white"
        : "text-gray-700 hover:bg-gray-100"
    }`;
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      ),
    },
    {
      name: "Runner",
      path: "/dashboard/runner",
      icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      name: "Reports",
      path: "/dashboard/reports",
      icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 2v2H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2h-2V2H8z" />
          <path d="M8 4h4v2H8V4z" />
        </svg>
      ),
    },
    {
      name: "Test Cases",
      path: "/dashboard/test-cases",
      icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 5a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      name: "Settings",
      path: "/dashboard/settings",
      icon: (
        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 transform transition-transform duration-200 ease-in-out z-50 lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          darkMode
            ? "bg-gray-800 border-r border-gray-700"
            : "bg-white border-r border-gray-200"
        }`}
      >
        <nav className="h-full px-3 py-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={getSidebarLinkClasses(item.path)}
                  onClick={() => onToggle()} // Close mobile menu on click
                >
                  {item.icon}
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Additional sections */}
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className={`px-4 text-xs font-semibold uppercase tracking-wide ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}>
              Quick Actions
            </p>
            <ul className="mt-2 space-y-1">
              <li>
                <button
                  className={`w-full text-left flex items-center px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${
                    darkMode
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  New Test
                </button>
              </li>
              <li>
                <button
                  className={`w-full text-left flex items-center px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${
                    darkMode
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  Import Data
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </aside>
    </>
  );
};