import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { DiagramBox } from './DiagramBox';
import { formatNumber } from '../utils/formatUtils';

export const Diagram = ({ state, textOverrides, onOverrideText, containerRef }) => {
    const [lines, setLines] = useState([]);
    const svgRef = useRef(null);
    const mainFlowRef = useRef(null);

    // Calculate default values
    let currentCount = state.enrollment.count;
    const initialCount = currentCount;

    const isRightOnly = state.exclusionLayout === 'right';
    const showCenterBoxes = state.showCenterCohortBoxes !== false;

    const exclusionsData = state.exclusions.map((ex, i) => {
        const excludedCount = parseInt(ex.count) || 0;
        currentCount -= excludedCount;
        const side = isRightOnly ? 'right' : (i % 2 === 0 ? 'right' : 'left');
        return {
            ...ex,
            side,
            remaining: currentCount
        };
    });

    const randomizedCount = currentCount;

    // Render lines after DOM paints nodes
    useLayoutEffect(() => {
        const drawConnections = () => {
            if (!svgRef.current || !mainFlowRef.current) return;

            const containerRect = svgRef.current.getBoundingClientRect();
            const getPos = (el) => {
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                return {
                    x: rect.left - containerRect.left + rect.width / 2,
                    y: rect.top - containerRect.top + rect.height / 2,
                    top: rect.top - containerRect.top,
                    bottom: rect.bottom - containerRect.top,
                    left: rect.left - containerRect.left,
                    right: rect.right - containerRect.left
                };
            };

            const newLines = [];
            const addLine = (x1, y1, x2, y2, withArrow = false) => {
                newLines.push({ x1, y1, x2, y2, withArrow });
            };

            const assessedBox = document.getElementById('enrollment-box');
            if (!assessedBox) return; // Might not be mounted yet

            const mainX = getPos(assessedBox).x;

            if (showCenterBoxes) {
                const N = exclusionsData.length;
                if (N === 0) {
                    const randBox = document.getElementById('randomized-box');
                    if (randBox) {
                        const topP = getPos(assessedBox);
                        const botP = getPos(randBox);
                        addLine(mainX, topP.bottom, mainX, botP.top - 5, true);
                    }
                } else {
                    for (let i = 0; i < N; i++) {
                        const ex = exclusionsData[i];
                        const topId = i === 0 ? 'enrollment-box' : `cohort-step-${exclusionsData[i - 1].id}`;
                        const botId = i === N - 1 ? 'randomized-box' : `cohort-step-${ex.id}`;

                        const topEl = document.getElementById(topId);
                        const botEl = document.getElementById(botId);
                        const exEl = document.getElementById(`exclusion-${ex.id}`);

                        if (!topEl || !botEl || !exEl) continue;

                        const topP = getPos(topEl);
                        const botP = getPos(botEl);
                        const exP = getPos(exEl);

                        const jointY = exP.y;

                        // Vertical line from top box down to joint
                        addLine(mainX, topP.bottom, mainX, jointY);

                        // Horizontal branch to exclusion box with arrowhead
                        if (ex.side === 'right') {
                            addLine(mainX, jointY, exP.left, jointY, true);
                        } else {
                            addLine(mainX, jointY, exP.right, jointY, true);
                        }

                        // Vertical line from joint down into next center box with arrowhead
                        addLine(mainX, jointY, mainX, botP.top - 5, true);
                    }
                }
            } else {
                let lastY = getPos(assessedBox).bottom;

                exclusionsData.forEach(ex => {
                    const box = document.getElementById(`exclusion-${ex.id}`);
                    if (!box) return;

                    const boxRect = getPos(box);
                    const jointY = boxRect.y;

                    addLine(mainX, lastY, mainX, jointY);

                    if (ex.side === 'right') {
                        addLine(mainX, jointY, boxRect.left, jointY, true);
                    } else {
                        addLine(mainX, jointY, boxRect.right, jointY, true);
                    }

                    lastY = jointY;
                });

                const randomizedBox = document.getElementById('randomized-box');
                if (randomizedBox) {
                    const randRect = getPos(randomizedBox);
                    addLine(mainX, lastY, mainX, randRect.top - 5, true);
                }
            }

            // Allocation Area
            if (state.allocation.arms > 0) {
                const randomizedBox = document.getElementById('randomized-box');
                if (randomizedBox) {
                    const randRect = getPos(randomizedBox);
                    const forkY = randRect.bottom + 20;
                    addLine(mainX, randRect.bottom, mainX, forkY);

                    const armCols = Array.from(document.querySelectorAll('.arm-col'));
                    if (armCols.length > 0) {
                        const firstRect = getPos(armCols[0].children[0]);
                        const lastRect = getPos(armCols[armCols.length - 1].children[0]);

                        if (firstRect && lastRect) {
                            addLine(firstRect.x, forkY, lastRect.x, forkY);

                            armCols.forEach(col => {
                                const boxes = Array.from(col.querySelectorAll('.dia-box'));
                                if (boxes.length === 0) return;

                                const bPos = getPos(boxes[0]);
                                if (bPos) {
                                    addLine(bPos.x, forkY, bPos.x, bPos.top - 5, true);

                                    for (let i = 0; i < boxes.length - 1; i++) {
                                        const topBox = getPos(boxes[i]);
                                        const botBox = getPos(boxes[i + 1]);
                                        if (topBox && botBox) {
                                            addLine(topBox.x, topBox.bottom, botBox.x, botBox.top - 5, true);
                                        }
                                    }
                                }
                            });
                        }
                    }
                }
            }

            setLines(newLines);
        };

        // Small delay to ensure flex layouts settle
        const timeoutId = setTimeout(drawConnections, 50);

        if (document.fonts) {
            document.fonts.ready.then(drawConnections);
        }

        window.addEventListener('resize', drawConnections);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', drawConnections);
        };
    }, [state, textOverrides]); // Redraw when state or boxes change

    const renderText = (id, key, defaultVal) => {
        return textOverrides[id]?.[key] !== undefined ? textOverrides[id][key] : defaultVal;
    };

    let arrowColor = 'black';
    if (state.theme === 'dark') arrowColor = '#f1f5f9';
    if (state.theme === 'pastel') arrowColor = '#db2777';
    if (state.theme === 'emerald') arrowColor = '#064e3b';
    if (state.theme === 'minimalist') arrowColor = '#9ca3af';

    return (
        <div className="diagram-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* SVG Container for Arrows */}
            <svg
                ref={svgRef}
                className="diagram-lines"
                style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    pointerEvents: 'none', zIndex: 0, overflow: 'visible'
                }}
            >
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill={arrowColor} />
                    </marker>
                </defs>
                {lines.map((l, i) => (
                    <path
                        key={i}
                        d={`M ${l.x1} ${l.y1} L ${l.x2} ${l.y2}`}
                        stroke={arrowColor}
                        strokeWidth="2"
                        fill="none"
                        markerEnd={l.withArrow ? "url(#arrowhead)" : ""}
                    />
                ))}
            </svg>

            {/* Main Flex Layout for Boxes */}
            <div className="main-flow" ref={mainFlowRef}>

                {/* Enrollment */}
                <div className="step-node">
                    <DiagramBox
                        id="enrollment-box"
                        title={renderText('enrollment-box', 'title', state.enrollment.label)}
                        content={renderText('enrollment-box', 'content', `(n=${formatNumber(initialCount)})`)}
                        onTextChange={onOverrideText}
                    />
                </div>

                {/* Exclusions & Center Cohort Boxes */}
                {showCenterBoxes ? (
                    exclusionsData.map((ex, i) => {
                        const isLast = i === exclusionsData.length - 1;
                        return (
                            <React.Fragment key={ex.id}>
                                <div key={`anchor-${ex.id}`} className="joint-row" style={{ zIndex: 2 }}>
                                    <DiagramBox
                                        id={`exclusion-${ex.id}`}
                                        isHtml={true}
                                        title={renderText(`exclusion-${ex.id}`, 'title', state.exclusionLabel || "Excluded")}
                                        content={renderText(`exclusion-${ex.id}`, 'content', `${ex.reason}<br>(n=${formatNumber(ex.count)})`)}
                                        onTextChange={onOverrideText}
                                        style={{
                                            position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                                            width: '210px', fontSize: '0.85rem',
                                            ...(ex.side === 'right' ? { left: 'calc(50% + 180px)', textAlign: 'left' } : { right: 'calc(50% + 180px)', textAlign: 'right' })
                                        }}
                                    />
                                </div>

                                {!isLast && (
                                    <div className="step-node" key={`cohort-${ex.id}`}>
                                        <DiagramBox
                                            id={`cohort-step-${ex.id}`}
                                            title={renderText(`cohort-step-${ex.id}`, 'title', ex.cohortLabel || "Remaining Cohort")}
                                            content={renderText(`cohort-step-${ex.id}`, 'content', `Remaining: (n=${formatNumber(ex.remaining)})`)}
                                            onTextChange={onOverrideText}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })
                ) : (
                    exclusionsData.map(ex => (
                        <div key={ex.id} className="joint-row" style={{ zIndex: 2 }}>
                            <DiagramBox
                                id={`exclusion-${ex.id}`}
                                isHtml={true}
                                title={renderText(`exclusion-${ex.id}`, 'title', state.exclusionLabel || "Excluded")}
                                content={renderText(`exclusion-${ex.id}`, 'content', `${ex.reason}<br>(n=${formatNumber(ex.count)})`)}
                                onTextChange={onOverrideText}
                                style={{
                                    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                                    width: '200px', fontSize: '0.85rem',
                                    ...(ex.side === 'right' ? { left: 'calc(50% + 40px)', textAlign: 'left' } : { right: 'calc(50% + 40px)', textAlign: 'right' })
                                }}
                            />
                        </div>
                    ))
                )}

                {/* Randomized / Final Cohort */}
                {(() => {
                    const lastExclusion = exclusionsData.length > 0 ? exclusionsData[exclusionsData.length - 1] : null;
                    const finalBoxTitle = (showCenterBoxes && lastExclusion?.cohortLabel)
                        ? lastExclusion.cohortLabel
                        : (state.randomizedLabel !== undefined ? state.randomizedLabel : "Randomized");
                    return (
                        <div className="step-node">
                            <DiagramBox
                                id="randomized-box"
                                title={renderText('randomized-box', 'title', finalBoxTitle)}
                                content={renderText('randomized-box', 'content', `(n=${formatNumber(randomizedCount)})`)}
                                onTextChange={onOverrideText}
                            />
                        </div>
                    );
                })()}

                {/* Allocation */}
                {state.allocation.arms > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', gap: '2rem', marginTop: '40px', zIndex: 2 }}>
                        {state.allocation.armData.slice(0, state.allocation.arms).map(arm => {
                            const armCount = (arm.count !== undefined && arm.count !== null && arm.count !== '')
                                ? arm.count
                                : Math.floor(randomizedCount / state.allocation.arms);
                            return (
                                <div key={arm.id} className="arm-col">
                                    <DiagramBox
                                        id={`arm-${arm.id}`}
                                        title={renderText(`arm-${arm.id}`, 'title', arm.label)}
                                        content={renderText(`arm-${arm.id}`, 'content', `(n=${formatNumber(armCount)})`)}
                                        onTextChange={onOverrideText}
                                    />

                                    {state.showFollowUpAnalysis && (
                                        <>
                                            <DiagramBox
                                                id={`followup-${arm.id}`}
                                                isHtml={true}
                                                title={renderText(`followup-${arm.id}`, 'title', state.followUp.label)}
                                                content={renderText(`followup-${arm.id}`, 'content', `${state.followUp.lostLabel} (n=0)<br>${state.followUp.discontinuedLabel} (n=0)`)}
                                                onTextChange={onOverrideText}
                                            />
                                            <DiagramBox
                                                id={`analysis-${arm.id}`}
                                                title={renderText(`analysis-${arm.id}`, 'title', state.analysis.label)}
                                                content={renderText(`analysis-${arm.id}`, 'content', `${state.analysis.analysedLabel} (n=${formatNumber(armCount)})`)}
                                                onTextChange={onOverrideText}
                                            />
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
};
