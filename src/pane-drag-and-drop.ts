import { Pane } from "tweakpane";

export class PaneDragAndDrop extends Pane {
  private container: HTMLElement;
  constructor() {
    const container = document.querySelector('.drag-and-drop-container') as HTMLElement;
    super({container: container});
    this.container = container;
    this.container.style.visibility = 'visible';
  }

  public dispose(): void {
    super.dispose();
    this.container.style.visibility = 'hidden';
  }
}
