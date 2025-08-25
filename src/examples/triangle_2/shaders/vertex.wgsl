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

    var colors = array<vec3f, 3>(
        vec3f(1.0, 0.0, 0.0),  // red
        vec3f(0.0, 1.0, 0.0),  // green
        vec3f(0.0, 0.0, 1.0)   // blue
    );

    var output: VertexOutput;
    output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
    output.color = vec4f(colors[vertexIndex], 1.0);
    return output;
} 