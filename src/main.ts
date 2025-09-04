import triangleDemo from '@/examples/triangle';
import triangle2Demo from '@/examples/triangle_2';
import triangle3Demo from '@/examples/triangle_3';
import triangle4Demo from '@/examples/triangle_4';
import triangle5Demo from '@/examples/triangle_5';
import './styles.css';

// Add placeholder demos for the remaining examples
const allDemos = [
  triangleDemo,
  triangle2Demo,
  triangle3Demo,
  triangle4Demo,
  triangle5Demo,
];

let currentDemo: {
  title: string;
  description: string;
  renderer: any;
} | null = null;

function createButton(title: string, description: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = title;
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

      const canvas = document.getElementById('webgpu-canvas') as HTMLCanvasElement;
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