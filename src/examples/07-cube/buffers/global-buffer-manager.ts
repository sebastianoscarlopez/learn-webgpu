export class GlobalBufferManager {
  private globalBuffer!: GPUBuffer;
  private globalBufferSize: number = 128; // 16 * 4 (view matrix) + 16 * 4 (projection matrix)
  public globalBindGroupLayout: GPUBindGroupLayout;
  public globalBindGroup: GPUBindGroup;

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
        }
      ],
    });

    this.globalBuffer = this.device.createBuffer({
      label: "global buffer",
      size: this.globalBufferSize,
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
}