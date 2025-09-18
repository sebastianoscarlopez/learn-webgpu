export class DragAndDrop {
  private container: HTMLElement;
  private isDragging: boolean = false;
  private currentX: number = 0;
  private currentY: number = 0;
  private initialX: number = 0;
  private initialY: number = 0;
  private xOffset: number = 0;
  private yOffset: number = 0;

  constructor() {
    this.container = document.querySelector('.drag-and-drop-container') as HTMLElement;
    if (!this.container) {
      throw new Error('Drag and drop container not found');
    }

    this.initializeDragAndDrop();
  }

  private initializeDragAndDrop(): void {
    // Make the header the drag handle
    const dragHandle = this.container.querySelector('.drag-and-drop-header') as HTMLElement;
    if (!dragHandle) {
      throw new Error('Drag handle not found');
    }

    dragHandle.style.cursor = 'move';

    // Add event listeners
    dragHandle.addEventListener('mousedown', this.dragStart.bind(this));
    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('mouseup', this.dragEnd.bind(this));

    // Touch events
    dragHandle.addEventListener('touchstart', this.dragStart.bind(this));
    document.addEventListener('touchmove', this.drag.bind(this));
    document.addEventListener('touchend', this.dragEnd.bind(this));
  }

  private dragStart(e: MouseEvent | TouchEvent): void {
    if (e instanceof MouseEvent) {
      this.initialX = e.clientX - this.xOffset;
      this.initialY = e.clientY - this.yOffset;
    } else {
      this.initialX = e.touches[0].clientX - this.xOffset;
      this.initialY = e.touches[0].clientY - this.yOffset;
    }

    if (e.target instanceof HTMLElement &&
            (e.target.closest('.drag-and-drop-container') || e.target.classList.contains('drag-and-drop-container'))) {
      this.isDragging = true;
    }
  }

  private drag(e: MouseEvent | TouchEvent): void {
    if (this.isDragging) {
      e.preventDefault();

      if (e instanceof MouseEvent) {
        this.currentX = e.clientX - this.initialX;
        this.currentY = e.clientY - this.initialY;
      } else {
        this.currentX = e.touches[0].clientX - this.initialX;
        this.currentY = e.touches[0].clientY - this.initialY;
      }

      this.xOffset = this.currentX;
      this.yOffset = this.currentY;

      this.setTranslate(this.currentX, this.currentY, this.container);
    }
  }

  private dragEnd(): void {
    this.isDragging = false;
  }

  private setTranslate(xPos: number, yPos: number, el: HTMLElement): void {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }
}

// Initialize drag and drop when the module is imported
new DragAndDrop();
