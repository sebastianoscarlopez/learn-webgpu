/// <reference types="@webgpu/types" />
import { Pane } from "tweakpane";
import { vec2, vec4 } from "wgpu-matrix";
import { debounce } from "@/utils/functions";

interface RenderObject {
  modelBuffer: GPUBuffer;
  bindGroup: GPUBindGroup;
}

export class TriangleRenderer {
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private pipeline!: GPURenderPipeline;
  private vertexShader: string;
  private fragmentShader: string;
  private globalBuffer!: GPUBuffer;
  private modelBufferSize: number = 32; // 4 * 4 (color) + 4 * 2 (scale) + 4 * 2 (offset)
  

  private objects: RenderObject[] = [];
  
  private pane?: Pane;

  private gui_params: {
    total: number;
    scale: number;
    color: { r: number, g: number, b: number, a: number };
    offset: { x: number, y: number };
    zoom: number;
  } = {
    total: 10,
    scale: 0.5,
    color: {r: 0.5, g: 0.5, b: 0.5, a: 1},
    offset: {x: 0, y: 0},
    zoom: 1,
  };

  private async setupGUI(): Promise<void> {
    this.pane = new Pane();

    this.pane.on('change', debounce(() => {
        this.updateModels();
        this.updateGlobal();
        this.render();
      }, 1));

    this.pane.addBinding(this.gui_params, 'total', {
      min: 1,
      max: 100,
      step: 1,
    });

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

    this.pane.addBinding(this.gui_params, 'zoom', {
      min: 0.1,
      max: 4,
      step: 0.1,
    });
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
    await this.setupGlobal();

    await this.addObject();

    await this.updateGlobal();

    await this.updateModels();

    await this.setupGUI();
  }

  private async addObject(): Promise<void> {
    const modelBuffer = await this.createModelBuffer();
    const bindGroup = await this.createModelBindGroup(modelBuffer);
    this.objects.push({
      modelBuffer,
      bindGroup
    });
  }

  private async setupGlobal(): Promise<void> {
    const globalBufferSize = 32; // 4 + 28 padding
    this.globalBuffer = this.device.createBuffer({
      label: "global buffer",
      size: globalBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  private async createModelBuffer(): Promise<GPUBuffer> {
    return this.device.createBuffer({
      label: "models buffer",
      size: this.modelBufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
  }

  private async createModelBindGroup(modelBuffer: GPUBuffer): Promise<GPUBindGroup> {
    return this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [{
        binding: 0,
        resource: {
          buffer: this.globalBuffer
        }
      },
      {
        binding: 1,
        resource: {
          buffer: modelBuffer
        }
      }
    ]});
  }

  private async updateGlobal(): Promise<void> {
    const data = new Float32Array(1);
    data.set([this.gui_params.zoom]);
    this.device.queue.writeBuffer(this.globalBuffer, 0, data);
  }

  private async updateModels(): Promise<void> {
    const data = new Float32Array(this.modelBufferSize / 4);

    for (let i = this.objects.length; i < this.gui_params.total; i++) {
      await this.addObject();
    }
    
    const color = vec4.create(this.gui_params.color.r, this.gui_params.color.g, this.gui_params.color.b, this.gui_params.color.a);
    const scale = vec2.create(this.gui_params.scale, this.gui_params.scale);

    for (let i = 0; i < this.objects.length; i++) {
      const modelBuffer = this.objects[i].modelBuffer;

      const colorRandomDiff = vec4.create(
        color[0] + (Math.random()) * 0.5,
        color[1] + (Math.random()) * 0.5,
        color[2] + (Math.random()) * 0.5,
        color[3] + (Math.random()) * 0.5
      );
      const scaleRandomDiff = vec2.create(
        scale[0] + (Math.random() - 0.5) * 0.5,
        scale[1] + (Math.random() - 0.5) * 0.5,
      );
      const position = vec2.create(
        (Math.random() - 0.5) * 2.0,
        (Math.random() - 0.5) * 2.0,
      );

      data.set(colorRandomDiff);
      data.set(scaleRandomDiff, 4);
      data.set(position, 6);


      this.device.queue.writeBuffer(modelBuffer, 0, data);
    }
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
    for (let i = 0; i < this.gui_params.total; i++) { 
      passEncoder.setBindGroup(0, this.objects[i].bindGroup);
      passEncoder.draw(3, 1, 0, 0);
    }
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  public dispose(): void {
    if (this.pane) {
      this.pane.dispose();
    }
  }
}