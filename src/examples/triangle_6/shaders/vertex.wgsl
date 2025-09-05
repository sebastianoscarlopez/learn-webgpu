struct GlobalStruct {
  projection: mat4x4f,
  cameraView: mat4x4f,
}

struct ModelStruct {
  modelView: mat4x4f,
  color: vec4f,
} 

@group(0) @binding(0) var<uniform> global: GlobalStruct;
@group(0) @binding(1) var<storage, read> model: ModelStruct;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
};

@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    var pos = array<vec2f, 3>(
        vec2f( 0.0,  0.5),  // top center
        vec2f(-0.5, -0.5),  // bottom left
        vec2f( 0.5, -0.5)   // bottom right
    );

    var color = model.color;

    var position = vec4f(pos[vertexIndex], 0.0, 1.0);
    position = global.projection * global.cameraView * model.modelView * position;

    var output: VertexOutput;
    output.position = position;
    output.color = color;
    return output;
} 