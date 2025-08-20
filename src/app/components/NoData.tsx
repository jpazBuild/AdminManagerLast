const NoData = ({ text = "Try adjusting your search or filters." }: { text?: string }) => {
    return (
      <div className="flex flex-col items-center justify-center text-center text-primary/70 py-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-16 h-16 mb-4"
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
        <h3 className="text-lg font-medium">No results found</h3>
        <p className="text-sm text-gray-400">{text}</p>
      </div>
    );
  };
  
  export default NoData;
  