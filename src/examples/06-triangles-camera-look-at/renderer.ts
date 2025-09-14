/// <reference types="@webgpu/types" />
import { CameraLookAt } from "@/libs/camera/camera-lookat";
import { BaseRenderer } from "./core/base-renderer";
import { RendererGUI } from "./gui/renderer-gui";
import { BufferManager, RenderObject } from "./buffers/BufferManager";
import { CameraLookAtController } from '@/libs/camera/camera-lookat-controller';

export class TriangleRenderer extends BaseRenderer {
  private camera: CameraLookAt;
  private gui: RendererGUI;
  private bufferManager!: BufferManager;
  private objects: RenderObject[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    vertexShaderCode: string,
    fragmentShaderCode: string
  ) {
    super(canvas, vertexShaderCode, fragmentShaderCode);

    new CameraLookAtController(canvas);
    this.camera = new CameraLookAt(canvas);
    
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
    const canvasTexture = this.context.getCurrentTexture();
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: canvasTexture.createView(),
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",

        view: this.device.createTexture({
          size: {
            width: canvasTexture.width,
            height: canvasTexture.height,
          },
          format: 'depth24plus',
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        }).createView(),
      },
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