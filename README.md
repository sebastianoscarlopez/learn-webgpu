# WebGPU Examples

This project demonstrates various WebGPU examples implemented in TypeScript, featuring an interactive UI to switch between different demos.

## Available Demos

- Triangle - Basic triangle rendering
- Triangle 2 - Alternative triangle implementation

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

- `src/main.ts` - Main application entry point and UI initialization
- `src/examples/` - Individual WebGPU demo implementations
  - `triangle/` - Basic triangle rendering example
  - `triangle_2/` - Alternative triangle implementation
- `src/styles.css` - Application styles
- `index.html` - HTML entry point
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration

## Features

- Interactive UI with buttons to switch between different demos
- Error handling and display for WebGPU initialization failures
- Modular demo structure for easy addition of new examples

## Notes

Each demo is implemented as a separate module, making it easy to add new examples or modify existing ones. The project uses a clean architecture that separates the demo implementations from the main application logic. 