// Vertex shader for digital filament effects
// Creates flowing light streaks with parametric animation along spline paths

attribute float progress;
attribute float offset;
attribute float thickness;
attribute vec3 direction;

uniform float time;
uniform float flowSpeed;
uniform float waveAmplitude;
uniform float waveFrequency;
uniform float globalIntensity;

varying float vProgress;
varying float vOffset;
varying float vThickness;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying float vIntensity;

void main() {
    // Calculate animated progress along the filament path
    float animatedProgress = mod(progress + time * flowSpeed + offset, 1.0);
    
    // Create flowing wave distortion for organic movement
    float wave = sin(animatedProgress * PI * waveFrequency + time * 2.0) * waveAmplitude;
    
    // Apply wave distortion perpendicular to the direction
    vec3 perpendicular = normalize(cross(direction, vec3(0.0, 1.0, 0.0)));
    vec3 displacedPosition = position + perpendicular * wave * thickness;
    
    // Calculate intensity based on progress (fade in/out at ends)
    float progressIntensity = sin(animatedProgress * PI);
    vIntensity = progressIntensity * globalIntensity;
    
    // Pass varying values to fragment shader
    vProgress = animatedProgress;
    vOffset = offset;
    vThickness = thickness;
    vWorldPosition = (modelMatrix * vec4(displacedPosition, 1.0)).xyz;
    vNormal = normalize(normalMatrix * normal);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}