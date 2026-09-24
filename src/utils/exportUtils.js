import html2canvas from 'html2canvas';
import { GOOGLE_FONTS_URL } from './fontUtils';

/**
 * Export the CONSORT diagram as a pure, native SVG vector file.
 * Avoids <foreignObject> so that it opens cleanly and properly aligned in
 * Adobe Illustrator, Inkscape, PowerPoint, Word, and web browsers.
 */
export const downloadSvg = (diagramContainer, theme, font) => {
    if (!diagramContainer) return;

    const containerRect = diagramContainer.getBoundingClientRect();
    const w = Math.round(containerRect.width);
    const h = Math.round(containerRect.height);

    const containerStyle = window.getComputedStyle(diagramContainer);
    let bgColor = theme === 'dark' ? '#1e293b' : (containerStyle.backgroundColor || '#ffffff');
    if (bgColor === 'rgba(0, 0, 0, 0)' || !bgColor) {
        bgColor = theme === 'dark' ? '#1e293b' : '#ffffff';
    }

    let arrowColor = '#000000';
    if (theme === 'dark') arrowColor = '#f1f5f9';
    if (theme === 'pastel') arrowColor = '#db2777';
    if (theme === 'emerald') arrowColor = '#064e3b';
    if (theme === 'minimalist') arrowColor = '#9ca3af';

    const exportSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    exportSvg.setAttribute("width", w);
    exportSvg.setAttribute("height", h);
    exportSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    exportSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    // Defs: Webfonts and arrowhead marker
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleEl.textContent = `
        @import url('${GOOGLE_FONTS_URL}');
    `;
    defs.appendChild(styleEl);

    // Arrowhead marker
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "arrowhead-export");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
    polygon.setAttribute("fill", arrowColor);
    marker.appendChild(polygon);
    defs.appendChild(marker);

    exportSvg.appendChild(defs);

    // Background rect
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("width", w);
    bgRect.setAttribute("height", h);
    bgRect.setAttribute("fill", bgColor);
    exportSvg.appendChild(bgRect);

    // 1. Connection lines (Paths)
    const originalSvg = diagramContainer.querySelector('svg.diagram-lines');
    if (originalSvg) {
        // Accurately translate lines by the exact offset of svg.diagram-lines relative to diagramContainer
        const svgRect = originalSvg.getBoundingClientRect();
        const linesOffsetX = Math.round(svgRect.left - containerRect.left);
        const linesOffsetY = Math.round(svgRect.top - containerRect.top);

        const linesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        linesGroup.setAttribute("class", "diagram-lines-group");
        linesGroup.setAttribute("transform", `translate(${linesOffsetX}, ${linesOffsetY})`);

        const paths = originalSvg.querySelectorAll('path');
        paths.forEach(p => {
            const d = p.getAttribute("d");
            if (!d) return;
            const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            newPath.setAttribute("d", d);
            newPath.setAttribute("stroke", p.getAttribute("stroke") || arrowColor);
            newPath.setAttribute("stroke-width", p.getAttribute("stroke-width") || "2");
            newPath.setAttribute("fill", "none");
            if (p.getAttribute("marker-end")) {
                newPath.setAttribute("marker-end", "url(#arrowhead-export)");
            }
            linesGroup.appendChild(newPath);
        });
        exportSvg.appendChild(linesGroup);
    }

    // 2. Boxes (Native SVG rects and text)
    const boxesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    boxesGroup.setAttribute("class", "diagram-boxes-group");

    const boxes = diagramContainer.querySelectorAll('.dia-box');
    boxes.forEach(box => {
        const rect = box.getBoundingClientRect();
        const boxX = Math.round(rect.left - containerRect.left);
        const boxY = Math.round(rect.top - containerRect.top);
        const boxW = Math.round(rect.width);
        const boxH = Math.round(rect.height);

        const computed = window.getComputedStyle(box);
        const boxBg = computed.backgroundColor || '#ffffff';
        const borderColor = computed.borderTopColor || '#000000';
        const borderWidth = parseFloat(computed.borderTopWidth) || 1;
        const borderRadius = parseFloat(computed.borderRadius) || 0;
        const paddingLeft = parseFloat(computed.paddingLeft) || 16;
        const paddingRight = parseFloat(computed.paddingRight) || 16;
        const textAlign = computed.textAlign || 'center';

        const boxG = document.createElementNS("http://www.w3.org/2000/svg", "g");
        boxG.setAttribute("class", "diagram-box");

        // Main box rect
        const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        r.setAttribute("x", boxX);
        r.setAttribute("y", boxY);
        r.setAttribute("width", boxW);
        r.setAttribute("height", boxH);
        r.setAttribute("rx", borderRadius);
        r.setAttribute("ry", borderRadius);
        r.setAttribute("fill", boxBg);
        r.setAttribute("stroke", borderColor);
        r.setAttribute("stroke-width", borderWidth);
        boxG.appendChild(r);

        // Accent border on left (e.g. Modern theme blue bar)
        const borderLeftWidth = parseFloat(computed.borderLeftWidth) || 0;
        const borderLeftColor = computed.borderLeftColor;
        if (borderLeftWidth >= 3 && borderLeftColor && borderLeftColor !== borderColor) {
            const leftBar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            leftBar.setAttribute("x", boxX);
            leftBar.setAttribute("y", boxY);
            leftBar.setAttribute("width", borderLeftWidth);
            leftBar.setAttribute("height", boxH);
            leftBar.setAttribute("rx", Math.min(borderRadius, borderLeftWidth / 2));
            leftBar.setAttribute("fill", borderLeftColor);
            boxG.appendChild(leftBar);
        }

        // Determine text anchor and horizontal position based on text alignment
        let textAnchor = 'middle';
        let textX = boxX + boxW / 2;
        if (textAlign === 'left' || textAlign === 'start') {
            textAnchor = 'start';
            textX = boxX + paddingLeft;
        } else if (textAlign === 'right' || textAlign === 'end') {
            textAnchor = 'end';
            textX = boxX + boxW - paddingRight;
        }

        // Title / Label text
        const labelEl = box.querySelector('.dia-label');
        let labelLines = [];
        let lblStyle = null;
        if (labelEl) {
            lblStyle = window.getComputedStyle(labelEl);
            let rawTitle = labelEl.innerText.trim();
            if (lblStyle.textTransform === 'uppercase') {
                rawTitle = rawTitle.toUpperCase();
            }
            labelLines = rawTitle.split('\n').map(l => l.trim()).filter(Boolean);
        }

        // Content / Count text
        const countEl = box.querySelector('.dia-count');
        let countLines = [];
        let cntStyle = null;
        if (countEl) {
            cntStyle = window.getComputedStyle(countEl);
            countLines = countEl.innerText
                .split('\n')
                .map(l => l.trim())
                .filter(Boolean);
        }

        // Compute vertical layout for text inside box
        const titleFontSize = lblStyle ? (parseFloat(lblStyle.fontSize) || 12) : 0;
        const titleLineHeight = titleFontSize > 0 ? Math.round(titleFontSize * 1.3) : 0;
        const countFontSize = cntStyle ? (parseFloat(cntStyle.fontSize) || 14) : 14;
        const countLineHeight = Math.round(countFontSize * 1.35);

        const labelGap = (labelLines.length > 0 && countLines.length > 0) ? 6 : 0;
        const totalTextHeight = (labelLines.length * titleLineHeight) + labelGap + (countLines.length * countLineHeight);

        let currentY = boxY + Math.max(10, Math.round((boxH - totalTextHeight) / 2)) + Math.round((labelLines.length > 0 ? titleFontSize : countFontSize) * 0.85);

        if (labelLines.length > 0 && lblStyle) {
            labelLines.forEach((line) => {
                const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
                textEl.setAttribute("x", textX);
                textEl.setAttribute("y", currentY);
                textEl.setAttribute("text-anchor", textAnchor);
                textEl.setAttribute("font-family", lblStyle.fontFamily || (font && font !== 'default' ? font : 'sans-serif'));
                textEl.setAttribute("font-size", `${titleFontSize}px`);
                textEl.setAttribute("font-weight", lblStyle.fontWeight || 'bold');
                textEl.setAttribute("fill", lblStyle.color || '#000000');
                textEl.textContent = line;
                boxG.appendChild(textEl);
                currentY += titleLineHeight;
            });
            currentY += labelGap;
        }

        if (countLines.length > 0 && cntStyle) {
            countLines.forEach((line) => {
                const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
                textEl.setAttribute("x", textX);
                textEl.setAttribute("y", currentY);
                textEl.setAttribute("text-anchor", textAnchor);
                textEl.setAttribute("font-family", cntStyle.fontFamily || (font && font !== 'default' ? font : 'sans-serif'));
                textEl.setAttribute("font-size", `${countFontSize}px`);
                textEl.setAttribute("font-weight", cntStyle.fontWeight || 'normal');
                textEl.setAttribute("fill", cntStyle.color || '#333333');
                textEl.textContent = line;
                boxG.appendChild(textEl);
                currentY += countLineHeight;
            });
        }

        boxesGroup.appendChild(boxG);
    });

    exportSvg.appendChild(boxesGroup);

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
    URL.revokeObjectURL(url);
};

/**
 * Export the diagram as high-resolution PNG or JPG with selectable DPI.
 * Standard web is 96 DPI.
 * 300 DPI (scale 3.125) is standard for scientific journals and publications.
 * 600 DPI (scale 6.25) is ultra-high resolution for high-end print.
 */
export const downloadImage = (diagramContainer, theme, format, dpi = 300) => {
    if (!diagramContainer) return;

    const dpiNum = parseInt(dpi, 10) || 300;
    // Scale factor relative to 96 DPI baseline
    const scale = dpiNum / 96;

    html2canvas(diagramContainer, {
        backgroundColor: (theme === 'dark' ? '#1e293b' : '#ffffff'),
        scale: scale,
        useCORS: true,
        logging: false
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `consort-diagram-${dpiNum}dpi.${format}`;
        link.href = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`, 0.98);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }).catch(err => {
        console.error("Image export failed:", err);
        alert("Image export failed. Check console.");
    });
};
