
/** This class will add custom camera events to the DOM element (usually a canvas) */

import { VectorXYZ } from "@/definitions/VectorXYZ";
import { MouseDelta, MouseDragDetail, MouseHandler } from "@/utils/mouse-handler";

export class CameraLookAtController {
  private mouseHandler!: MouseHandler;
  private speedZ: number = 0.1;
  private speedPanX: number = 0.1;
  private speedPanY: number = 0.1;
  private speedRotateX: number = 0.0025;
  private speedRotateY: number = 0.0025;

  constructor(private element: HTMLElement) {
    this.mouseHandler = new MouseHandler(this.element);

    this.mouseHandler.onWheel(this.wheelHandle.bind(this));
    this.mouseHandler.onDrag(this.dragHandler.bind(this));

    this.preventDefaultHandler = this.preventDefaultHandler.bind(this);
    this.disableRightClick();
  }

  private dragHandler({ delta, buttons }: MouseDragDetail): void {
    const isPanMove = buttons.metaKey || buttons.rightButton;
    if(isPanMove) {
      const deltaX = delta.deltaX * this.speedPanX;
      const deltaY = delta.deltaY * this.speedPanY;
      const detail: VectorXYZ = {
        x: deltaX,
        y: deltaY,
        z: 0
      };
      this.dispatchCameraMove(detail);
    }
    
    // if not pan move, then is rotate move
    if(!isPanMove) {     
      const deltaY = delta.deltaX * this.speedRotateY; // x rotate around y
      const deltaX = delta.deltaY * this.speedRotateX; // y rotate around x
      const detail: VectorXYZ = {
        x: deltaX,
        y: deltaY,
        z: 0
      };
      this.dispatchCameraRotate(detail);
    }
  }

  private wheelHandle(data: MouseDelta): void { 
    const deltaZ = data.deltaY * this.speedZ;
    const detail: VectorXYZ = {
      x: 0,
      y: 0,
      z: deltaZ
    };
    this.dispatchCameraMove(detail);
  }

  private dispatchCameraMove(detail: VectorXYZ) {
    const moveCameraEvent = new CustomEvent('moveCamera', { detail });
    this.element.dispatchEvent(moveCameraEvent);
  }

  private dispatchCameraRotate(detail: VectorXYZ) {
    const rotateCameraEvent = new CustomEvent('rotateCamera', { detail });
    this.element.dispatchEvent(rotateCameraEvent);
  }

  private disableRightClick() {
    this.element.addEventListener('contextmenu', this.preventDefaultHandler);
  }

  private preventDefaultHandler(e: MouseEvent): void {
    e.preventDefault();
  }

  public dispose(): void {
    this.mouseHandler.dispose();
    this.element.removeEventListener('contextmenu', this.preventDefaultHandler);
  }
}