import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { AiOutlineDashboard, AiOutlineFileText } from "react-icons/ai"
import { CiDark } from "react-icons/ci"
import { FaBars, FaTimes } from "react-icons/fa"
import { WiDaySunny } from "react-icons/wi"
import Logo from "../../assets/blossom_logo.svg";


export const Dashboard = ({children,onToggleDarkMode}:any) => {
    const [darkMode, setDarkMode] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        onToggleDarkMode(newDarkMode);
      };
    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

    return (
        <div
            className={`flex flex-col lg:flex-row min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}
        >
            <header className="lg:hidden flex items-center justify-between p-4  shadow-md">
                <button
                    onClick={toggleMobileMenu}
                    className="text-2xl p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {mobileMenuOpen ? <FaTimes /> : <FaBars />}
                </button>
                <h1 className="text-xl font-bold">Admin Manager</h1>
                <button
                    onClick={toggleDarkMode}
                    className="text-2xl p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {darkMode ? <WiDaySunny /> : <CiDark />}
                </button>
            </header>

            <aside
                className={`fixed top-0 left-0 w-3/4 max-w-xs h-full bg-gray-100 p-6 z-50 transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    } lg:translate-x-0 lg:w-1/4 lg:h-screen lg:max-w-none ${darkMode ? "bg-gray-800 text-gray-100" : "bg-gray-100 text-gray-900"}`}
            >
                <div className="flex flex-col justify-between h-full">
                    <div>
                        <div className="flex justify-between items-center mb-10 gap-2">
                            <Image
                                src={Logo}
                                alt="Logo"
                                className="bg-white rounded-md shadow-md p-3"
                            />
                            <button
                                onClick={toggleMobileMenu}
                                className="lg:hidden text-2xl p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Navegación */}
                        <nav className="space-y-4">
                            <Link
                                href={"/"}
                                className={`w-full flex items-center px-4 py-2 text-lg rounded-md transition-colors duration-300 ${darkMode ? "hover:bg-gray-700" : "hover:bg-blue-100 text-gray-800"}`}
                            >
                                <AiOutlineDashboard className="mr-3 text-2xl" />
                                Dashboard
                            </Link>
                            <Link
                                href={"/reports"}
                                className={`w-full flex items-center px-4 py-2 text-lg rounded-md transition-colors duration-300 ${darkMode ? "hover:bg-gray-700" : "hover:bg-blue-100 text-gray-800"}`}
                            >
                                <AiOutlineFileText className="mr-3 text-2xl" />
                                Reports
                            </Link>
                        </nav>
                    </div>

                    {/* Botón de tema y pie de página */}
                    <div className="mt-8">
                        <button
                            onClick={toggleDarkMode}
                            className={`flex items-center gap-4 text-lg w-full px-4 py-2 rounded-md font-semibold transition-colors duration-300 ${darkMode ? "bg-white text-gray-800 hover:bg-gray-300" : "bg-gray-800 text-white hover:bg-gray-900"}`}
                        >
                            {darkMode ? (
                                <>
                                    <WiDaySunny />
                                    <span>Light mode</span>
                                </>
                            ) : (
                                <>
                                    <CiDark />
                                    <span>Dark mode</span>
                                </>
                            )}
                        </button>
                        <p className="text-center text-sm mt-4 ">
                            © 2024 Automation Tool
                        </p>
                    </div>
                </div>
            </aside>
            {children}
        </div>
    )
}