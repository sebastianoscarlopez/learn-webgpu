export interface MousePosition {
  x: number;
  y: number;
}

export interface MouseDelta {
  deltaX: number;
  deltaY: number;
}

export interface ButtonState {
  leftButton: boolean;
  rightButton: boolean;
  middleButton: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

export type MouseMoveDetail = {
  position: MousePosition;
  delta: MouseDelta;
  buttons: ButtonState;
};

export type MouseDragDetail = {
  startPos: MousePosition;
  currentPos: MousePosition;
  delta: MouseDelta;
  buttons: ButtonState;
};

export class MouseHandler {
  private position: MousePosition = { x: 0, y: 0 };
  private isMouseDown: boolean = false;
  private isDragging: boolean = false;
  private dragStartPosition: MousePosition = { x: 0, y: 0 };
  private element: HTMLElement;
  private moveCallbacks: ((mouseMoveDetail: MouseMoveDetail) => void)[] = [];
  private clickCallbacks: ((position: MousePosition) => void)[] = [];
  private dragCallbacks: ((mouseDragDetail: MouseDragDetail) => void)[] = [];
  private wheelCallbacks: ((delta: MouseDelta) => void)[] = [];

  private getButtonState(event: MouseEvent): ButtonState {
    return {
      leftButton: (event.buttons & 1) === 1,
      rightButton: (event.buttons & 2) === 2,
      middleButton: (event.buttons & 4) === 4,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      metaKey: event.metaKey
    };
  }

  constructor(element: HTMLElement) {
    this.element = element;

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.element.addEventListener('mousemove', this.handleMouseMove);
    this.element.addEventListener('mousedown', this.handleMouseDown);
    this.element.addEventListener('mouseup', this.handleMouseUp);
    this.element.addEventListener('wheel', this.handleWheel);
    this.element.addEventListener('mouseleave', this.handleMouseLeave);
  }

  private handleMouseMove(event: MouseEvent): void {
    const rect = this.element.getBoundingClientRect();
    const newPosition = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    const delta = {
      deltaX: newPosition.x - this.position.x,
      deltaY: newPosition.y - this.position.y
    };

    this.position = newPosition;
    const buttonState = this.getButtonState(event);

    // Handle dragging
    if (this.isMouseDown) {
      this.isDragging = true;
      this.dragCallbacks.forEach(callback => 
        callback({
          startPos: this.dragStartPosition,
          currentPos: this.position,
          delta: delta,
          buttons: buttonState
        })
      );
    }

    // Notify move listeners
    this.moveCallbacks.forEach(callback => callback({
      position: this.position,
      delta: delta,
      buttons: buttonState
    }));
  }

  private handleMouseDown(event: MouseEvent): void {
    this.isMouseDown = true;
    this.dragStartPosition = { ...this.position };
  }

  private handleMouseUp(event: MouseEvent): void {
    if (!this.isDragging) {
      // If we weren't dragging, this is a click
      this.clickCallbacks.forEach(callback => callback(this.position));
    }

    this.isMouseDown = false;
    this.isDragging = false;
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = {
      deltaX: event.deltaX,
      deltaY: event.deltaY
    };
    this.wheelCallbacks.forEach(callback => callback(delta));
  }

  private handleMouseLeave(event: MouseEvent): void {
    this.isMouseDown = false;
    this.isDragging = false;
  }

  public onMove(callback: (mouseMoveDetail: MouseMoveDetail) => void): void {
    this.moveCallbacks.push(callback);
    
  }

  public onClick(callback: (position: MousePosition) => void): void {
    this.clickCallbacks.push(callback);
  }

  public onDrag(callback: (mouseDragDetail: MouseDragDetail) => void): void {
    this.dragCallbacks.push(callback);
  }

  public onWheel(callback: (delta: MouseDelta) => void): void {
    this.wheelCallbacks.push(callback);
  }

  public getPosition(): MousePosition {
    return { ...this.position };
  }

  public isDraggingNow(): boolean {
    return this.isDragging;
  }

  public dispose(): void {
    this.element.removeEventListener('mousemove', this.handleMouseMove);
    this.element.removeEventListener('mousedown', this.handleMouseDown);
    this.element.removeEventListener('mouseup', this.handleMouseUp);
    this.element.removeEventListener('wheel', this.handleWheel);
    this.element.removeEventListener('mouseleave', this.handleMouseLeave);
    
    this.moveCallbacks = [];
    this.clickCallbacks = [];
    this.dragCallbacks = [];
    this.wheelCallbacks = [];
  }
} 