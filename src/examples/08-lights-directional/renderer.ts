/// <reference types="@webgpu/types" />
import { CameraLookAt } from "@/libs/camera/camera-lookat";
import { BaseRenderer } from "./core/base-renderer";
import { RendererGUI } from "./gui/renderer-gui";
import { GlobalBufferManager } from "./buffers/global-buffer-manager";
import { ModelBufferManager, RenderObject } from "./buffers/model-buffers-manager";
import { CameraLookAtController } from '@/libs/camera/camera-lookat-controller';
import { ModelData } from "./model-data";
import { mat4 } from "wgpu-matrix";

export class ObjectRenderer extends BaseRenderer {
  private camera: CameraLookAt;
  private gui: RendererGUI;
  private globalBufferManager!: GlobalBufferManager;
  private modelBufferManager!: ModelBufferManager;
  private objects: RenderObject[] = [];
  private modelData: ModelData;

  constructor(
    canvas: HTMLCanvasElement,
    vertexShaderCode: string,
    fragmentShaderCode: string,
    modelData: ModelData
  ) {
    super(canvas, vertexShaderCode, fragmentShaderCode);

    new CameraLookAtController(canvas);
    this.camera = new CameraLookAt(canvas);

    this.gui = new RendererGUI(this.camera, () => {
      this.updateModels();
      this.updateGlobal();
      this.render();
    });

    this.modelData = modelData;
  }

  async initialize(): Promise<void> {
    await super.initialize();
    this.globalBufferManager = new GlobalBufferManager(this.device);

    this.modelBufferManager = new ModelBufferManager(this.device);

    this.createPipelineLayout({
      label: "cube pipeline layout",
      bindGroupLayouts: [this.globalBufferManager.globalBindGroupLayout, this.modelBufferManager.modelBindGroupLayout]
    });
    this.createPipeline();

    await this.updateModels();
    await this.gui.initialize();
    this.camera.updateProjectionMatrix();
    await this.updateGlobal();
  }

  private async updateGlobal(): Promise<void> {
    this.globalBufferManager.updateGlobalBuffer(
      this.camera.getProjectionMatrix(),
      this.camera.getViewMatrix()
    );

    this.globalBufferManager.updateLightBuffer(
      new Float32Array([0.5, -0.5, -1.0]),
      new Float32Array([1.0, 1.0, 1.0])
    );
  }

  private async updateModels(): Promise<void> {
    const currentTotal = this.gui.getTotal();

    // Add new objects if needed
    for (let i = this.objects.length; i < currentTotal; i++) {
      await this.addObject();
    }
  }

  private async addObject(): Promise<void> {
    const modelBuffers = await this.modelBufferManager.createModelBuffers({
      maxVertices: this.modelData.positions.length,
      maxNormals: this.modelData.normals.length,
    });
    const bindGroup = this.modelBufferManager.createModelBindGroup(modelBuffers);

    const modelMatrix = mat4.identity();
    const color = new Float32Array([1.0, 1.0, 1.0, 1.0]);
    if (this.objects.length > 0) {
      mat4.translate(modelMatrix, [
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
      ], modelMatrix);

      color[0] = Math.random();
      color[1] = Math.random();
      color[2] = Math.random();
      color[3] = Math.random();
    }
    this.modelData.modelMatrix = modelMatrix;
    this.modelData.color = color;
    this.modelBufferManager.updateModelBuffer(modelBuffers, this.modelData);

    this.objects.push({
      modelBuffers: modelBuffers,
      bindGroup
    });
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
    passEncoder.setBindGroup(0, this.globalBufferManager.globalBindGroup);
    for (let i = 0; i < Math.min(this.objects.length, this.gui.getTotal()); i++) {
      passEncoder.setBindGroup(1, this.objects[i].bindGroup);
      passEncoder.draw(this.modelData.positions.length / 4, 1, 0, 0);
    }
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  dispose(): void {
    this.gui.dispose();
    this.camera.dispose();
  }
}