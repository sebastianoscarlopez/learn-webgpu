/// <reference types="@webgpu/types" />
import { Vec2, vec2, Vec4, vec4 } from "wgpu-matrix";

export class TriangleRenderer {
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private pipeline!: GPURenderPipeline;
  private vertexShader: string;
  private fragmentShader: string;
  private uniforms!: GPUBuffer;
  private bindGroup!: GPUBindGroup;

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
    await this.setupUniforms();
    await this.createBindGroup();

    await this.updateUniforms({
      color: vec4.create(1, 0, 0, 1),
      scale: vec2.create(1, 1),
      offset: vec2.create(0, 0),
    });
  }

  private async createBindGroup(): Promise<void> {
    this.bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [{
        binding: 0,
        resource: {
          buffer: this.uniforms
        }
      }],
    });
  }

  private async setupUniforms(): Promise<void> {
    // color: 4 * 4
    // scale: 4 * 2
    // offset: 4 * 2
    const uniformBufferSize = 32;
    this.uniforms = this.device.createBuffer({
      label: "uniforms",
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  private async updateUniforms({ color, scale, offset }: { color: Vec4, scale: Vec2, offset: Vec2 }): Promise<void> {
    const data = new Float32Array(this.uniforms.size / 4);
    data.set(color);
    data.set(scale, 4);
    data.set(offset, 6);
    this.device.queue.writeBuffer(this.uniforms, 0, data);
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

  private async createPipeline(): Promise<void> {
    const vertexShaderModule = this.device.createShaderModule({
      label: "vertex shader with uniforms",
      code: this.vertexShader,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      label: "fragment shader with uniforms",
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
    passEncoder.setBindGroup(0, this.bindGroup);
    passEncoder.draw(3, 1, 0, 0);
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }
}