import { initDemo as triangleDemo } from '@/examples/triangle';
import { initDemo as triangle2Demo } from '@/examples/triangle_2';
import { initDemo as triangle3Demo } from '@/examples/triangle_3';
import './styles.css';

// Add placeholder demos for the remaining examples
const allDemos = {
  'Triangle': triangleDemo,
  'Triangle_2': triangle2Demo,
  'Triangle_3': triangle3Demo,
};

function createButton(text: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = text;
  button.className = 'demo-button';
  button.onclick = onClick;
  return button;
}

function initUI() {
  // Get existing elements
  const menu = document.querySelector('.menu') as HTMLDivElement;

  // Create buttons
  Object.entries(allDemos).forEach(([name, handler]) => {
    const button = createButton(name, async () => {
      const canvas = document.getElementById('webgpu-canvas') as HTMLCanvasElement;
      try {
        await handler(canvas);
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