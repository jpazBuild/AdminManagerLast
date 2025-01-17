"use client";

import { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import InteractionItem from "./components/Interaction";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Dashboard } from "./Layouts/dashboard";

export default function Home() {
  const [darkMode,setDarkMode] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    module: "",
    tags: "",
    submodule: "",
  });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownState, setDropdownState] = useState<Record<number, boolean>>({});

  const toggleDropdown = (id: number) => {
    setDropdownState((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  const buildQuery = () => {
    const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value.trim()) {
        acc[key] = key === "tags" || key === "submodule" ? [value.trim()] : value.trim();
      }
      return acc;
    }, {} as Record<string, any>);
    return encodeURIComponent(JSON.stringify(activeFilters));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const query = buildQuery();
      const apiUrl = `${process.env.URL_API_INTEGRATION}retrieveAutomationFlow?filters=${query}`;

      const response = await fetch(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${process.env.TOKEN_API}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDarkMode = (darkMode: boolean) => {
   setDarkMode(darkMode)
  };

  return (
    <Dashboard onToggleDarkMode={handleToggleDarkMode}
    >

      <main className="flex-1 ml-0 lg:ml-[25%] h-screen overflow-y-auto p-4 ">

        <section className="mb-8">
          <h3 className="text-xl font-bold mb-4">Searching Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(filters).map((field) => (
              <input
                key={field}
                type="text"
                name={field}
                value={filters[field as keyof typeof filters]}
                onChange={handleInputChange}
                placeholder={`Filter by ${field}`}
                className={`p-3 border rounded-md focus:ring-2 transition-colors duration-300 ${darkMode ? "bg-gray-700 text-gray-100 border-gray-600 focus:ring-gray-500" : "bg-white text-gray-900 border-gray-300 focus:ring-blue-500"}`}
              />
            ))}
          </div>
          <button
            onClick={fetchData}
            className={`mt-4 px-6 py-2 rounded-md font-semibold transition-colors duration-300 ${darkMode ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-500 text-white hover:bg-blue-600"}`}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </section>

        {loading && (
          <section className="mt-8">
            <div className="grid grid-cols-1 gap-4 animate-pulse">
              <Skeleton height={40} count={5} baseColor="gray" enableAnimation={false} />
            </div>
          </section>
        )}

        {!loading && error && <p className="text-red-500">Error: {error}</p>}

        {!loading && data && data.data && data.data.length > 0 ? (
          <section className="mt-8">
            <h3 className="text-lg font-bold mb-4">Results</h3>
            <div className="grid grid-cols-1 gap-4">
              {data.data.map((item: any, index: number) => {
                return (
                  <div key={index}>
                    <button
                      className={`w-full flex justify-between p-4 rounded-md shadow-md transition-colors duration-300 ${darkMode ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-gray-900 border-gray-300"}`}
                      onClick={() => toggleDropdown(index)}
                    >
                      <p className="font-semibold">{item.name}</p>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown(index);
                        }}
                        className="flex items-center p-2 justify-between font-semibold rounded-md gap-2"
                      >
                        {dropdownState[index] ? (
                          <FaChevronUp />
                        ) : (
                          <FaChevronDown />
                        )}
                      </span>
                    </button>

                    {Array.isArray(item.jsonSteps) && item.jsonSteps.length > 0 && dropdownState[index] && (
                      <div className="flex flex-col gap-2 mt-2">
                        {item.jsonSteps.map((step: any, index: any) => (
                          <InteractionItem
                            key={index}
                            data={step as any}
                            index={index}
                            isContext={false}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ) : !loading && data && data.data && data.data.length === 0 ? (
          <section className="mt-8 flex justify-center items-center  p-8 rounded-md shadow-md">
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 64 64"
                fill="none"
                className="w-16 h-16 mx-auto text-gray-500"
              >
                <path
                  d="M32 8C17.664 8 8 17.664 8 32s9.664 24 24 24 24-9.664 24-24S46.336 8 32 8zm0 44c-11.046 0-20-8.954-20-20s8.954-20 20-20 20 8.954 20 20-8.954 20-20 20zm0-16a4 4 0 110-8 4 4 0 010 8zm0-12a8 8 0 10-16 0 8 8 0 0016 0z"
                  fill="currentColor"
                />
              </svg>

              <h3 className="text-xl font-semibold text-gray-600">No Results Found</h3>
              <p className="text-gray-500 mt-2">We couldn't find any matching data. Please try adjusting your search filters or check back later.</p>
            </div>
          </section>
        ) : null}
      </main>
    </Dashboard>
  );
}
