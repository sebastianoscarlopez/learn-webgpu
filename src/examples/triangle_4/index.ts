/// <reference types="@webgpu/types" />
import { TriangleRenderer } from './renderer';

export async function initDemo (canvas: HTMLCanvasElement) {
  // Import shader code
  const vertexShader = await fetch(new URL('./shaders/vertex.wgsl', import.meta.url).href).then(r => r.text());
  const fragmentShader = await fetch(new URL('./shaders/fragment.wgsl', import.meta.url).href).then(r => r.text());

  try {
    // Create and initialize the renderer
    const renderer = new TriangleRenderer(canvas, vertexShader, fragmentShader);
    await renderer.initialize();

    // Render the triangle
    renderer.render();

    return renderer;
  } catch (error) {
    console.error('Failed to initialize WebGPU:', error);
    throw error;
  }
}

export default {
  title: 'Triangle 4',
  description: 'Lots of triangles. Using uniform for zoom and storage buffers to set the color, position and size and updating them in the shader',
  initDemo,
};