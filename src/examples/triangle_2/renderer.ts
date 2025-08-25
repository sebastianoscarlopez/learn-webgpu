/// <reference types="@webgpu/types" />

export class TriangleRenderer {
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private pipeline!: GPURenderPipeline;
  private vertexShader: string;
  private fragmentShader: string;

  constructor(
    private canvas: HTMLCanvasElement,
    vertexShaderCode: string,
    fragmentShaderCode: string
  ) {
    this.vertexShader = vertexShaderCode;
    this.fragmentShader = fragmentShaderCode;
  }

  async initialize(): Promise<void> {
    await this.setupDevice();
    await this.setupContext();
    await this.createPipeline();
  }

  private async setupDevice(): Promise<void> {
    if (!navigator.gpu) {
      throw new Error("WebGPU is not supported by this browser.");
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("No appropriate GPUAdapter found.");
    }

    this.device = await adapter.requestDevice();
  }

  private async setupContext(): Promise<void> {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    this.context = this.canvas.getContext("webgpu") as GPUCanvasContext;
    if (!this.context) {
      throw new Error("Failed to get WebGPU context");
    }

    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: canvasFormat,
      alphaMode: "premultiplied",
    });
  }

  private async createPipeline(): Promise<void> {
    const vertexShaderModule = this.device.createShaderModule({
      code: this.vertexShader,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: this.fragmentShader,
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: vertexShaderModule,
        entryPoint: "main",
      },
      fragment: {
        module: fragmentShaderModule,
        entryPoint: "main",
        targets: [{
          format: navigator.gpu.getPreferredCanvasFormat()
        }],
      },
      primitive: {
        topology: "triangle-list",
      },
    });
  }

  render(): void {
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
    passEncoder.draw(3, 1, 0, 0);
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }
}