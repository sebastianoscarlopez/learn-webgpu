export class GlobalBufferManager {
  private globalBuffer!: GPUBuffer;
  private globalBufferSize: number = 128; // 16 * 4 (view matrix) + 16 * 4 (projection matrix)
  public globalBindGroupLayout: GPUBindGroupLayout;
  public globalBindGroup: GPUBindGroup;
  private lightBuffer!: GPUBuffer;
  private lightBufferSize: number = 48; // 3 * 2 * 4 = 24 bytes for light struct

  constructor(
    private device: GPUDevice,
  ) {
    this.globalBindGroupLayout = device.createBindGroupLayout({
      label: "global bind group layout",
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "uniform",
            minBindingSize: 128,
          }
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "uniform",
            minBindingSize: this.lightBufferSize,
          }
        }
      ],
    });

    this.globalBuffer = this.device.createBuffer({
      label: "global buffer",
      size: this.globalBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.lightBuffer = this.device.createBuffer({
      label: "light buffer",
      size: this.lightBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.globalBindGroup = this.device.createBindGroup({
      layout: this.globalBindGroupLayout,
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
            buffer: this.lightBuffer
          }
        }
      ]});
  }

  updateGlobalBuffer(projectionMatrix: Float32Array, viewMatrix: Float32Array): void {
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

  updateLightBuffer(direction: Float32Array, color: Float32Array): void {
    this.device.queue.writeBuffer(
      this.lightBuffer,
      0,
      direction,
      0,
      3
    );

    this.device.queue.writeBuffer(
      this.lightBuffer,
      16,
      color,
      0,
      3
    );
  }
}