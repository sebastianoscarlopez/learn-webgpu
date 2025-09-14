struct Uniforms {
  color: vec4f,
  scale: vec2f,
  offset: vec2f,
}
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

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

    var color = uniforms.color;

    var output: VertexOutput;
    output.position = vec4f(pos[vertexIndex] * uniforms.scale + uniforms.offset, 0.0, 1.0);
    output.color = color;
    return output;
} 