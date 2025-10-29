type NoDataProps = {
  text?: string;
  darkMode?: boolean;
};

const NoData = ({ text = "Try adjusting your search or filters.", darkMode = false }: NoDataProps) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-10 ${
        darkMode ? "text-white/80" : "text-primary/70"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`w-16 h-16 mb-4 ${darkMode ? "text-white/60" : "text-primary/60"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M11 17a6 6 0 100-12 6 6 0 000 12zm4-6h.01"
        />
      </svg>
      <h3 className={`text-lg font-medium ${darkMode ? "text-white" : "text-primary/80"}`}>No results found</h3>
      <p className={`text-sm mt-1 ${darkMode ? "text-white/50" : "text-gray-400"}`}>{text}</p>
    </div>
  );
};

export default NoData;
