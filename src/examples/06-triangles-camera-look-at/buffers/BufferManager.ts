import { vec2, vec3, vec4, mat4, Mat4 } from "wgpu-matrix";

export interface RenderObject {
  modelBuffer: GPUBuffer;
  bindGroup: GPUBindGroup;
}

export class BufferManager {
  private globalBuffer!: GPUBuffer;
  private modelBufferSize: number = 96; // 16 * 4 (view matrix) + 4 * 4 (color) + 16 padding
  private globalBufferSize: number = 128; // 16 * 4 (view matrix) + 16 * 4 (projection matrix)

  constructor(
    private device: GPUDevice,
    private pipeline: GPURenderPipeline
  ) {}

  async initialize(): Promise<void> {
    await this.setupGlobal();
  }

  private async setupGlobal(): Promise<void> {
    this.globalBuffer = this.device.createBuffer({
      label: "global buffer",
      size: this.globalBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  async createModelBuffer(): Promise<GPUBuffer> {
    return this.device.createBuffer({
      label: "models buffer",
      size: this.modelBufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
  }

  createModelBindGroup(modelBuffer: GPUBuffer): GPUBindGroup {
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

  updateGlobalBuffers(projectionMatrix: Mat4, viewMatrix: Mat4): void {
    this.device.queue.writeBuffer(
      this.globalBuffer,
      0,
      new Float32Array(projectionMatrix),
      0,
      16
    );

    this.device.queue.writeBuffer(
      this.globalBuffer,
      64,  // offset by 64 bytes (16 floats * 4 bytes)
      new Float32Array(viewMatrix),
      0,
      16
    );
  }

  createRandomModelData(): { modelMatrix: Mat4, color: Float32Array } {
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

    const modelMatrix = mat4.identity();
    mat4.translate(modelMatrix, [
      position[0],
      position[1],
      position[2],
    ], modelMatrix);
    mat4.scale(modelMatrix, [
      scaleRandom[0],
      scaleRandom[1],
      1.0
    ], modelMatrix);

    return { modelMatrix, color: colorRandom };
  }

  updateModelBuffer(modelBuffer: GPUBuffer, modelMatrix: Mat4, color: Float32Array): void {
    const data = new Float32Array(this.modelBufferSize / 4);
    data.set(modelMatrix, 0);
    data.set(color, 16);

    this.device.queue.writeBuffer(modelBuffer, 0, data);
  }

  getGlobalBuffer(): GPUBuffer {
    return this.globalBuffer;
  }
} 