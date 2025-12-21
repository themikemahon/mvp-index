// ParticleSystem.ts - GPU-accelerated particle system for ambient filament effects
import * as THREE from 'three'

// Particle vertex shader
const particleVertexShader = `
attribute float size;
attribute float alpha;
attribute vec3 velocity;
attribute float life;
attribute float maxLife;

uniform float time;
uniform float globalSize;
uniform float globalAlpha;

varying float vAlpha;
varying float vLife;

void main() {
    // Calculate life progress (0 to 1)
    vLife = life / maxLife;
    
    // Fade in and out based on life
    float lifeFade = sin(vLife * 3.14159);
    vAlpha = alpha * lifeFade * globalAlpha;
    
    // Calculate position with velocity
    vec3 pos = position + velocity * time;
    
    // Apply magnetic field simulation (circular motion around globe)
    float magneticStrength = 0.5;
    vec3 center = vec3(0.0, 0.0, 0.0);
    vec3 toCenter = normalize(center - pos);
    vec3 magnetic = cross(toCenter, vec3(0.0, 1.0, 0.0)) * magneticStrength;
    pos += magnetic * sin(time + length(position)) * 0.1;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size based on distance and life - with safety limits
    float distanceFromCamera = length(mvPosition.xyz);
    float safeDistance = max(distanceFromCamera, 3.0); // Prevent division by very small numbers
    float sizeMultiplier = size * globalSize * lifeFade;
    float sizeScale = clamp(300.0 / safeDistance, 0.5, 5.0); // Limit the scaling range
    gl_PointSize = clamp(sizeMultiplier * sizeScale, 1.0, 100.0); // Hard limits on final size
}
`

// Particle fragment shader
const particleFragmentShader = `
uniform vec3 color;
uniform sampler2D pointTexture;

varying float vAlpha;
varying float vLife;

void main() {
    // Create circular particle with soft edges
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) discard;
    
    // Soft circular falloff
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha = pow(alpha, 2.0);
    
    // Add some sparkle effect
    float sparkle = sin(vLife * 20.0) * 0.3 + 0.7;
    
    gl_FragColor = vec4(color, vAlpha * alpha * sparkle);
}
`

export interface ParticleSystemOptions {
  particleCount?: number
  emissionRate?: number
  particleLife?: number
  particleSize?: number
  color?: THREE.Color
  velocity?: number
  spread?: number
}

export class ParticleSystem extends THREE.Points {
  private particleCount: number
  private emissionRate: number
  private particleLife: number
  private particleSize: number
  private velocity: number
  private spread: number
  private time: number = 0
  private lastEmissionTime: number = 0
  private activeParticles: number = 0
  
  // Particle attributes
  private positions: Float32Array
  private velocities: Float32Array
  private sizes: Float32Array
  private alphas: Float32Array
  private lives: Float32Array
  private maxLives: Float32Array
  
  constructor(options: ParticleSystemOptions = {}) {
    const {
      particleCount = 1000,
      emissionRate = 50,
      particleLife = 5.0,
      particleSize = 1.0,
      color = new THREE.Color(0x00ffff),
      velocity = 1.0,
      spread = 0.5
    } = options

    // Create geometry
    const geometry = new THREE.BufferGeometry()
    
    // Initialize particle arrays
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const alphas = new Float32Array(particleCount)
    const lives = new Float32Array(particleCount)
    const maxLives = new Float32Array(particleCount)
    
    // Set up geometry attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
    geometry.setAttribute('life', new THREE.BufferAttribute(lives, 1))
    geometry.setAttribute('maxLife', new THREE.BufferAttribute(maxLives, 1))
    
    // Create material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: color },
        globalSize: { value: particleSize },
        globalAlpha: { value: 1.0 },
        pointTexture: { value: null }
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    
    super(geometry, material)
    
    // Store options
    this.particleCount = particleCount
    this.emissionRate = emissionRate
    this.particleLife = particleLife
    this.particleSize = particleSize
    this.velocity = velocity
    this.spread = spread
    
    // Store attribute arrays
    this.positions = positions
    this.velocities = velocities
    this.sizes = sizes
    this.alphas = alphas
    this.lives = lives
    this.maxLives = maxLives
    
    // Initialize all particles as inactive
    for (let i = 0; i < particleCount; i++) {
      this.lives[i] = -1 // Negative life means inactive
      this.alphas[i] = 0
    }
  }
  
  // Emit particles along a spline path
  emitAlongPath(splinePath: THREE.CatmullRomCurve3, deltaTime: number) {
    this.time += deltaTime
    
    // Check if it's time to emit new particles
    const timeSinceLastEmission = this.time - this.lastEmissionTime
    const emissionInterval = 1.0 / this.emissionRate
    
    if (timeSinceLastEmission >= emissionInterval) {
      this.emitParticle(splinePath)
      this.lastEmissionTime = this.time
    }
    
    // Update existing particles
    this.updateParticles(deltaTime)
  }
  
  private emitParticle(splinePath: THREE.CatmullRomCurve3) {
    // Find an inactive particle
    let particleIndex = -1
    for (let i = 0; i < this.particleCount; i++) {
      if (this.lives[i] <= 0) {
        particleIndex = i
        break
      }
    }
    
    if (particleIndex === -1) return // No available particles
    
    // Get random position along the spline
    const t = Math.random()
    const position = splinePath.getPoint(t)
    const tangent = splinePath.getTangent(t)
    
    // Set particle position
    this.positions[particleIndex * 3] = position.x
    this.positions[particleIndex * 3 + 1] = position.y
    this.positions[particleIndex * 3 + 2] = position.z
    
    // Set particle velocity (along tangent with some spread)
    const spreadVector = new THREE.Vector3(
      (Math.random() - 0.5) * this.spread,
      (Math.random() - 0.5) * this.spread,
      (Math.random() - 0.5) * this.spread
    )
    
    const velocity = tangent.clone().multiplyScalar(this.velocity).add(spreadVector)
    this.velocities[particleIndex * 3] = velocity.x
    this.velocities[particleIndex * 3 + 1] = velocity.y
    this.velocities[particleIndex * 3 + 2] = velocity.z
    
    // Set particle properties
    this.sizes[particleIndex] = this.particleSize * (0.5 + Math.random() * 0.5)
    this.alphas[particleIndex] = 1.0
    this.lives[particleIndex] = this.particleLife
    this.maxLives[particleIndex] = this.particleLife
    
    this.activeParticles++
  }
  
  private updateParticles(deltaTime: number) {
    let needsUpdate = false
    
    for (let i = 0; i < this.particleCount; i++) {
      if (this.lives[i] > 0) {
        // Update life
        this.lives[i] -= deltaTime
        
        if (this.lives[i] <= 0) {
          // Particle died
          this.alphas[i] = 0
          this.activeParticles--
          needsUpdate = true
        } else {
          // Update position
          this.positions[i * 3] += this.velocities[i * 3] * deltaTime
          this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * deltaTime
          this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * deltaTime
          needsUpdate = true
        }
      }
    }
    
    if (needsUpdate) {
      // Update buffer attributes
      const positionAttribute = this.geometry.getAttribute('position') as THREE.BufferAttribute
      const lifeAttribute = this.geometry.getAttribute('life') as THREE.BufferAttribute
      const alphaAttribute = this.geometry.getAttribute('alpha') as THREE.BufferAttribute
      
      positionAttribute.needsUpdate = true
      lifeAttribute.needsUpdate = true
      alphaAttribute.needsUpdate = true
    }
    
    // Update shader time uniform
    if (this.material instanceof THREE.ShaderMaterial) {
      this.material.uniforms.time.value = this.time
    }
  }
  
  // Update color
  setColor(color: THREE.Color) {
    if (this.material instanceof THREE.ShaderMaterial) {
      this.material.uniforms.color.value = color
    }
  }
  
  // Update global size
  setGlobalSize(size: number) {
    if (this.material instanceof THREE.ShaderMaterial) {
      this.material.uniforms.globalSize.value = size
    }
  }
  
  // Update global alpha
  setGlobalAlpha(alpha: number) {
    if (this.material instanceof THREE.ShaderMaterial) {
      this.material.uniforms.globalAlpha.value = alpha
    }
  }
  
  // Get active particle count
  getActiveParticleCount(): number {
    return this.activeParticles
  }
  
  // Reset all particles
  reset() {
    for (let i = 0; i < this.particleCount; i++) {
      this.lives[i] = -1
      this.alphas[i] = 0
    }
    this.activeParticles = 0
    this.time = 0
    this.lastEmissionTime = 0
  }
}