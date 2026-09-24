import React, { useRef, useState } from 'react';
import { formatNumber } from '../utils/formatUtils';
import { FONT_OPTIONS } from '../utils/fontUtils';

export const Sidebar = ({
    state,
    updateState,
    handleExport,
    handleSaveState,
    handleLoadState,
    clearTextOverride
}) => {
    const {
        enrollment,
        exclusions,
        allocation,
        showFollowUpAnalysis,
        theme,
        showCenterCohortBoxes,
        exclusionLayout,
        randomizedLabel
    } = state;
    const fileInputRef = useRef(null);
    const [exportDpi, setExportDpi] = useState('300');

    const totalExcluded = exclusions.reduce((sum, ex) => sum + (parseInt(ex.count) || 0), 0);
    const randomizedCount = Math.max(0, (parseInt(enrollment.count) || 0) - totalExcluded);

    const addExclusion = () => {
        updateState({
            exclusions: [
                ...exclusions,
                { id: Date.now(), reason: "New Exclusion", count: 0, cohortLabel: "" }
            ]
        });
    };

    const removeExclusion = (idToRemove) => {
        if (clearTextOverride) {
            clearTextOverride(`exclusion-${idToRemove}`);
            clearTextOverride(`cohort-step-${idToRemove}`);
            clearTextOverride('randomized-box', 'title');
        }
        const updatedExclusions = exclusions.filter(ex => ex.id !== idToRemove);
        const lastEx = updatedExclusions.length > 0 ? updatedExclusions[updatedExclusions.length - 1] : null;
        if (lastEx && lastEx.cohortLabel) {
            updateState({
                exclusions: updatedExclusions,
                randomizedLabel: lastEx.cohortLabel
            });
        } else {
            updateState({
                exclusions: updatedExclusions
            });
        }
    };

    const updateExclusion = (id, field, value) => {
        const isLastEx = exclusions.length > 0 && exclusions[exclusions.length - 1].id === id;

        if (clearTextOverride) {
            if (field === 'reason' || field === 'count') {
                clearTextOverride(`exclusion-${id}`);
            }
            if (field === 'cohortLabel') {
                clearTextOverride(`cohort-step-${id}`);
                if (isLastEx) {
                    clearTextOverride('randomized-box', 'title');
                }
            }
        }

        if (field === 'cohortLabel' && isLastEx) {
            updateState({
                randomizedLabel: value,
                exclusions: exclusions.map(ex =>
                    ex.id === id ? { ...ex, [field]: value } : ex
                )
            });
        } else {
            updateState({
                exclusions: exclusions.map(ex =>
                    ex.id === id ? { ...ex, [field]: value } : ex
                )
            });
        }
    };

    const handleEnrollmentLabelChange = (val) => {
        if (clearTextOverride) clearTextOverride('enrollment-box', 'title');
        updateState({ enrollment: { ...enrollment, label: val } });
    };

    const handleEnrollmentCountChange = (val) => {
        if (clearTextOverride) clearTextOverride('enrollment-box', 'content');
        updateState({ enrollment: { ...enrollment, count: parseInt(val) || 0 } });
    };

    const handleRandomizedLabelChange = (val) => {
        if (clearTextOverride) clearTextOverride('randomized-box', 'title');
        const lastEx = exclusions.length > 0 ? exclusions[exclusions.length - 1] : null;
        if (lastEx) {
            if (clearTextOverride) clearTextOverride(`cohort-step-${lastEx.id}`, 'title');
            updateState({
                randomizedLabel: val,
                exclusions: exclusions.map((ex, i) =>
                    i === exclusions.length - 1 ? { ...ex, cohortLabel: val } : ex
                )
            });
        } else {
            updateState({ randomizedLabel: val });
        }
    };

    const handleArmCountChange = (e) => {
        const newCount = parseInt(e.target.value);
        let newArmData = [...(allocation.armData || [])];

        if (newCount > newArmData.length) {
            const defaultLabels = ["Allocated to intervention", "Allocated to control", "Allocated to Group 3", "Allocated to Group 4"];
            for (let i = newArmData.length; i < newCount; i++) {
                newArmData.push({
                    id: Date.now() + i,
                    label: defaultLabels[i] || `Group ${i + 1}`,
                    count: Math.floor(randomizedCount / (newCount || 1))
                });
            }
        } else {
            newArmData = newArmData.slice(0, newCount);
        }

        updateState({
            allocation: { ...allocation, arms: newCount, armData: newArmData }
        });
    };

    const updateArm = (id, field, value) => {
        if (clearTextOverride) {
            if (field === 'label') clearTextOverride(`arm-${id}`, 'title');
            if (field === 'count') {
                clearTextOverride(`arm-${id}`, 'content');
                clearTextOverride(`analysis-${id}`, 'content');
            }
        }
        updateState({
            allocation: {
                ...allocation,
                armData: allocation.armData.map(arm =>
                    arm.id === id ? { ...arm, [field]: value } : arm
                )
            }
        });
    };

    const handleAutoSplitArms = () => {
        const numArms = allocation.arms || 1;
        const baseCount = Math.floor(randomizedCount / numArms);
        const remainder = randomizedCount % numArms;
        const newArmData = allocation.armData.slice(0, numArms).map((arm, idx) => {
            if (clearTextOverride) {
                clearTextOverride(`arm-${arm.id}`, 'content');
                clearTextOverride(`analysis-${arm.id}`, 'content');
            }
            return {
                ...arm,
                count: baseCount + (idx === 0 ? remainder : 0)
            };
        });
        updateState({
            allocation: { ...allocation, armData: newArmData }
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
                            onChange={(e) => handleEnrollmentLabelChange(e.target.value)}
                        />
                    </div>
                    <div className="input-field">
                        <label>Assessed for Eligibility</label>
                        <input
                            type="number"
                            value={enrollment.count}
                            onChange={(e) => handleEnrollmentCountChange(e.target.value)}
                        />
                    </div>
                </section>

                <section className="control-group">
                    <h2>Excluded</h2>

                    <div className="input-field" style={{ flexDirection: 'row', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <input
                            type="checkbox"
                            id="cb-show-center-boxes"
                            checked={showCenterCohortBoxes !== false}
                            onChange={(e) => updateState({ showCenterCohortBoxes: e.target.checked })}
                            style={{ width: 'auto', marginRight: '0.5rem' }}
                        />
                        <label htmlFor="cb-show-center-boxes" style={{ fontWeight: 'normal', margin: 0, fontSize: '0.85rem' }}>
                            Show Remaining Cohort in Center Column
                        </label>
                    </div>

                    <div className="input-field" style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.8rem' }}>Exclusion Side Placement</label>
                        <select
                            value={exclusionLayout || 'alternating'}
                            onChange={(e) => updateState({ exclusionLayout: e.target.value })}
                        >
                            <option value="alternating">Alternating (Both Sides)</option>
                            <option value="right">Right Side Only</option>
                        </select>
                    </div>

                    <div id="exclusion-list">
                        {exclusions.length > 0 && (
                            <div className="exclusion-header exclusion-item" style={{ gridTemplateColumns: '1fr 75px 75px 28px', marginBottom: '0.25rem', paddingBottom: '0.25rem', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Reason</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Excluded</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Remaining</span>
                                <span></span>
                            </div>
                        )}
                        {(() => {
                            let currentRemaining = parseInt(enrollment.count) || 0;
                            return exclusions.map((ex, index) => {
                                const isLastEx = index === exclusions.length - 1;
                                const remainingBeforeThis = currentRemaining;
                                const remainingAfterThis = currentRemaining - (parseInt(ex.count) || 0);
                                currentRemaining = remainingAfterThis;

                                const cohortVal = isLastEx
                                    ? (randomizedLabel !== undefined ? randomizedLabel : (ex.cohortLabel || ''))
                                    : (ex.cohortLabel || '');

                                return (
                                    <div key={ex.id} className="exclusion-card" style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--border-color)' }}>
                                        <div className="exclusion-item" style={{ gridTemplateColumns: '1fr 75px 75px 28px' }}>
                                            <input
                                                type="text"
                                                value={ex.reason}
                                                placeholder="Reason"
                                                title="Reason"
                                                onChange={(e) => updateExclusion(ex.id, 'reason', e.target.value)}
                                            />
                                            <input
                                                type="number"
                                                value={ex.count}
                                                placeholder="0"
                                                title={`Number Excluded (Remaining before this step: ${formatNumber(remainingBeforeThis)})`}
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
                                        {showCenterCohortBoxes !== false && (
                                            <div style={{ marginTop: '0.35rem' }}>
                                                <input
                                                    type="text"
                                                    value={cohortVal}
                                                    placeholder={isLastEx ? "Final Center Box Label (e.g. Valid Survival Data / Randomized)" : "Center Box Label (Optional, e.g. Diagnosis year ≥ 2018)"}
                                                    title={isLastEx ? "Final Center Box Label (linked with Allocation label)" : "Center Box Label"}
                                                    style={{ fontSize: '0.75rem', padding: '0.35rem' }}
                                                    onChange={(e) => updateExclusion(ex.id, 'cohortLabel', e.target.value)}
                                                />
                                            </div>
                                        )}
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
                        <input type="text" readOnly value={formatNumber(totalExcluded)} />
                    </div>
                </section>

                <section className="control-group">
                    <h2>Allocation</h2>
                    <div className="input-field">
                        <label>Number of Arms</label>
                        <select value={allocation.arms} onChange={handleArmCountChange}>
                            <option value="0">None (Single Cohort / Observational)</option>
                            <option value="2">2 Groups</option>
                            <option value="3">3 Groups</option>
                            <option value="4">4 Groups</option>
                        </select>
                    </div>

                    <div className="input-field" style={{ marginTop: '0.75rem' }}>
                        <label>Randomized / Final Cohort Label</label>
                        <input
                            type="text"
                            value={randomizedLabel !== undefined ? randomizedLabel : (exclusions[exclusions.length - 1]?.cohortLabel || "Randomized")}
                            placeholder="e.g. Randomized or Final analytic cohort"
                            onChange={(e) => handleRandomizedLabelChange(e.target.value)}
                        />
                    </div>

                    {allocation.arms > 0 && (
                        <div className="allocation-arms-list" style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                Arm Details (Label & Count)
                            </label>
                            {allocation.armData.slice(0, allocation.arms).map((arm, index) => (
                                <div key={arm.id} style={{ display: 'grid', gridTemplateColumns: '1fr 85px', gap: '0.4rem', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        value={arm.label}
                                        placeholder={`Group ${index + 1} Label`}
                                        title={`Group ${index + 1} Label`}
                                        onChange={(e) => updateArm(arm.id, 'label', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        value={arm.count !== undefined ? arm.count : Math.floor(randomizedCount / allocation.arms)}
                                        placeholder="0"
                                        title={`Group ${index + 1} Count`}
                                        onChange={(e) => updateArm(arm.id, 'count', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            ))}
                            <button
                                type="button"
                                className="btn-secondary"
                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem', marginTop: '0.25rem' }}
                                onClick={handleAutoSplitArms}
                                title="Divide the randomized cohort evenly among arms"
                            >
                                ⚡ Auto-Split Arms Evenly
                            </button>

                            <div className="input-field" style={{ flexDirection: 'row', alignItems: 'center', marginTop: '0.75rem' }}>
                                <input
                                    type="checkbox"
                                    id="cb-show-followup"
                                    checked={showFollowUpAnalysis}
                                    onChange={(e) => updateState({ showFollowUpAnalysis: e.target.checked })}
                                    style={{ width: 'auto', marginRight: '0.5rem' }}
                                />
                                <label htmlFor="cb-show-followup" style={{ fontWeight: 'normal', margin: 0, fontSize: '0.85rem' }}>
                                    Show Follow-Up & Analysis
                                </label>
                            </div>
                        </div>
                    )}
                </section>

                <section className="control-group">
                    <h2>Appearance</h2>
                    <div className="input-field">
                        <label>Theme</label>
                        <select value={theme} onChange={(e) => updateState({ theme: e.target.value })}>
                            <option value="classic">Scientific (Classic)</option>
                            <option value="modern">Modern Blue</option>
                            <option value="dark">Dark Mode</option>
                            <option value="minimalist">Minimalist</option>
                            <option value="pastel">Pastel Pink</option>
                            <option value="emerald">Emerald Brutalism</option>
                        </select>
                    </div>

                    <div className="input-field" style={{ marginTop: '0.75rem' }}>
                        <label>Font Family</label>
                        <select
                            value={state.font || 'default'}
                            onChange={(e) => updateState({ font: e.target.value })}
                        >
                            {FONT_OPTIONS.map((item) => {
                                if (item.category && item.options) {
                                    return (
                                        <optgroup key={item.category} label={item.category}>
                                            {item.options.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </optgroup>
                                    );
                                }
                                return <option key={item.value} value={item.value}>{item.label}</option>;
                            })}
                        </select>
                    </div>
                </section>

                <section className="control-group">
                    <h2>Export Diagram</h2>
                    <div className="input-field" style={{ marginBottom: '0.75rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Image Resolution (DPI)</label>
                        <select
                            value={exportDpi}
                            onChange={(e) => setExportDpi(e.target.value)}
                            style={{ fontSize: '0.85rem' }}
                        >
                            <option value="300">300 DPI (High Res - Journal / Print Default)</option>
                            <option value="600">600 DPI (Ultra High Res - Publication)</option>
                            <option value="150">150 DPI (Medium - Slides / Web)</option>
                            <option value="96">96 DPI (Standard - Screen)</option>
                        </select>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            High resolution (300 DPI) prevents blurriness for journal submissions.
                        </span>
                    </div>

                    <div className="actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button className="btn-primary" onClick={() => handleExport('svg')}>
                            Export to SVG (Vector)
                        </button>
                        <button className="btn-secondary" onClick={() => handleExport('png', exportDpi)}>
                            Export to PNG ({exportDpi} DPI)
                        </button>
                        <button className="btn-secondary" onClick={() => handleExport('jpg', exportDpi)}>
                            Export to JPG ({exportDpi} DPI)
                        </button>
                    </div>
                </section>

                <div className="actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
