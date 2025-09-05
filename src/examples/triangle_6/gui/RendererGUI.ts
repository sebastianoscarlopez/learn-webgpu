import { Pane } from "tweakpane";
import { Camera, VectorXYZ } from "../camera/Camera";
import { debounce } from "@/utils/functions";

export interface GUIParams {
  total: number;
  camera: {
    position: VectorXYZ;
    rotation: VectorXYZ;
  };
}

export class RendererGUI {
  private pane?: Pane;
  private params: GUIParams;
  private onChange: () => void;

  constructor(private camera: Camera, onChange: () => void) {
    this.onChange = debounce(onChange, 1);
    this.camera = camera;
    this.params = {
      total: 10,
      camera: {
        position: this.camera.getPosition(),
        rotation: this.camera.getRotation()
      }
    };

    // Set up camera change listener
    this.camera.onCameraChange(this.onCameraChangeHandler.bind(this));
  }

  private onCameraChangeHandler(): void {
    // Update GUI params with camera values
    this.params.camera.position = this.camera.getPosition();
    this.params.camera.rotation = this.camera.getRotation();
    this.refresh();
  }

  async initialize(): Promise<void> {
    this.pane = new Pane();

    this.pane.addBinding(this.params, 'total', {
      min: 1,
      max: 100,
      step: 1,
    }).on('change', () => {
      this.onChange();
    });

    const cameraFolder = this.pane.addFolder({ title: 'Camera' });
    
    cameraFolder.addBinding(this.params.camera, 'position', {
      x: { min: -100, max: 100, step: 0.1 },
      y: { min: -100, max: 100, step: 0.1 },
      z: { min: -100, max: 100, step: 0.1 }
    }).on('change', () => {
      this.camera.setPosition(this.params.camera.position);
      this.onChange();
    });

    cameraFolder.addBinding(this.params.camera, 'rotation', {
      x: { min: -Math.PI, max: Math.PI, step: 0.0001 },
      y: { min: -Math.PI, max: Math.PI, step: 0.0001 },
      z: { min: -Math.PI, max: Math.PI, step: 0.0001 }
    }).on('change', () => {
      this.camera.setRotation(this.params.camera.rotation);
      this.onChange();
    });
  }

  getTotal(): number {
    return this.params.total;
  }

  refresh(): void {
    this.pane?.refresh();
  }

  dispose(): void {
    if (this.pane) {
      this.pane.dispose();
    }
  }
} 