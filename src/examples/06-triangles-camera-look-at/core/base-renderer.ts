/// <reference types="@webgpu/types" />

export abstract class BaseRenderer {
  protected device!: GPUDevice;
  protected context!: GPUCanvasContext;
  protected pipeline!: GPURenderPipeline;

  constructor(
    protected canvas: HTMLCanvasElement,
    protected vertexShader?: string,
    protected fragmentShader?: string
  ) {}

  protected async setupDevice(): Promise<void> {
    if (!navigator.gpu) {
      throw new Error("WebGPU is not supported by this browser.");
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("No appropriate GPUAdapter found.");
    }

    this.device = await adapter.requestDevice();
  }

  protected async setupContext(): Promise<void> {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    const context = this.canvas.getContext("webgpu");
    if (!context) {
      throw new Error("Failed to get WebGPU context");
    }
    this.context = context;

    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: canvasFormat,
      alphaMode: "premultiplied",
    });
  }

  protected async createPipeline(): Promise<void> {
    if (!this.vertexShader || !this.fragmentShader) {
      throw new Error("Shader code not provided");
    }

    const vertexShaderModule = this.device.createShaderModule({
      label: "vertex shader with storage models and global uniforms",
      code: this.vertexShader,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      label: "fragment shader",
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
        topology: 'triangle-list',
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      },
    });
  }

  async initialize(): Promise<void> {
    await this.setupDevice();
    await this.setupContext();
    if (this.vertexShader && this.fragmentShader) {
      await this.createPipeline();
    }
  }

  abstract render(): Promise<void>;
} 