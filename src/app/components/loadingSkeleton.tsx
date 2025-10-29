

const LoadingSkeleton = ({ darkMode }: { darkMode: boolean }) => {


    return(
        <div className="flex flex-col w-full gap-2 mt-10">
            <div className={`w-full h-20 rounded-md ${darkMode ? "bg-gray-800" : "bg-gray-200"} animate-pulse`}></div>
            <div className={`w-full h-20 rounded-md ${darkMode ? "bg-gray-800" : "bg-gray-200"} animate-pulse`}></div>
            <div className={`w-full h-20 rounded-md ${darkMode ? "bg-gray-800" : "bg-gray-200"} animate-pulse`}></div>

          </div>
    )
}

export default LoadingSkeleton;