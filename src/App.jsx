import React, { useState, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Diagram } from './components/Diagram';
import { downloadSvg, downloadImage } from './utils/exportUtils';
import './index.css';

const defaultState = {
    theme: 'modern',
    font: 'default',
    showFollowUpAnalysis: true,
    enrollment: { label: "Assessed for eligibility", count: 135 },
    exclusionLabel: "Excluded",
    exclusions: [
        { id: Date.now(), reason: "Not meeting inclusion criteria", count: 20 },
        { id: Date.now() + 1, reason: "Declined to participate", count: 12 }
    ],
    randomizedLabel: "Randomized",
    allocation: {
        arms: 2,
        armData: [
            { id: 1, label: "Allocated to intervention", count: 50 },
            { id: 2, label: "Allocated to control", count: 53 }
        ]
    },
    followUp: { label: "Follow-Up", lostLabel: "Lost to follow-up", discontinuedLabel: "Discontinued intervention" },
    analysis: { label: "Analysis", analysedLabel: "Analysed" }
};

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', color: 'red', background: 'white' }}>
                    <h1>Something went wrong.</h1>
                    <pre>{this.state.error && this.state.error.toString()}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

function App() {
    const [state, setState] = useState(defaultState);
    const [textOverrides, setTextOverrides] = useState({});
    const diagramRef = useRef(null);

    const updateState = (updates) => {
        setState(prev => ({ ...prev, ...updates }));
    };

    const handleOverrideText = (id, key, newText) => {
        setTextOverrides(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || {}),
                [key]: newText
            }
        }));
    };

    const handleExport = (format) => {
        if (format === 'svg') {
            downloadSvg(diagramRef.current, state.theme, state.font);
        } else {
            downloadImage(diagramRef.current, state.theme, format);
        }
    };

    const handleSaveState = () => {
        const dataToSave = JSON.stringify({ state, textOverrides }, null, 2);
        const blob = new Blob([dataToSave], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "consort-state.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleLoadState = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (parsed.state) {
                    setState(parsed.state);
                }
                if (parsed.textOverrides) {
                    setTextOverrides(parsed.textOverrides);
                }
            } catch (err) {
                alert("Failed to load state. Invalid JSON format.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <ErrorBoundary>
            <div className={`app-layout theme-${state.theme}`}>
                <Sidebar
                    state={state}
                    updateState={updateState}
                    handleExport={handleExport}
                    handleSaveState={handleSaveState}
                    handleLoadState={handleLoadState}
                />
                <main className="preview-area">
                    <div
                        ref={diagramRef}
                        className={`consort-diagram ${state.font && state.font !== 'default' ? 'has-custom-font' : ''}`}
                        id="diagram-container"
                        style={state.font && state.font !== 'default' ? { '--custom-diagram-font': state.font, fontFamily: state.font } : {}}
                    >
                        <Diagram
                            state={state}
                            textOverrides={textOverrides}
                            onOverrideText={handleOverrideText}
                            containerRef={diagramRef}
                        />
                    </div>
                </main>
            </div>
        </ErrorBoundary>
    );
}

export default App;
