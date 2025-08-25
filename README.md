# WebGPU Triangle Example

This project demonstrates a simple triangle rendering using WebGPU and TypeScript.

## Prerequisites

- Node.js (latest LTS version recommended)
- A browser that supports WebGPU (Chrome Canary or Edge Canary with WebGPU flags enabled)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

## Browser Configuration

If you're using Chrome Canary, make sure to enable WebGPU:
1. Go to `chrome://flags`
2. Search for "WebGPU"
3. Enable "Unsafe WebGPU"
4. Restart the browser

## Project Structure

- `src/main.ts` - Main WebGPU implementation
- `index.html` - HTML entry point
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration

## Notes

This is a basic example that renders a red triangle using WebGPU. The triangle is created using three vertices defined in the vertex shader, and colored using a simple fragment shader. 