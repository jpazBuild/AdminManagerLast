import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AiOutlineDashboard, AiOutlineFileText } from "react-icons/ai";
import { CiDark } from "react-icons/ci";
import { FaBars, FaTimes } from "react-icons/fa";
import { WiDaySunny } from "react-icons/wi";
import Logo from "../../../public/blossom_logo.svg";

export const DashboardHeader = ({ children, onToggleDarkMode }: any) => {
    const [darkMode, setDarkMode] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        onToggleDarkMode(newDarkMode);
    };
    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

    return (
        <div className="min-h-screen flex flex-col">
            <header
                className={`fixed top-0 left-0 w-full shadow-md p-4 z-20 ${darkMode ? "bg-[#101827] text-gray-100" : "bg-gray-50 text-gray-900"
                    }`}
            >
                <div className="flex items-center justify-between mx-auto">
                    <div className="flex items-center gap-4 lg:hidden">
                        <button
                            onClick={toggleMobileMenu}
                            className="text-2xl p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#021d3d]"
                        >
                            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
                        </button>
                    </div>
                    <Image src={Logo} alt="Blossom Logo" className="h-10 w-auto bg-white/90 rounded-md p-2 shadow-md" />
                    <h1 className="text-xl hidden sm:block font-bold">Admin Manager</h1>
                    {/* <button
                        onClick={toggleDarkMode}
                        className="text-2xl p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#021d3d]"
                    >
                        {darkMode ? <WiDaySunny /> : <CiDark />}
                    </button> */}
                </div>
                {mobileMenuOpen && (
                    <div
                        className={`fixed inset-0 z-10 lg:hidden transition-all duration-300 ${darkMode ? "bg-[#021d3d] bg-opacity-60" : "bg-[#021d3d] bg-opacity-50"
                            }`}
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <nav
                            className={`absolute top-0 left-0 w-64 h-full shadow-md p-6 flex flex-col gap-4 animate-fadeIn z-20 transition-all ${darkMode ? "bg-[#021d3d] text-white" : "bg-white text-[#021d3d]"
                                }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className={`self-end text-2xl transition-all ${darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-800"
                                    }`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                ✕
                            </button>
                            <Link href="/" className={`flex items-center gap-2 text-lg transition-all ${darkMode ? "hover:text-white/90" : "hover:text-[#021d3d]"
                                }`}>
                                <AiOutlineDashboard className="text-2xl" /> Dashboard
                            </Link>
                            <Link href="/reports" className={`flex items-center gap-2 text-lg transition-all ${darkMode ? "hover:text-white/95" : "hover:text-[#021d3d]"
                                }`}>
                                <AiOutlineFileText className="text-2xl" /> Reports
                            </Link>
                        </nav>
                    </div>
                )}
            </header>
            <main className="flex-1 pt-20 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
