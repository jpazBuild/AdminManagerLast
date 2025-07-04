// src/workers/jsonParse.worker.js
self.onmessage = function(e) {
    try {
        const data = JSON.parse(e.data);
        self.postMessage({ success: true, data });
    } catch (err) {
        self.postMessage({ success: false, error: err.message });
    }
};
