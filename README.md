# CORECONVERT

> **RAW UTILITY. ZERO CLOUD. TOTAL CONTROL.**

**CoreConvert** is a powerful, local-first file conversion utility built for the modern web. It adheres to a strict "Privacy by Default" philosophy: your data never leaves your device. By leveraging advanced browser APIs (Canvas, Web Audio, MediaRecorder), CoreConvert performs professional-grade transformations entirely within the client's memory.

![Neubrutal UI](https://img.shields.io/badge/Style-Neubrutalism-black?style=for-the-badge&color=FAFF00&labelColor=000000)
![React 19](https://img.shields.io/badge/React-19-black?style=for-the-badge&logo=react)
![Privacy](https://img.shields.io/badge/Privacy-100%25_Local-green?style=for-the-badge)

## ⚡ The Philosophy

Most online file converters are data vampires. You upload your sensitive PDF or financial CSV to a mysterious server, wait for processing, and hope they delete it.

**CoreConvert is the antithesis.**
*   **No Uploads:** Files are read from disk to memory.
*   **No Servers:** Processing happens via WebAssembly and HTML5 APIs.
*   **No Latency:** Your hardware is the engine. Bandwidth is irrelevant.

## 🛠 Capabilities

CoreConvert supports a massive array of bi-directional conversions:

### 🖼️ Image Processing
*   **Formats:** PNG, JPG, WebP, BMP, ICO (Favicon), SVG, HEIC (Apple).
*   **Filters:** Grayscale conversion.
*   **Rasterization:** Convert scalable vectors (SVG) to pixels or wrap pixels in SVG.

### 📊 Data Matrix
*   **Interchange:** Convert between JSON, CSV, YAML, and XML freely.
*   **SQL Generation:** Turn JSON/CSV datasets directly into `INSERT` statements.
*   **Excel:** Parse `.xlsx` spreadsheets directly to JSON/CSV (via SheetJS).
*   **Dev Tools:** Minify and Prettify JSON.

### 📄 Documents & Text
*   **PDF:** Render HTML/Images/Text to PDF or extract PDF pages to Images.
*   **Markdown:** Parse Markdown to raw HTML.
*   **Code:** Text transformations (Snake Case, Camel Case, Upper/Lower).

### 🎬 Audio & Video
*   **Video Transcoding:** MP4, WebM, MOV, MKV, AVI (container swapping and re-encoding).
*   **Audio Extraction:** Rip MP3/WAV audio directly from video files.
*   **Snapshots:** Frame-perfect image capture from video files.

## 🏗 Technical Architecture

CoreConvert is a showcase of modern browser capabilities, avoiding heavy backend dependencies.

*   **Framework:** React 19
*   **Styling:** Tailwind CSS (Custom Neubrutal Design System)
*   **Video Engine:** `HTMLCanvasElement.captureStream()` + `MediaRecorder` API.
*   **Audio Engine:** Web Audio API + `lamejs` (for MP3 encoding).
*   **Data Parsing:** `js-yaml` for YAML, `sheetjs` for Excel, DOMParser for XML.
*   **PDF Engine:** `jspdf` (Generation) and `pdf.js` (Rendering).
*   **Design Tokens:** High contrast, hard borders (`3px`), custom "snappy" animations.

## 🚀 Running Locally

1.  **Clone the repository**
2.  **Install dependencies** (Note: Core engines are loaded via CDN in `index.html` to keep the bundle lightweight).
    ```bash
    npm install
    ```
3.  **Start the dev server**
    ```bash
    npm run dev
    ```

## 📄 License

This project is open-source. Use it freely.
Your data belongs to you.

---

*Built with AI and my hands*
