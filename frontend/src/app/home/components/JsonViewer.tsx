// components/JsonViewer/JsonViewer.tsx
import { useState } from "react";

const JsonViewer = ({ jsonData }: { jsonData: any }) => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const handleToggleExpand = (key: string) => {
        const newExpanded = new Set(expanded);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpanded(newExpanded);
    };

    const renderJson = (data: any, parentKey: string = '') => {
        if (typeof data !== 'object' || data === null) {
            return <span style={getValueStyle(data)}>{JSON.stringify(data)}</span>;
        }

        if (Array.isArray(data)) {
            return (
                <div style={{ marginLeft: 20 }}>
                    [
                    {data.map((item, index) => (
                        <div key={index}>
                            {renderJson(item, `${parentKey}[${index}]`)}
                            {index < data.length - 1 && ','}
                        </div>
                    ))}
                    ]
                </div>
            );
        }

        return (
            <div style={{ marginLeft: 20 }}>
                {Object.keys(data).map((key, index) => {
                    const isExpanded = expanded.has(`${parentKey}${key}`);
                    const value = data[key];
                    return (
                        <div
                            key={key}
                            className="json-property-card"
                            style={{
                                marginBottom: '8px',
                                padding: '8px',
                                borderRadius: '8px',
                                background: '#f9f9f9',
                                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            <div
                                onClick={() => handleToggleExpand(`${parentKey}${key}`)}
                                style={{
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '16px',
                                    color: '#333',
                                }}
                            >
                                <span style={{ color: '#4a90e2' }}>
                                    {key}:
                                    {!isExpanded && typeof value === 'object' ? ' {' : null}
                                </span>
                                {isExpanded ? (
                                    <span style={{ color: '#27ae60', fontSize: '18px' }}>▲</span>
                                ) : (
                                    <span style={{ color: '#e74c3c', fontSize: '18px' }}>▼</span>
                                )}
                            </div>
                            {isExpanded && (
                                <div style={{ marginLeft: '20px', transition: 'all 0.3s ease' }}>
                                    {renderJson(value, `${parentKey}${key}.`)}
                                </div>
                            )}
                            {isExpanded && typeof value === 'object' && '}'}
                        </div>
                    );
                })}
            </div>
        );
    };

    const getValueStyle = (value: any) => {
        if (typeof value === 'string') {
            return { color: '#2d3e50', fontStyle: 'italic' };  // Color para strings
        }
        if (typeof value === 'number') {
            return { color: '#e74c3c', fontWeight: 'bold' };  // Color para números
        }
        if (typeof value === 'boolean') {
            return { color: '#27ae60', fontWeight: 'bold' };  // Color para booleanos
        }
        return { color: '#95a5a6' };  // Color por defecto para otros tipos
    };

    return (
        <div
            style={{
                maxWidth: '100%',
                wordWrap: 'break-word',
                fontFamily: 'monospace',
                backgroundColor: '#fff',
                padding: '16px',
                borderRadius: '8px',
                overflowX: 'auto',
                border: '1px solid #ddd',
                boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)',
            }}
        >
            {renderJson(jsonData)}
        </div>
    );
};

export default JsonViewer;
