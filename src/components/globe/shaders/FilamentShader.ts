// FilamentShader.ts - Custom shader material for digital filament effects
import * as THREE from 'three'

// Shader source code
const vertexShader = `
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
    float wave = sin(animatedProgress * 3.14159 * waveFrequency + time * 2.0) * waveAmplitude;
    
    // Apply wave distortion perpendicular to the direction
    vec3 perpendicular = normalize(cross(direction, vec3(0.0, 1.0, 0.0)));
    vec3 displacedPosition = position + perpendicular * wave * thickness;
    
    // Calculate intensity based on progress (fade in/out at ends)
    float progressIntensity = sin(animatedProgress * 3.14159);
    vIntensity = progressIntensity * globalIntensity;
    
    // Pass varying values to fragment shader
    vProgress = animatedProgress;
    vOffset = offset;
    vThickness = thickness;
    vWorldPosition = (modelMatrix * vec4(displacedPosition, 1.0)).xyz;
    vNormal = normalize(normalMatrix * normal);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
`

const fragmentShader = `
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
    float flow = sin(vProgress * 3.14159 * 4.0 - time * 3.0) * 0.3 + 0.7;
    finalIntensity *= flow;
    
    // Output final color with alpha for blending
    gl_FragColor = vec4(color * finalIntensity, opacity * finalIntensity);
}
`

export interface FilamentShaderUniforms {
  [uniform: string]: THREE.IUniform<any>
  time: { value: number }
  flowSpeed: { value: number }
  waveAmplitude: { value: number }
  waveFrequency: { value: number }
  globalIntensity: { value: number }
  primaryColor: { value: THREE.Color }
  secondaryColor: { value: THREE.Color }
  colorMixRatio: { value: number }
  glowIntensity: { value: number }
  opacity: { value: number }
  pulseSpeed: { value: number }
}

export class FilamentShaderMaterial extends THREE.ShaderMaterial {
  constructor(options: Partial<FilamentShaderUniforms> = {}) {
    const uniforms: FilamentShaderUniforms = {
      time: { value: 0 },
      flowSpeed: { value: 1.0 },
      waveAmplitude: { value: 0.1 },
      waveFrequency: { value: 2.0 },
      globalIntensity: { value: 1.0 },
      primaryColor: { value: new THREE.Color(0x00ffff) }, // Cyan for protection data
      secondaryColor: { value: new THREE.Color(0x8a2be2) }, // Blue-violet for protection data
      colorMixRatio: { value: 0.5 },
      glowIntensity: { value: 2.0 },
      opacity: { value: 0.8 },
      pulseSpeed: { value: 2.0 },
      ...options
    }

    super({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  }

  // Update time uniform for animation
  updateTime(time: number) {
    this.uniforms.time.value = time
  }

  // Update color scheme for different data types
  setThreatColors() {
    this.uniforms.primaryColor.value.setHex(0xff4444) // Red
    this.uniforms.secondaryColor.value.setHex(0xffaa00) // Orange
  }

  setProtectionColors() {
    this.uniforms.primaryColor.value.setHex(0x00ffff) // Cyan
    this.uniforms.secondaryColor.value.setHex(0x8a2be2) // Blue-violet
  }

  // Configure animation parameters
  setFlowSpeed(speed: number) {
    this.uniforms.flowSpeed.value = speed
  }

  setIntensity(intensity: number) {
    this.uniforms.globalIntensity.value = intensity
  }

  setOpacity(opacity: number) {
    this.uniforms.opacity.value = opacity
  }
}

export { vertexShader, fragmentShader }