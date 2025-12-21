// Fragment shader for digital filament effects
// Creates glowing, flowing light streaks with configurable colors

uniform float time;
uniform vec3 primaryColor;
uniform vec3 secondaryColor;
uniform float colorMixRatio;
uniform float glowIntensity;
uniform float opacity;
uniform float pulseSpeed;

varying float vProgress;
varying float vOffset;
varying float vThickness;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying float vIntensity;

void main() {
    // Create pulsing effect based on time and offset
    float pulse = sin(time * pulseSpeed + vOffset * 10.0) * 0.5 + 0.5;
    
    // Mix colors based on progress along the filament
    vec3 color = mix(primaryColor, secondaryColor, vProgress * colorMixRatio);
    
    // Add pulsing color variation
    color = mix(color, secondaryColor, pulse * 0.3);
    
    // Calculate glow effect based on distance from center
    float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
    float glow = 1.0 - smoothstep(0.0, 0.5, distanceFromCenter);
    glow = pow(glow, 2.0) * glowIntensity;
    
    // Apply intensity modulation
    float finalIntensity = vIntensity * glow * pulse;
    
    // Create flowing brightness variation
    float flow = sin(vProgress * PI * 4.0 - time * 3.0) * 0.3 + 0.7;
    finalIntensity *= flow;
    
    // Output final color with alpha for blending
    gl_FragColor = vec4(color * finalIntensity, opacity * finalIntensity);
}