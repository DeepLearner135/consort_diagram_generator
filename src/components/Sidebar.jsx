import React, { useRef } from 'react';

export const Sidebar = ({
    state,
    updateState,
    handleExport,
    handleSaveState,
    handleLoadState
}) => {
    const { enrollment, exclusions, allocation, showFollowUpAnalysis, theme } = state;
    const fileInputRef = useRef(null);

    const addExclusion = () => {
        updateState({
            exclusions: [
                ...exclusions,
                { id: Date.now(), reason: "New Exclusion", count: 0 }
            ]
        });
    };

    const removeExclusion = (idToRemove) => {
        updateState({
            exclusions: exclusions.filter(ex => ex.id !== idToRemove)
        });
    };

    const updateExclusion = (id, field, value) => {
        updateState({
            exclusions: exclusions.map(ex =>
                ex.id === id ? { ...ex, [field]: value } : ex
            )
        });
    };

    const totalExcluded = exclusions.reduce((sum, ex) => sum + (parseInt(ex.count) || 0), 0);

    const handleArmCountChange = (e) => {
        const newCount = parseInt(e.target.value);
        let newArmData = [...allocation.armData];

        if (newCount > newArmData.length) {
            for (let i = newArmData.length; i < newCount; i++) {
                newArmData.push({ id: Date.now() + i, label: `Group ${i + 1}`, count: 0 });
            }
        } else {
            newArmData = newArmData.slice(0, newCount);
        }

        updateState({
            allocation: { ...allocation, arms: newCount, armData: newArmData }
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleLoadState(file);
        }
    };

    return (
        <aside className="sidebar">
            <header>
                <h1>Consort Gen</h1>
                <p>Clinical Trial Flow Diagram</p>
            </header>

            <div className="controls">
                <section className="control-group">
                    <h2>Enrollment</h2>
                    <div className="input-field mb-2">
                        <input
                            type="text"
                            className="full-width input-sm"
                            placeholder="Label (e.g. Residents)"
                            value={enrollment.label}
                            onChange={(e) => updateState({ enrollment: { ...enrollment, label: e.target.value } })}
                        />
                    </div>
                    <div className="input-field">
                        <label>Assessed for Eligibility</label>
                        <input
                            type="number"
                            value={enrollment.count}
                            onChange={(e) => updateState({ enrollment: { ...enrollment, count: parseInt(e.target.value) || 0 } })}
                        />
                    </div>
                </section>

                <section className="control-group">
                    <h2>Excluded</h2>
                    <div id="exclusion-list">
                        {exclusions.length > 0 && (
                            <div className="exclusion-header exclusion-item" style={{ gridTemplateColumns: '1fr 80px 80px 32px', marginBottom: '0.25rem', paddingBottom: '0.25rem', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Reason</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Excluded</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Remaining</span>
                                <span></span>
                            </div>
                        )}
                        {(() => {
                            let currentRemaining = parseInt(enrollment.count) || 0;
                            return exclusions.map((ex) => {
                                const remainingBeforeThis = currentRemaining;
                                const remainingAfterThis = currentRemaining - (parseInt(ex.count) || 0);
                                currentRemaining = remainingAfterThis;

                                return (
                                    <div key={ex.id} className="exclusion-item">
                                        <input
                                            type="text"
                                            value={ex.reason}
                                            placeholder="Reason"
                                            onChange={(e) => updateExclusion(ex.id, 'reason', e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            value={ex.count}
                                            placeholder="0"
                                            title={`Number Excluded (Remaining before this step: ${remainingBeforeThis})`}
                                            onChange={(e) => updateExclusion(ex.id, 'count', parseInt(e.target.value) || 0)}
                                        />
                                        <input
                                            type="number"
                                            value={remainingAfterThis}
                                            placeholder="0"
                                            title="Remaining after this exclusion"
                                            onChange={(e) => {
                                                const newRemaining = parseInt(e.target.value) || 0;
                                                const newExcluded = remainingBeforeThis - newRemaining;
                                                updateExclusion(ex.id, 'count', Math.max(0, newExcluded));
                                            }}
                                        />
                                        <button
                                            className="del-btn"
                                            title="Remove"
                                            onClick={() => removeExclusion(ex.id)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                    <button className="btn-secondary" onClick={addExclusion}>
                        + Add Exclusion Reason
                    </button>

                    <div className="input-field" style={{ marginTop: '1rem' }}>
                        <label>Total Excluded (Auto-calc)</label>
                        <input type="number" readOnly value={totalExcluded} />
                    </div>
                </section>

                <section className="control-group">
                    <h2>Allocation</h2>
                    <div className="input-field">
                        <label>Number of Arms</label>
                        <select value={allocation.arms} onChange={handleArmCountChange}>
                            <option value="2">2 Groups</option>
                            <option value="3">3 Groups</option>
                            <option value="4">4 Groups</option>
                        </select>
                    </div>

                    <div className="input-field" style={{ flexDirection: 'row', alignItems: 'center', marginTop: '1rem' }}>
                        <input
                            type="checkbox"
                            id="cb-show-followup"
                            checked={showFollowUpAnalysis}
                            onChange={(e) => updateState({ showFollowUpAnalysis: e.target.checked })}
                            style={{ width: 'auto', marginRight: '0.5rem' }}
                        />
                        <label htmlFor="cb-show-followup" style={{ fontWeight: 'normal', margin: 0 }}>
                            Show Follow-Up & Analysis
                        </label>
                    </div>
                </section>

                <section className="control-group">
                    <h2>Appearance</h2>
                    <div className="input-field">
                        <label>Theme</label>
                        <select value={theme} onChange={(e) => updateState({ theme: e.target.value })}>
                            <option value="classic">Scientific (Classic)</option>
                            <option value="modern">Modern Blue</option>
                            <option value="dark">Dark Mode</option>
                        </select>
                    </div>
                </section>

                <div className="actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button className="btn-primary" onClick={() => handleExport('svg')}>Export to SVG</button>
                    <button className="btn-secondary" onClick={() => handleExport('png')}>Export to PNG</button>
                    <button className="btn-secondary" onClick={() => handleExport('jpg')}>Export to JPG</button>

                    <hr style={{ margin: '0.5rem 0', borderColor: 'var(--border-color)' }} />

                    <button className="btn-secondary" onClick={handleSaveState}>Save Project</button>
                    <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>Load Project</button>
                    <input
                        type="file"
                        accept=".json"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>
        </aside>
    );
};
