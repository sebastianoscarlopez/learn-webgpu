import { Pane } from "tweakpane";
import { CameraLookAt } from "@/libs/camera/camera-lookat";
import { debounce } from "@/utils/functions";
import { VectorXYZ } from "@/definitions/VectorXYZ";

export interface GUIParams {
  total: number;
  camera: {
    position: VectorXYZ;
    target: VectorXYZ;
  };
}

export class RendererGUI {
  private pane?: Pane;
  private params: GUIParams;
  private onChange: () => void;

  constructor(private camera: CameraLookAt, onChange: () => void) {
    this.onChange = debounce(onChange, 1);
    this.camera = camera;
    this.params = {
      total: 10,
      camera: {
        position: this.camera.getPosition(),
        target: this.camera.getTarget()
      }
    };

    // Set up camera change listener
    this.camera.onCameraChange(this.onCameraChangeHandler.bind(this));
  }

  private onCameraChangeHandler(): void {
    // Update GUI params with camera values
    this.params.camera.position = this.camera.getPosition();
    this.params.camera.target = this.camera.getTarget();
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
      x: { min: -100, max: 100, step: 0.001 },
      y: { min: -100, max: 100, step: 0.001 },
      z: { min: -100, max: 100, step: 0.001 }
    }).on('change', () => {
      this.camera.setPosition(this.params.camera.position);
      this.onChange();
    });

    cameraFolder.addBinding(this.params.camera, 'target', {
      x: { min: -100, max: 100, step: 0.001 },
      y: { min: -100, max: 100, step: 0.001 },
      z: { min: -100, max: 100, step: 0.001 }
    }).on('change', () => {
      this.camera.setTarget(this.params.camera.target);
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