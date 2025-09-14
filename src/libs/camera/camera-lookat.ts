import * as m from "wgpu-matrix";
import { mat4, Mat4, vec3, vec4 } from "wgpu-matrix";
import { VectorXYZ } from "@/definitions/VectorXYZ";

// @ts-ignore
window.mat4 = mat4;

export class CameraLookAt {
  private position: VectorXYZ = { x: 0, y: 0, z: 10 };
  private target: VectorXYZ = { x: 0, y: 0, z: 0 };

  private projectionMatrix: Mat4 = mat4.identity();
  private viewMatrix: Mat4 = mat4.identity();

  private onChangeCallback?: () => void;

  constructor(private canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.updateProjectionMatrix();
    this.updateCameraViewMatrix();
    this.moveCameraHandler = this.moveCameraHandler.bind(this);
    this.rotateCameraHandler = this.rotateCameraHandler.bind(this);
    this.setupEventListeners();
  }

  /**
   * Position are absolute. It will override the current position
   */
  setPosition(position: VectorXYZ): void {
    this.position = { ...position };
    this.updateCameraViewMatrix();
  }

  setTarget(target: VectorXYZ): void {
    this.target = { ...target };
    this.updateCameraViewMatrix();
  }

  // Note: Camera orientation calculation
  // We calculate the right vector from a temporary up vector (0,1,0).
  // While this temporary up vector may not be perfectly aligned with the final camera orientation,
  // it serves as a good initial approximation for most camera positions.
  private updateCameraViewMatrix(): void {

    const positionVector = vec3.create(this.position.x, this.position.y, this.position.z);
    const targetVector = vec3.create(this.target.x, this.target.y, this.target.z);
    const tempUpVector = vec3.create(0, 1, 0);
    
    /**
     * We only need to call mat4.lookAt with the position, target and up vector.
     this.viewMatrix = mat4.lookAt(positionVector, targetVector, tempUpVector);
    **/

    // Here only for educational purpose we do the maths behind the lookAt function
    const forwardVector = vec3.normalize(
      vec3.subtract(positionVector, targetVector)
    );

    const rightVector = vec3.normalize(
      vec3.cross(tempUpVector, forwardVector)
    );
    const upVector = vec3.normalize(
      vec3.cross(forwardVector, rightVector)
    );

    const tx = vec3.dot(positionVector, rightVector);
    const ty = vec3.dot(positionVector, upVector);
    const tz = vec3.dot(positionVector, forwardVector);

    this.viewMatrix = mat4.create(
      rightVector[0], upVector[0], forwardVector[0], 0,
      rightVector[1], upVector[1], forwardVector[1], 0,
      rightVector[2], upVector[2], forwardVector[2], 0,
      -tx, -ty, -tz, 1
    );

    this.notifyChange();
  }

  updateProjectionMatrix(): void {
    const fov = Math.PI / 4; // 45 degrees in radians
    const aspectRatio = this.canvas.width / this.canvas.height;
    this.projectionMatrix = mat4.perspective(
      fov,
      aspectRatio,
      0.1,
      1000.0
    );
  }

  getProjectionMatrix(): Mat4 {
    return this.projectionMatrix;
  }

  getViewMatrix(): Mat4 {
    return this.viewMatrix;
  }

  getPosition(): VectorXYZ {
    return { ...this.position };
  }

  getTarget(): VectorXYZ {
    return { ...this.target };
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

  /**
   *  Camera movement are absolute. Not relative to the camera's current position
   */
  private moveCamera(distance: VectorXYZ): void {
    this.setPosition({
      x: this.position.x + distance.x,
      y: this.position.y + distance.y,
      z: this.position.z + distance.z
    });
  }

  /**
   * Camera will rotate around the target
   * The strategy is translate the camera to the target, rotate around the target, and translate back
   */
  private rotateCamera(rotation: VectorXYZ): void {

    // move target to the origin
    const translateTargetToOriginMatrix = mat4.translate(mat4.identity(), [-this.target.x, -this.target.y, -this.target.z]);

    // rotate the camera around the target in the origin
    let rotateMatrix = mat4.rotateX(translateTargetToOriginMatrix, rotation.x);
    rotateMatrix = mat4.rotateY(rotateMatrix, rotation.y);
    rotateMatrix = mat4.rotateZ(rotateMatrix, rotation.z);

    // translate the camera back to the original position
    const translateBackMatrix = mat4.translate(mat4.identity(), [this.target.x, this.target.y, this.target.z]);

    const newPositionMatrix = mat4.multiply(
      mat4.multiply(
        mat4.multiply(translateTargetToOriginMatrix, rotateMatrix),
        translateBackMatrix
      ),
      mat4.invert(this.viewMatrix)
    );

    const newPosition = vec3.create(newPositionMatrix[12], newPositionMatrix[13], newPositionMatrix[14]);

    this.setPosition({
      x: newPosition[0],
      y: newPosition[1],
      z: newPosition[2]
    });
  }
} 

