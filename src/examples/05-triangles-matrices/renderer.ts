/// <reference types="@webgpu/types" />
import { Pane } from "tweakpane";
import { vec2, vec3, vec4, mat4, Mat4 } from "wgpu-matrix";
import { debounce } from "@/utils/functions";
import { PaneDragAndDrop } from "@/pane-drag-and-drop";

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
  private modelBufferSize: number = 96; // 16 * 4 (view matrix) + 4 * 4 (color) + 16 padding
  private globalBufferSize: number = 128; // 16 * 4 (view matrix) + 16 * 4 (projection matrix)
  private projectionMatrix: Mat4 = mat4.identity();

  private objects: RenderObject[] = [];

  private pane?: Pane;

  private gui_params: {
    total: number;
    camera: {
      position: { x: number, y: number, z: number };
      rotation: { x: number, y: number, z: number };
    };
  } = {
      total: 10,
      camera: {
        position: {x: 0, y: 0, z: -10},
        rotation: {x: 0, y: 0, z: 0}
      }
    };

  private async setupGUI(): Promise<void> {
    this.pane = new PaneDragAndDrop();

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

    const cameraFolder = this.pane.addFolder({ title: 'Camera' });

    cameraFolder.addBinding(this.gui_params.camera, 'position', {
      x: { min: -5, max: 5, step: 0.1 },
      y: { min: -5, max: 5, step: 0.1 },
      z: { min: -100, max: 100, step: 0.1 }
    });

    cameraFolder.addBinding(this.gui_params.camera, 'rotation', {
      x: { min: -Math.PI, max: Math.PI, step: 0.1 },
      y: { min: -Math.PI, max: Math.PI, step: 0.1 },
      z: { min: -Math.PI, max: Math.PI, step: 0.1 }
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
    this.globalBuffer = this.device.createBuffer({
      label: "global buffer",
      size: this.globalBufferSize,
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
    this.updatePerspectiveView();
    const viewMatrix: Mat4 = this.getCameraView();

    this.device.queue.writeBuffer(
      this.globalBuffer,
      0,
      new Float32Array(this.projectionMatrix), // Convert matrix to Float32Array
      0,
      16 // elements in the matrix, not bytes -> https://developer.mozilla.org/en-US/docs/Web/API/GPUQueue/writeBuffer
    );

    // Write the view matrix to the buffer at offset 64 (after projection matrix)
    this.device.queue.writeBuffer(
      this.globalBuffer,
      64,  // offset by 64 bytes (16 floats * 4 bytes)
      new Float32Array(viewMatrix),
      0,
      16
    );
  }

  private updatePerspectiveView() {
    const fov = Math.PI / 4; // 45 degrees in radians
    const aspectRatio = this.canvas.width / this.canvas.height;
    const projectionMatrix: Mat4 = mat4.perspective(
      fov,
      aspectRatio,
      0.1,
      100.0
    );

    // const projectionMatrix = mat4.ortho(-1, 1, -1, 1, 0.1, 100.0);
    this.projectionMatrix = projectionMatrix;
  }

  private getCameraView(): Mat4 {
    // Create a view matrix from camera position and rotation
    const viewMatrix: Mat4 = mat4.identity();

    // First translate
    mat4.translate(viewMatrix, [
      -this.gui_params.camera.position.x,
      -this.gui_params.camera.position.y,
      this.gui_params.camera.position.z
    ], viewMatrix);

    // Then rotate around Z axis
    mat4.rotateZ(viewMatrix, this.gui_params.camera.rotation.z, viewMatrix);
    mat4.rotateY(viewMatrix, this.gui_params.camera.rotation.y, viewMatrix);
    mat4.rotateX(viewMatrix, this.gui_params.camera.rotation.x, viewMatrix);

    return viewMatrix;
  }

  private async updateModels(): Promise<void> {
    const data = new Float32Array(this.modelBufferSize / 4);

    for (let i = this.objects.length; i < this.gui_params.total; i++) {
      await this.addObject();

      const modelBuffer = this.objects[i].modelBuffer;

      const colorRandom = vec4.create(
        Math.random(),
        Math.random(),
        Math.random(),
        1.0
      );
      const scaleRandom = vec2.create(
        Math.random() * 2 + 0.5,
        Math.random() * 2 + 0.5,
      );
      const position = vec3.create(
        (Math.random() - 0.5) * 2.0,
        (Math.random() - 0.5) * 2.0,
        Math.random() * 2.0
      );

      // create a view matrix
      const viewMatrix: Mat4 = mat4.identity();
      mat4.translate(viewMatrix, [
        position[0],
        position[1],
        position[2],
      ], viewMatrix);
      mat4.scale(viewMatrix, [
        scaleRandom[0],
        scaleRandom[1],
        1.0
      ], viewMatrix);
      data.set(viewMatrix, 0);
      data.set(colorRandom, 16);

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
        topology: 'triangle-list',
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