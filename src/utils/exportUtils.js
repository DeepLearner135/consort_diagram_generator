import html2canvas from 'html2canvas';

export const downloadSvg = (diagramContainer, theme, font) => {
    if (!diagramContainer) return;

    const w = diagramContainer.scrollWidth + 50;
    const h = diagramContainer.scrollHeight + 50;

    const exportSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    exportSvg.setAttribute("width", w);
    exportSvg.setAttribute("height", h);
    exportSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const fontStyle = font && font !== 'default'
        ? `.dia-box, .dia-label, .dia-count, .consort-diagram { font-family: ${font} !important; }`
        : '';

    const style = document.createElement("style");
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Merriweather:wght@400;700&family=Open+Sans:wght@400;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Roboto:wght@400;500;700&display=swap');
        .dia-box { border: 2px solid black; background: white; padding: 10px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box; }
        .dia-label { font-weight: bold; margin-bottom: 5px; outline: none; border-bottom: 1px dashed transparent; }
        .theme-modern .dia-box { border: 1px solid #cbd5e1; border-left: 4px solid #2563eb; border-radius: 8px; font-family: 'Inter', sans-serif; background: white; color: #334155; }
        .theme-dark .dia-box { background: #334155; color: #f1f5f9; border: 1px solid #475569; font-family: 'Inter', sans-serif; border-radius: 6px; }
        .theme-classic { font-family: 'Times New Roman', serif; background: white; color: black; }
        .main-flow { display: flex; flex-direction: column; align-items: center; gap: 60px; width: 100%; position: relative; }
        .joint-row { display: flex; justify-content: center; position: relative; width: 100%; height: 0; }
        .step-node { display: flex; justify-content: center; position: relative;}
        .arm-col { display: flex; flex-direction: column; align-items: center; gap: 40px; }
        .theme-modern .dia-label { color: #2563eb; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
        .theme-dark .dia-label { color: #93c5fd; }
        .theme-dark .dia-count { color: #e2e8f0; }
        ${fontStyle}
    `;
    exportSvg.appendChild(style);

    const foreignObj = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
    foreignObj.setAttribute("width", "100%");
    foreignObj.setAttribute("height", "100%");

    const htmlWrap = document.createElement("div");
    htmlWrap.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    if (theme) htmlWrap.className = `theme-${theme}`;

    const mainFlow = diagramContainer.querySelector('.main-flow');
    if (mainFlow) {
        htmlWrap.appendChild(mainFlow.cloneNode(true));
    }

    foreignObj.appendChild(htmlWrap);
    exportSvg.appendChild(foreignObj);

    const originalSvg = diagramContainer.querySelector('svg.diagram-lines');
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
    URL.revokeObjectURL(url);
};

export const downloadImage = (diagramContainer, theme, format) => {
    if (!diagramContainer) return;

    html2canvas(diagramContainer, {
        backgroundColor: (theme === 'dark' ? '#1e293b' : '#ffffff'),
        scale: 2,
        logging: false
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `consort-diagram.${format}`;
        link.href = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }).catch(err => {
        console.error("Image export failed:", err);
        alert("Image export failed. Check console.");
    });
};
