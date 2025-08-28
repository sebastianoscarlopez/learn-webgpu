/// <reference types="@webgpu/types" />
import { Pane } from "tweakpane";
import { vec2, vec4 } from "wgpu-matrix";
import { debounce } from "@/utils/functions";

export class TriangleRenderer {
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private pipeline!: GPURenderPipeline;
  private vertexShader: string;
  private fragmentShader: string;
  private uniforms!: GPUBuffer;
  private bindGroup!: GPUBindGroup;
  private pane?: Pane;

  private gui_params: {
    scale: number;
    color: { r: number, g: number, b: number, a: number };
    offset: { x: number, y: number };
  } = {
    scale: 1,
    color: {r: 255, g: 0, b: 0, a: 1},
    offset: {x: 0, y: 0},
  };

  private async setupGUI(): Promise<void> {
    this.pane = new Pane();

    this.pane.on('change', debounce(() => {
      this.updateUniforms();
      this.render();
    }, 1));

    this.pane.addBinding(this.gui_params, 'scale', {
      min: 0.1,
      max: 2,
      step: 0.1,
    });

    this.pane.addBinding(this.gui_params, 'color', {
      view: 'color',
      alpha: true,
      color: {
        type: 'float'
      }
    });

    this.pane.addBinding(this.gui_params, 'offset',
      {
        x: {
          min: -2,
          max: 2,
          step: 0.1,
        },
        y: {
          min: -2,
          max: 2,
          step: 0.1,
        },
      }
    );
  }

  

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

    await this.updateUniforms();

    await this.setupGUI();
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

  private async updateUniforms(): Promise<void> {
    const data = new Float32Array(this.uniforms.size / 4);
    const color = vec4.create(this.gui_params.color.r, this.gui_params.color.g, this.gui_params.color.b, this.gui_params.color.a);
    data.set(color);
    data.set(vec2.create(this.gui_params.scale, this.gui_params.scale), 4);
    data.set(vec2.create(this.gui_params.offset.x, this.gui_params.offset.y), 6);
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
    passEncoder.setBindGroup(0, this.bindGroup);
    passEncoder.draw(3, 1, 0, 0);
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  public dispose(): void {
    if (this.pane) {
      this.pane.dispose();
    }
  }
}