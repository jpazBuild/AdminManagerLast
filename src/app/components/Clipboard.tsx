import { FiClipboard } from "react-icons/fi"

const ClipboardComponent = ({text,size=18,className="bg-gray-100 rounded-md border border-gray-300 hover:bg-gray-200 focus:ring-indigo-500"}:any) => {
    return (
        <>
            <button
                onClick={() => navigator.clipboard.writeText(text)}
                className={`p-1 ${className} focus:outline-none focus:ring-1 `}
                title="Copy to clipboard"
            >
                <FiClipboard size={size} />
            </button>
        </>
    )
}

export default ClipboardComponent;