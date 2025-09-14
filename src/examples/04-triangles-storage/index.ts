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
  title: 'Storage',
  description: 'This is a simple example of how to use storage buffers to store data in the GPU and update them in the shader.',
  initDemo,
};