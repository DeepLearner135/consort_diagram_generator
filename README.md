# Consort Diagram Generator

A web-based tool for generating publication-ready CONSORT (Consolidated Standards of Reporting Trials) flow diagrams for clinical trials.

## Features

-   **Dynamic Flowchart**: Real-time generation of the flow diagram based on your inputs.
-   **Editable Diagram**: **Click directly on any text or number inside the diagram boxes to edit them.** This allows for full customization of labels and counts beyond the automatic calculations.
-   **Flexible Exclusions**: Add multiple exclusion reasons with automatic side-alternating branches.
-   **Custom Allocation**: Support for 2, 3, or 4 allocation arms.
-   **Visual Themes**: 
    -   *Scientific (Classic)*: Standard black & white, serif font style.
    -   *Modern Blue*: Clean sans-serif look with blue accents.
    -   *Dark Mode*: Optimized for dark screens.
-   **High-Quality Exports**:
    -   **SVG**: Best for further editing in vector software (Illustrator, Inkscape).
    -   **PNG / JPG**: High-resolution raster images for presentations or documents.
    -   **Print / PDF**: Use your browser's native print function (Ctrl+P / Cmd+P) to save as PDF.

## How to Use

1.  **Open the Tool**: Simply open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari). No installation required.
2.  **Enter Enrollment Data**: Input the total number assessed for eligibility.
3.  **Add Exclusions**: Click "+ Add Exclusion Reason" to detail why participants were excluded.
4.  **Define Arms**: Select the number of study groups (arms) and the diagram will update automatically.
5.  **Edit Text**: If you need to change a specific label (e.g., "Analysed" to "Included in Analysis"), simply click on the text in the diagram and type.
6.  **Export**: Use the colored buttons in the sidebar to download your diagram.

## technical Details

-   Build with pure **HTML, CSS, and JavaScript**.
-   Uses **SVG** for precise arrow rendering.
-   Uses `html2canvas` for image rendering.
