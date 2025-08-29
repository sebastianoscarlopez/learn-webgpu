/// <reference types="@webgpu/types" />

// Vertex shader WGSL code
const vertexShaderCode = `
@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
    var pos = array<vec2f, 3>(
        vec2f( 0.0,  0.5),  // top center
        vec2f(-0.5, -0.5),  // bottom left
        vec2f( 0.5, -0.5)   // bottom right
    );
    return vec4f(pos[vertexIndex], 0.0, 1.0);
}`;

// Fragment shader WGSL code
const fragmentShaderCode = `
@fragment
fn main() -> @location(0) vec4f {
    return vec4f(1.0, 0.0, 0.0, 1.0);  // Red color
}`;

export async function initDemo(canvas: HTMLCanvasElement) {
  // Check if WebGPU is supported
  if (!navigator.gpu) {
    throw new Error("WebGPU is not supported by this browser.");
  }

  // Get the WebGPU adapter
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
  }

  // Get the WebGPU device
  const device = await adapter.requestDevice();

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  const context = canvas.getContext("webgpu") as GPUCanvasContext;
  if (!context) {
    throw new Error("Failed to get WebGPU context");
  }

  // Configure the swap chain
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: device,
    format: canvasFormat,
    alphaMode: "premultiplied",
  });

  // Create the shader modules
  const vertexShaderModule = device.createShaderModule({
    code: vertexShaderCode,
  });

  const fragmentShaderModule = device.createShaderModule({
    code: fragmentShaderCode,
  });

  // Create the render pipeline
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: vertexShaderModule,
      entryPoint: "main",
    },
    fragment: {
      module: fragmentShaderModule,
      entryPoint: "main",
      targets: [{ format: canvasFormat }],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

  // Create command encoder and render pass
  const commandEncoder = device.createCommandEncoder();
  const renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  };

  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.setPipeline(pipeline);
  passEncoder.draw(3, 1, 0, 0);
  passEncoder.end();

  // Submit the command buffer
  device.queue.submit([commandEncoder.finish()]);
}

export default {
  title: 'Triangle 1',
  description: 'The hello world of WebGPU. A simple triangle.',
  initDemo,
};