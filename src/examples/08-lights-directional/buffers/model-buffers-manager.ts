import { ModelData } from "../model-data";

export interface RenderObject {
  modelBuffers: GPUBuffer[];
  bindGroup: GPUBindGroup;
}

export class ModelBufferManager {
  public modelBindGroupLayout: GPUBindGroupLayout;

  constructor(
    private device: GPUDevice
  ) {
    this.modelBindGroupLayout = device.createBindGroupLayout({
      label: "model bind group layout",
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "read-only-storage",
            minBindingSize: 16 * 4 // model matrix 4x4
          }
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "read-only-storage",
            minBindingSize: 16 // align to 16 bytes for vec3f array
          }
        },
        {
          binding: 2,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "read-only-storage",
            minBindingSize: 12 * 4 // normal matrix 3x3 + 1x4 padding
          }
        },
        {
          binding: 3,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "read-only-storage",
            minBindingSize: 16 // align to 16 bytes for vec3f array
          }
        },
        {
          binding: 4,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "uniform",
            minBindingSize: 16 // align to 16 bytes for vec4f array
          }
        },
      ],
    });
  }

  async createModelBuffers({ maxVertices, maxNormals }: { maxVertices: number, maxNormals: number }): Promise<GPUBuffer[]> {
    const modelMatrixBuffer = this.device.createBuffer({
      label: "model matrix buffer",
      size: 16 * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const modelVerticesBuffer = this.device.createBuffer({
      label: "model vertices buffer",
      size: maxVertices * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const normalMatrixBuffer = this.device.createBuffer({
      label: "normal matrix buffer",
      size: 12 * 4, // 3x3 matrix + 1x4 padding
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const modelNormalsBuffer = this.device.createBuffer({
      label: "model normals buffer",
      size: maxNormals * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const modelColorBuffer = this.device.createBuffer({
      label: "model color buffer",
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    return [modelMatrixBuffer, modelVerticesBuffer, normalMatrixBuffer, modelNormalsBuffer, modelColorBuffer];
  }

  createModelBindGroup(modelBuffers: GPUBuffer[]): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.modelBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: modelBuffers[0]
          }
        },
        {
          binding: 1,
          resource: {
            buffer: modelBuffers[1]
          }
        },
        {
          binding: 2,
          resource: {
            buffer: modelBuffers[2]
          }
        },
        {
          binding: 3,
          resource: {
            buffer: modelBuffers[3]
          }
        },
        {
          binding: 4,
          resource: {
            buffer: modelBuffers[4]
          }
        },
      ]});
  }

  updateModelBuffer(modelBuffers: GPUBuffer[], modelData: ModelData): void {
    this.device.queue.writeBuffer(modelBuffers[0], 0, modelData.modelMatrix);
    this.device.queue.writeBuffer(modelBuffers[1], 0, modelData.positions);
    this.device.queue.writeBuffer(modelBuffers[2], 0, modelData.normalMatrix);
    this.device.queue.writeBuffer(modelBuffers[3], 0, modelData.normals);
    this.device.queue.writeBuffer(modelBuffers[4], 0, modelData.color);
  }
}