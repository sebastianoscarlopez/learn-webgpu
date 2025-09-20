struct Light {
  direction: vec3f,
  color: vec3f,
};

@group(0) @binding(1) var<uniform> light: Light;
@group(1) @binding(4) var<uniform> color: vec4f;

@fragment
fn main(@location(0) normal: vec3f) -> @location(0) vec4f {
  let N = normalize(normal);
  let L = normalize(-light.direction);
  let lightIntensity = max(dot(N, L), 0.0);

  let finalColor = color.rgb * light.color * lightIntensity;
  let finalWithAlphaColor = vec4<f32>(finalColor, color.a);
  return finalWithAlphaColor;
} 