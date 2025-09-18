import triangleDemo from '@/examples/01-triangle';
import triangleVaryings from '@/examples/02-triangle-varyings';
import triangleUniforms from '@/examples/03-triangle-uniforms';
import triangleStorage from '@/examples/04-triangles-storage';
import triangleMatrices from '@/examples/05-triangles-matrices';
import cameraLookAt from '@/examples/06-triangles-camera-look-at';
import cube from '@/examples/07-cube';

import '@/styles.css';
import '@/drag-and-drop';

const allDemos = [
  triangleDemo,
  triangleVaryings,
  triangleUniforms,
  triangleStorage,
  triangleMatrices,
  cameraLookAt,
  cube,
];

let currentDemo: {
  title: string;
  description: string;
  renderer: any;
} | null = null;

function createButton(title: string, description: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = title.toUpperCase();
  button.className = 'demo-button';
  button.onclick = () => {
    // Update the description first
    const descriptionDiv = document.querySelector('.description');
    if (descriptionDiv) {
      descriptionDiv.textContent = description;
    }
    onClick();
  };
  button.title = description;

  return button;
}

function initUI() {
  // Get existing elements
  const menu = document.querySelector('.menu') as HTMLDivElement;
  const canvas = document.getElementById('webgpu-canvas') as HTMLCanvasElement;

  // Create buttons
  allDemos.forEach((demoSelected) => {
    const {title, description, initDemo} = demoSelected;
    const button = createButton(title, description, async () => {
      if(currentDemo?.title === title) {
        return;
      }

      currentDemo?.renderer?.dispose?.();

      currentDemo = {
        title,
        description,
        renderer: null,
      };

      try {
        currentDemo.renderer = await initDemo(canvas);
      } catch (error: unknown) {
        console.error(`Failed to initialize ${name} demo:`, error);
        const errorMessage = document.createElement('div');
        errorMessage.style.color = 'red';
        errorMessage.textContent = `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`;
        canvas.parentElement?.insertBefore(errorMessage, canvas.nextSibling);
      }
    });
    menu.appendChild(button);
  });
}

// Initialize UI when the page loads
window.addEventListener('load', initUI);