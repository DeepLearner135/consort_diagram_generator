document.addEventListener('DOMContentLoaded', () => {
    // State
    const state = {
        title: "CONSORT Flow Diagram",
        showFollowUpAnalysis: true,
        theme: 'classic', // Default theme
        enrollment: {
            label: "Assessed for eligibility",
            count: 135
        },
        exclusionLabel: "Excluded",
        exclusions: [
            { reason: "Not meeting inclusion criteria", count: 20 },
            { reason: "Declined to participate", count: 12 }
        ],
        randomizedLabel: "Randomized",
        allocation: {
            arms: 2,
            interventionLabel: "Allocated to intervention",
            controlLabel: "Allocated to control",
            armData: [
                { name: "Allocated to intervention", label: "Allocated to intervention", count: 50 },
                { name: "Allocated to control", label: "Allocated to control", count: 53 }
            ]
        },
        followUp: {
            label: "Follow-Up",
            lostLabel: "Lost to follow-up",
            discontinuedLabel: "Discontinued intervention"
        },
        analysis: {
            label: "Analysis",
            analysedLabel: "Analysed"
        }
    };

    // DOM Elements
    const assessedInput = document.getElementById('assessed');
    const exclusionList = document.getElementById('exclusion-list');
    const addExclusionBtn = document.getElementById('add-exclusion-btn');
    const totalExcludedInput = document.getElementById('total-excluded');
    const armCountSelect = document.getElementById('arm-count');
    const diagramContainer = document.getElementById('diagram-container');
    const printBtn = document.getElementById('print-btn');
    const exportSvgBtn = document.getElementById('export-svg-btn');
    const themeSelect = document.getElementById('theme-select');

    // Init
    function init() {
        if (!assessedInput) return;
        setupSidebarExtras();
        renderControls();

        // Critical: Apply theme so boxes are visible
        applyTheme(state.theme);

        renderDiagram();
        bindEvents();
    }

    function setupSidebarExtras() {
        // Label input for Enrollment
        const enrollmentGroup = assessedInput.closest('.control-group');
        let labelInput = enrollmentGroup.querySelector('.enrollment-label-input');
        if (!labelInput) {
            labelInput = document.createElement('input');
            labelInput.type = "text";
            labelInput.className = "mb-2 full-width input-sm enrollment-label-input";
            labelInput.placeholder = "Label (e.g. Residents)";
            enrollmentGroup.insertBefore(labelInput, enrollmentGroup.querySelector('.input-field'));

            labelInput.addEventListener('input', (e) => {
                state.enrollment.label = e.target.value;
                renderDiagram();
            });
        }
        labelInput.value = state.enrollment.label;

        // Toggle for FollowUp/Analysis
        const allocationSection = armCountSelect.closest('.control-group');
        let toggleDiv = document.getElementById('toggle-followup');
        if (!toggleDiv) {
            toggleDiv = document.createElement('div');
            toggleDiv.id = 'toggle-followup';
            toggleDiv.className = 'input-field mt-2';
            toggleDiv.style.flexDirection = 'row';
            toggleDiv.style.alignItems = 'center';
            toggleDiv.style.marginTop = '1rem';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.id = 'cb-show-followup';
            cb.checked = state.showFollowUpAnalysis;
            cb.style.width = 'auto';
            cb.style.marginRight = '0.5rem';

            cb.addEventListener('change', (e) => {
                state.showFollowUpAnalysis = e.target.checked;
                renderDiagram();
            });

            const lbl = document.createElement('label');
            lbl.htmlFor = 'cb-show-followup';
            lbl.innerText = "Show Follow-Up & Analysis";
            lbl.style.fontWeight = "normal";

            toggleDiv.appendChild(cb);
            toggleDiv.appendChild(lbl);

            allocationSection.appendChild(toggleDiv);
        }
    }

    function bindEvents() {
        assessedInput.addEventListener('input', (e) => {
            state.enrollment.count = parseInt(e.target.value) || 0;
            renderDiagram();
        });

        addExclusionBtn.addEventListener('click', () => {
            state.exclusions.push({ reason: "New Exclusion", count: 0 });
            renderControls();
            renderDiagram();
        });

        armCountSelect.addEventListener('change', (e) => {
            const newCount = parseInt(e.target.value);
            const currentCount = state.allocation.armData.length;
            if (newCount > currentCount) {
                for (let i = currentCount; i < newCount; i++) {
                    state.allocation.armData.push({
                        name: `Group ${i + 1}`,
                        label: `Group ${i + 1}`,
                        count: 0
                    });
                }
            } else {
                state.allocation.armData = state.allocation.armData.slice(0, newCount);
            }
            state.allocation.arms = newCount;
            renderDiagram();
        });

        // Theme Switch
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                applyTheme(e.target.value);
            });
        }

        printBtn.addEventListener('click', () => window.print());

        if (exportSvgBtn) {
            exportSvgBtn.addEventListener('click', () => {
                downloadSvg();
            });
        }

        // Removed PNG support as requested
    }

    function applyTheme(theme) {
        state.theme = theme;
        diagramContainer.className = `consort-diagram theme-${theme}`;
        renderDiagram();
    }

    function getArrowColor() {
        return state.theme === 'dark' ? '#f1f5f9' : 'black';
    }

    function renderControls() {
        assessedInput.value = state.enrollment.count;
        exclusionList.innerHTML = '';
        let totalExcluded = 0;

        state.exclusions.forEach((ex, index) => {
            totalExcluded += ex.count;

            const div = document.createElement('div');
            div.className = 'exclusion-item';

            const reasonInput = document.createElement('input');
            reasonInput.type = 'text';
            reasonInput.value = ex.reason;
            reasonInput.placeholder = 'Reason';
            reasonInput.addEventListener('input', (e) => {
                state.exclusions[index].reason = e.target.value;
                renderDiagram();
            });

            const countInput = document.createElement('input');
            countInput.type = 'number';
            countInput.value = ex.count;
            countInput.placeholder = '0';
            countInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value) || 0;
                state.exclusions[index].count = val;
                renderControls();
                renderDiagram();
            });

            const delBtn = document.createElement('button');
            delBtn.textContent = '×';
            delBtn.style.color = 'red';
            delBtn.style.border = 'none';
            delBtn.style.background = 'transparent';
            delBtn.style.cursor = 'pointer';
            delBtn.title = "Remove";
            delBtn.addEventListener('click', () => {
                state.exclusions.splice(index, 1);
                renderControls();
                renderDiagram();
            });

            div.appendChild(reasonInput);
            div.appendChild(countInput);
            div.appendChild(delBtn);
            exclusionList.appendChild(div);
        });

        totalExcludedInput.value = totalExcluded;
    }

    function renderDiagram() {
        diagramContainer.innerHTML = '';

        // Canvas for SVG
        const svgCanvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgCanvas.style.position = "absolute";
        svgCanvas.style.top = 0;
        svgCanvas.style.left = 0;
        svgCanvas.style.width = "100%";
        svgCanvas.style.height = "100%";
        svgCanvas.style.pointerEvents = "none";
        svgCanvas.style.zIndex = 0;
        svgCanvas.style.overflow = "visible";
        diagramContainer.appendChild(svgCanvas);

        const arrowColor = getArrowColor();

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute("id", "arrowhead");
        marker.setAttribute("markerWidth", "10");
        marker.setAttribute("markerHeight", "7");
        marker.setAttribute("refX", "9");
        marker.setAttribute("refY", "3.5");
        marker.setAttribute("orient", "auto");
        const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        poly.setAttribute("points", "0 0, 10 3.5, 0 7");
        poly.setAttribute("fill", arrowColor);
        marker.appendChild(poly);
        defs.appendChild(marker);
        svgCanvas.appendChild(defs);

        const getPos = (el) => {
            const rect = el.getBoundingClientRect();
            const containerRect = diagramContainer.getBoundingClientRect();
            return {
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top + rect.height / 2,
                top: rect.top - containerRect.top,
                bottom: rect.bottom - containerRect.top,
                left: rect.left - containerRect.left,
                right: rect.right - containerRect.left,
                width: rect.width,
                height: rect.height
            };
        };

        const drawLine = (x1, y1, x2, y2, withArrow = false) => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
            const d = `M ${x1} ${y1} L ${x2} ${y2}`;
            line.setAttribute("d", d);
            line.setAttribute("stroke", arrowColor);
            line.setAttribute("stroke-width", "2");
            line.setAttribute("fill", "none");
            if (withArrow) {
                line.setAttribute("marker-end", "url(#arrowhead)");
            }
            svgCanvas.appendChild(line);
        };

        // Main Column
        const mainCol = document.createElement('div');
        mainCol.className = 'main-flow';
        mainCol.style.display = 'flex';
        mainCol.style.flexDirection = 'column';
        mainCol.style.alignItems = 'center';
        mainCol.style.gap = '60px'; // Increased gap for arrows
        mainCol.style.zIndex = 1;
        diagramContainer.appendChild(mainCol);

        // 1. Enrollment
        const assessedBox = createBox(state.enrollment.label, `(n=${state.enrollment.count})`);
        const enrollmentStep = document.createElement('div');
        enrollmentStep.className = 'step-node';
        enrollmentStep.appendChild(assessedBox);
        mainCol.appendChild(enrollmentStep);

        let currentCount = state.enrollment.count;

        // Exclusions
        state.exclusions.forEach((ex, i) => {
            currentCount -= ex.count;
            const side = (i % 2 === 0) ? 'right' : 'left';

            const jointRow = document.createElement('div');
            jointRow.className = 'joint-row';
            jointRow.style.position = 'relative';
            jointRow.style.width = '100%';
            jointRow.style.height = '0px';
            jointRow.style.display = 'flex';
            jointRow.style.justifyContent = 'center';

            const exBox = createBox("", `${ex.reason} (n=${ex.count})`, true);
            exBox.style.position = "absolute";
            exBox.style.top = "50%";
            exBox.style.transform = "translateY(-50%)";
            exBox.style.width = "200px";
            exBox.style.textAlign = "left";
            exBox.style.fontSize = "0.85rem";

            if (side === 'right') {
                exBox.style.left = "calc(50% + 40px)";
            } else {
                exBox.style.right = "calc(50% + 40px)";
                exBox.style.textAlign = "right";
            }

            jointRow.appendChild(exBox);
            mainCol.appendChild(jointRow);

            ex.domNode = jointRow;
            ex.boxNode = exBox;
            ex.side = side;
        });

        // Randomized
        const randomizedBox = createBox(state.randomizedLabel, `(n=${currentCount})`);
        mainCol.appendChild(randomizedBox);

        // Allocation Area
        const allocationRow = document.createElement('div');
        allocationRow.style.display = 'flex';
        allocationRow.style.justifyContent = 'space-around';
        allocationRow.style.width = '100%';
        allocationRow.style.gap = '2rem';
        allocationRow.style.marginTop = '40px';

        state.allocation.armData.forEach(arm => {
            const armCol = document.createElement('div');
            armCol.className = 'arm-col';
            armCol.style.display = 'flex';
            armCol.style.flexDirection = 'column';
            armCol.style.alignItems = 'center';
            armCol.style.gap = '40px';

            let count = Math.floor(currentCount / state.allocation.arms);
            const armBox = createBox(arm.label, `(n=${count})`);
            armCol.appendChild(armBox);

            if (state.showFollowUpAnalysis) {
                const followText = `${state.followUp.lostLabel} (n=0)<br>${state.followUp.discontinuedLabel} (n=0)`;
                const followBox = createBox(state.followUp.label, followText, true);
                armCol.appendChild(followBox);

                const analysisBox = createBox(state.analysis.label, `${state.analysis.analysedLabel} (n=${count})`);
                armCol.appendChild(analysisBox);
            }

            allocationRow.appendChild(armCol);
        });

        mainCol.appendChild(allocationRow);

        // --- DRAW CONNECTIONS ---
        setTimeout(() => {
            let lastY = getPos(assessedBox).bottom;
            const mainX = getPos(assessedBox).x;

            state.exclusions.forEach(ex => {
                const box = ex.boxNode;
                const boxRect = getPos(box);
                const jointY = boxRect.y;

                drawLine(mainX, lastY, mainX, jointY);

                if (ex.side === 'right') {
                    drawLine(mainX, jointY, boxRect.left, jointY, true);
                } else {
                    drawLine(mainX, jointY, boxRect.right, jointY, true);
                }

                lastY = jointY;
            });

            const randRect = getPos(randomizedBox);
            drawLine(mainX, lastY, mainX, randRect.top - 5, true);

            const forkY = randRect.bottom + 20;
            drawLine(mainX, randRect.bottom, mainX, forkY);

            const armCols = allocationRow.querySelectorAll('.arm-col');
            if (armCols.length > 0) {
                const firstRect = getPos(armCols[0].children[0]);
                const lastRect = getPos(armCols[armCols.length - 1].children[0]);

                drawLine(firstRect.x, forkY, lastRect.x, forkY);

                armCols.forEach(col => {
                    const box = col.children[0];
                    const bPos = getPos(box);
                    drawLine(bPos.x, forkY, bPos.x, bPos.top - 5, true);

                    const childBoxes = col.querySelectorAll('.dia-box');
                    for (let i = 0; i < childBoxes.length - 1; i++) {
                        const topBox = getPos(childBoxes[i]);
                        const botBox = getPos(childBoxes[i + 1]);
                        drawLine(topBox.x, topBox.bottom, botBox.x, botBox.top - 5, true);
                    }
                });
            }

            const h = diagramContainer.scrollHeight;
            svgCanvas.style.height = (h + 50) + "px";

        }, 150);
    }

    function createBox(title, content, isHtml = false) {
        const box = document.createElement('div');
        box.className = 'dia-box';

        const titleInput = document.createElement('div');
        titleInput.innerText = title;
        titleInput.className = 'dia-label';
        titleInput.contentEditable = true;

        const contentSpan = document.createElement('div');
        contentSpan.className = 'dia-count';
        contentSpan.contentEditable = true;
        if (isHtml) {
            contentSpan.innerHTML = content;
        } else {
            contentSpan.innerText = content;
        }

        if (title) box.appendChild(titleInput);
        box.appendChild(contentSpan);

        return box;
    }

    // --- EXPORT LOGIC ---
    function downloadSvg() {
        const w = diagramContainer.scrollWidth + 50;
        const h = diagramContainer.scrollHeight + 50;

        const exportSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        exportSvg.setAttribute("width", w);
        exportSvg.setAttribute("height", h);
        exportSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

        // Embed styles
        const style = document.createElement("style");
        // We include minified necessary styles
        style.textContent = `
            .dia-box { border: 2px solid black; background: white; padding: 10px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box; }
            .dia-label { font-weight: bold; margin-bottom: 5px; }
            .theme-modern .dia-box { border: 1px solid #ccc; border-left: 4px solid #2563eb; border-radius: 8px; font-family: sans-serif; }
            .theme-dark .dia-box { background: #334155; color: white; border: 1px solid #475569; font-family: sans-serif; }
            .theme-classic { font-family: 'Times New Roman', serif; }
            .main-flow { display: flex; flex-direction: column; align-items: center; gap: 60px; width: 100%; }
            .joint-row { display: flex; justify-content: center; position: relative; width: 100%; height: 0; }
            .step-node { display: flex; justify-content: center; }
            .arm-col { display: flex; flex-direction: column; align-items: center; gap: 40px; }
        `;
        exportSvg.appendChild(style);

        const foreignObj = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
        foreignObj.setAttribute("width", "100%");
        foreignObj.setAttribute("height", "100%");

        const htmlWrap = document.createElement("div");
        htmlWrap.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        if (state.theme) htmlWrap.className = `theme-${state.theme}`;

        // Clone content
        const mainFlow = diagramContainer.querySelector('.main-flow');
        if (mainFlow) {
            htmlWrap.appendChild(mainFlow.cloneNode(true));
        }

        foreignObj.appendChild(htmlWrap);
        exportSvg.appendChild(foreignObj);

        // Copy lines
        const originalSvg = diagramContainer.querySelector('svg');
        if (originalSvg) {
            const linesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            linesGroup.innerHTML = originalSvg.innerHTML;
            exportSvg.appendChild(linesGroup);
        }

        const s = new XMLSerializer();
        const str = s.serializeToString(exportSvg);
        const blob = new Blob([str], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "consort-diagram.svg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    init();
});
