import { mat4, Mat4 } from "wgpu-matrix";

export interface VectorXYZ {
  x: number;
  y: number;
  z: number;
}

export class Camera {
  private position: VectorXYZ = { x: 0, y: 0, z: -10 };
  private rotation: VectorXYZ = { x: 0, y: 0, z: 0 };
  private projectionMatrix: Mat4 = mat4.identity();
  private onChangeCallback?: () => void;

  constructor(private canvas: HTMLCanvasElement) {
    this.moveCameraHandler = this.moveCameraHandler.bind(this);
    this.rotateCameraHandler = this.rotateCameraHandler.bind(this);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('moveCamera', this.moveCameraHandler);
    this.canvas.addEventListener('rotateCamera', this.rotateCameraHandler);
  }

  private moveCameraHandler(event: CustomEventInit<VectorXYZ>): void {
    if(!event.detail) {
      throw new Error('moveCamera event detail is required');
    }
    this.moveCamera(event.detail);
  }

  private rotateCameraHandler(event: CustomEventInit<VectorXYZ>): void {
    if(!event.detail) {
      throw new Error('rotateCamera event detail is required');
    }
    this.rotateCamera(event.detail);
  }

  private moveCamera(distance: VectorXYZ): void {
    this.position.x -= distance.x;
    this.position.y -= distance.y;
    this.position.z += distance.z;
    this.notifyChange();
  }

  private rotateCamera(rotation: VectorXYZ): void {
    const nextRotation: VectorXYZ = {
      x: this.rotation.x + rotation.x,
      y: this.rotation.y + rotation.y,
      z: this.rotation.z + rotation.z
    };

    // rotate circular between -PI and PI
    if(Math.abs(nextRotation.x) > Math.PI) {
      nextRotation.x = (Math.PI - Math.abs(rotation.x) % Math.PI) * (rotation.x < 0 ? 1 : -1);
    }

    if(Math.abs(nextRotation.y) > Math.PI) {
      nextRotation.y = (Math.PI - Math.abs(rotation.y) % Math.PI) * (rotation.y < 0 ? 1 : -1);
    }

    if(Math.abs(nextRotation.z) > Math.PI) {
      nextRotation.z = (Math.PI - Math.abs(rotation.z) % Math.PI) * (rotation.z < 0 ? 1 : -1);
    }

    this.rotation = nextRotation;
    this.notifyChange();
  }

  updateProjectionMatrix(): void {
    const fov = Math.PI / 4; // 45 degrees in radians
    const aspectRatio = this.canvas.width / this.canvas.height;
    this.projectionMatrix = mat4.perspective(
      fov,
      aspectRatio,
      0.1,
      100.0
    );
  }

  getProjectionMatrix(): Mat4 {
    return this.projectionMatrix;
  }

  getViewMatrix(): Mat4 {
    const viewMatrix = mat4.identity();

    // Then rotate around Z axis
    mat4.rotateZ(viewMatrix, this.rotation.z, viewMatrix);
    mat4.rotateY(viewMatrix, this.rotation.y, viewMatrix);
    mat4.rotateX(viewMatrix, this.rotation.x, viewMatrix);

    // First translate
    mat4.translate(viewMatrix, [
      this.position.x,
      this.position.y,
      this.position.z
    ], viewMatrix);

    return viewMatrix;
  }

  getPosition(): VectorXYZ {
    return { ...this.position };
  }

  getRotation(): VectorXYZ {
    return { ...this.rotation };
  }

  setPosition(position: VectorXYZ): void {
    this.position = { ...position };
    this.notifyChange();
  }

  setRotation(rotation: VectorXYZ): void {
    this.rotation = { ...rotation };
    this.notifyChange();
  }

  onCameraChange(callback: () => void): void {
    this.onChangeCallback = callback;
  }

  private notifyChange(): void {
    this.onChangeCallback?.();
  }

  dispose(): void {
    this.canvas.removeEventListener('moveCamera', this.moveCameraHandler);
    this.canvas.removeEventListener('rotateCamera', this.rotateCameraHandler);
  }
} 