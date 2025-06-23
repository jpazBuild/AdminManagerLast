/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import InteractionItem from "./components/Interaction";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Dashboard } from "./Layouts/dashboard";
import NotFound from "../../public/NotFoundResults.svg"
import Image from "next/image";
import { TOKEN_API } from "@/config";

interface TestCase<T = object> {
  testCaseName: string;
  testCaseDescription: string;
  moduleName: string;
  subModuleName: string;
  tagName: string;
  executionTypeName: string;
  stepsData: T[];
}

interface ApiResponse {
  data: any;
  response: TestCase[];
}

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    moduleName: "",
    tagName: "",
    subModuleName: "",
  });
  //const [module, setModule] = useState<string>("");
  const [data, setData] = useState<ApiResponse | null>(null);
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

  type FilterValues = string | string[];
  type Filters = Record<string, FilterValues>;

  const buildQuery = () => {
    const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && typeof value === "string" && value.trim()) {
        acc[key] = key === "tagName" ? [value.trim()] : value.trim();
      }
      return acc;
    }, {} as Filters);

    // Convertir activeFilters a un formato que URLSearchParams entienda
    const searchParams: [string, string][] = [];

    for (const [key, value] of Object.entries(activeFilters)) {
      if (Array.isArray(value)) {
        // Si el valor es un array, creamos múltiples entradas para cada valor del array
        value.forEach(val => searchParams.push([key, String(val)]));
      } else {
        searchParams.push([key, String(value)]);
      }
    }

    // Crear los parámetros de búsqueda
    const params = new URLSearchParams(searchParams).toString();
    return params;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = buildQuery();
      const apiUrl = `${process.env.URL_API_INTEGRATION}retrieveAutomationFlow?${params}`;
      const response = await fetch(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN_API}`,
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

  const handleClearField = (field: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [field]: "",
    }));
  };

  return (
    <Dashboard onToggleDarkMode={handleToggleDarkMode}
    >
      <main className="flex-1 ml-0 lg:ml-[25%] h-screen overflow-y-auto p-4 ">
        <section className="mb-8">
          <h3 className="text-xl font-bold mb-4">Searching Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(filters).map((field) => (
              <div key={field} className="relative">
                <input
                  type="text"
                  name={field}
                  value={filters[field as keyof typeof filters]}
                  onChange={handleInputChange}
                  placeholder={`Filter by ${field}`}
                  className={`bg-transparent backdrop:bg-transparent decoration-transparent p-3 pr-10 border rounded-md focus:ring-2 transition-colors duration-300 w-full ${filters[field as keyof typeof filters]
                    ? darkMode
                      ? "text-gray-100 border-gray-500"
                      : "text-gray-900 border-[#021d3d]"
                    : darkMode
                      ? "text-gray-100 border-gray-600 focus:ring-gray-500"
                      : "text-gray-900 border-gray-300 focus:ring-[#021d3d]"
                    }`}
                />
                {filters[field as keyof typeof filters] && (
                  <button
                    type="button"
                    onClick={() => handleClearField(field)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 focus:outline-none`}
                  >
                    &#x2715;
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={fetchData}
            className={`mt-4 px-6 py-2 rounded-md font-semibold transition-colors duration-300 ${darkMode ? "bg-[#021d3d] text-white hover:bg-[#021d3d]" : "bg-[#021d3d] text-white hover:bg-[#021d3d]"}`}
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
                      <div className="flex gap-2">
                        <span className="bg-slate-900 text-white py-1 px-2 rounded-lg">{...item.tags}</span>
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
                      </div>
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
              <Image
                src={NotFound}
                alt="Not found"
              />
              <h3 className="text-xl font-semibold text-gray-600">No Results Found</h3>
              <p className="text-gray-500 mt-2">We could not find any matching data. Please try adjusting your search filters or check back later.</p>
            </div>
          </section>
        ) : null}
      </main>
    </Dashboard>
  );
}