/// <reference types="@webgpu/types" />
import { BaseRenderer } from "./core/BaseRenderer";
import { Camera } from "./camera/Camera";
import { RendererGUI } from "./gui/RendererGUI";
import { BufferManager, RenderObject } from "./buffers/BufferManager";

export class TriangleRenderer extends BaseRenderer {
  private camera: Camera;
  private gui: RendererGUI;
  private bufferManager!: BufferManager;
  private objects: RenderObject[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    vertexShaderCode: string,
    fragmentShaderCode: string
  ) {
    super(canvas, vertexShaderCode, fragmentShaderCode);
    this.camera = new Camera(canvas);
    this.gui = new RendererGUI(this.camera, () => {
      this.updateModels();
      this.updateGlobal();
      this.render();
    });
  }

  async initialize(): Promise<void> {
    await super.initialize();
    this.bufferManager = new BufferManager(this.device, this.pipeline);
    await this.bufferManager.initialize();
    await this.updateModels();
    await this.gui.initialize();
    this.camera.updateProjectionMatrix();
    await this.updateGlobal();
  }

  private async addObject(): Promise<void> {
    const modelBuffer = await this.bufferManager.createModelBuffer();
    const bindGroup = this.bufferManager.createModelBindGroup(modelBuffer);
    
    const { modelMatrix, color } = this.bufferManager.createRandomModelData();
    this.bufferManager.updateModelBuffer(modelBuffer, modelMatrix, color);

    this.objects.push({
      modelBuffer,
      bindGroup
    });
  }

  private async updateGlobal(): Promise<void> {
    this.bufferManager.updateGlobalBuffers(
      this.camera.getProjectionMatrix(),
      this.camera.getViewMatrix()
    );
  }

  private async updateModels(): Promise<void> {
    const currentTotal = this.gui.getTotal();
    
    // Add new objects if needed
    for (let i = this.objects.length; i < currentTotal; i++) {
      await this.addObject();
    }
  }

  async render(): Promise<void> {
    const commandEncoder = this.device.createCommandEncoder();
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.pipeline);
    const totalObjects = Math.min(this.objects.length, this.gui.getTotal());
    for (let i = 0; i < totalObjects; i++) {
      passEncoder.setBindGroup(0, this.objects[i].bindGroup);
      passEncoder.draw(3, 1, 0, 0);
    }
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  dispose(): void {
    this.gui.dispose();
    this.camera.dispose();
  }
}