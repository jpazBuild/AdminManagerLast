"use client"

const JSONEditor = ({selectedRequest}:{selectedRequest:any}) => {

    return (
        <div className="w-full font-mono text-xs">
            <div className="mb-2 flex items-center gap-4">
                <span className="text-blue-700 font-bold">{'{'}</span>
                <span className="text-orange-500 font-semibold">{selectedRequest.response?.status} OK</span>
                <span className="text-slate-500">|</span>
                <span className="text-orange-500">timestamp: &quot;{selectedRequest.response?.timestamp}&quot;</span>
            </div>
            <div className="pl-4">
                <span className="text-blue-700">&quot;data&quot;</span>
                <span className="text-slate-500">: </span>
                <span className="text-blue-700">{'{'}</span>
                <div className="pl-4">
                    <span className="text-blue-700">&quot;message&quot;</span>
                    <span className="text-slate-500">: </span>
                    <span className="text-green-700">&quot;{selectedRequest.response?.data?.message}&quot;</span>
                    <span className="text-slate-500">,</span>
                    <br />
                    <span className="text-blue-700">&quot;requestUrl&quot;</span>
                    <span className="text-slate-500">: </span>
                    <span className="text-green-700">&quot;{selectedRequest.response?.data?.requestUrl}&quot;</span>
                    <span className="text-slate-500">,</span>
                    <br />
                    <span className="text-blue-700">&quot;headers&quot;</span>
                    <span className="text-slate-500">: </span>
                    <span className="text-green-700">{JSON.stringify(selectedRequest.response?.data?.headers, null, 2)}</span>
                    <span className="text-slate-500">,</span>
                    <br />
                    <span className="text-blue-700">&quot;payload&quot;</span>
                    <span className="text-slate-500">: </span>
                    <span className="text-green-700">{JSON.stringify(selectedRequest.response?.data?.payload, null, 2)}</span>
                </div>
                <span className="text-blue-700">{'}'}</span>
            </div>
            <span className="text-blue-700 font-bold">{'}'}</span>
        </div>
    )
}

export default JSONEditor;
