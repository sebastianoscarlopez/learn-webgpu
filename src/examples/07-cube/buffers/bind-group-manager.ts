export class GlobalBufferManager {
  private globalBuffer!: GPUBuffer;
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

  createModelBindGroup(modelBuffers: GPUBuffer[]): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.globalBuffer
          }
        },
        {
          binding: 1,
          resource: {
            buffer: modelBuffers[0]
          }
        },
        {
          binding: 2,
          resource: {
            buffer: modelBuffers[1]
          }
        },
        {
          binding: 3,
          resource: {
            buffer: modelBuffers[2]
          }
        }
      ]
    });
  }

  updateGlobalBuffers(projectionMatrix: Float32Array, viewMatrix: Float32Array): void {
    this.device.queue.writeBuffer(
      this.globalBuffer,
      0,
      projectionMatrix,
      0,
      16
    );

    this.device.queue.writeBuffer(
      this.globalBuffer,
      64,  // offset by 64 bytes (16 floats * 4 bytes)
      viewMatrix,
      0,
      16
    );
  }

  getGlobalBuffer(): GPUBuffer {
    return this.globalBuffer;
  }
}