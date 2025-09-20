struct GlobalStruct {
  projection: mat4x4f,
  cameraView: mat4x4f,
}

@group(0) @binding(0) var<uniform> global: GlobalStruct;

@group(1) @binding(0) var<storage, read> modelView: mat4x4f;
@group(1) @binding(1) var<storage, read> vertices: array<vec3f>;
@group(1) @binding(2) var<storage, read> normalMatrix: mat3x3f;
@group(1) @binding(3) var<storage, read> normals: array<vec3f>;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) normal: vec3f,
};

@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    var position = global.projection * global.cameraView * modelView * vec4f(vertices[vertexIndex], 1.0);

    var output: VertexOutput;
    output.position = position;
    output.normal = normalMatrix * normals[vertexIndex];
    return output;
} 