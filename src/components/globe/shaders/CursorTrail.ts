// CursorTrail.ts - Real-time cursor-following filament effects
import * as THREE from 'three'
import { FilamentShaderMaterial } from './FilamentShader'

interface TrailPoint {
  position: THREE.Vector3
  timestamp: number
  intensity: number
}

export interface CursorTrailOptions {
  maxTrailLength?: number
  trailLifetime?: number
  segmentCount?: number
  thickness?: number
  color?: THREE.Color
  secondaryColor?: THREE.Color
  intensity?: number
}

export class CursorTrail extends THREE.Object3D {
  private maxTrailLength: number
  private trailLifetime: number
  private segmentCount: number
  private thickness: number
  private intensity: number
  
  private trailPoints: TrailPoint[] = []
  private spline: THREE.CatmullRomCurve3 | null = null
  private trailMesh: THREE.Mesh | null = null
  private material: FilamentShaderMaterial
  private camera: THREE.Camera | null = null
  private raycaster: THREE.Raycaster = new THREE.Raycaster()
  private globeRadius: number = 2.0
  
  constructor(options: CursorTrailOptions = {}) {
    super()
    
    const {
      maxTrailLength = 20,
      trailLifetime = 2.0,
      segmentCount = 50,
      thickness = 0.02,
      color = new THREE.Color(0x00ffff),
      secondaryColor = new THREE.Color(0x8a2be2),
      intensity = 1.0
    } = options
    
    this.maxTrailLength = maxTrailLength
    this.trailLifetime = trailLifetime
    this.segmentCount = segmentCount
    this.thickness = thickness
    this.intensity = intensity
    
    // Create filament material for the trail
    this.material = new FilamentShaderMaterial({
      primaryColor: { value: color },
      secondaryColor: { value: secondaryColor },
      globalIntensity: { value: intensity },
      flowSpeed: { value: 2.0 },
      waveAmplitude: { value: 0.05 },
      opacity: { value: 0.8 }
    })
    
    this.material.setProtectionColors()
  }
  
  // Set camera reference for raycasting
  setCamera(camera: THREE.Camera) {
    this.camera = camera
  }
  
  // Update trail with new mouse position
  updateMousePosition(mouseX: number, mouseY: number, globeObject: THREE.Object3D) {
    if (!this.camera) return
    
    // Convert screen coordinates to normalized device coordinates
    const mouse = new THREE.Vector2(
      (mouseX / window.innerWidth) * 2 - 1,
      -(mouseY / window.innerHeight) * 2 + 1
    )
    
    // Raycast to find intersection with globe
    this.raycaster.setFromCamera(mouse, this.camera)
    const intersects = this.raycaster.intersectObject(globeObject, true)
    
    if (intersects.length > 0) {
      const intersectionPoint = intersects[0].point
      
      // Project point onto globe surface
      const surfacePoint = intersectionPoint.clone().normalize().multiplyScalar(this.globeRadius + 0.1)
      
      // Add new trail point
      this.addTrailPoint(surfacePoint)
      
      // Update trail geometry
      this.updateTrailGeometry()
    }
  }
  
  private addTrailPoint(position: THREE.Vector3) {
    const now = Date.now()
    
    // Add new point
    this.trailPoints.push({
      position: position.clone(),
      timestamp: now,
      intensity: this.intensity
    })
    
    // Remove old points
    this.trailPoints = this.trailPoints.filter(
      point => (now - point.timestamp) / 1000 < this.trailLifetime
    )
    
    // Limit trail length
    if (this.trailPoints.length > this.maxTrailLength) {
      this.trailPoints = this.trailPoints.slice(-this.maxTrailLength)
    }
  }
  
  private updateTrailGeometry() {
    if (this.trailPoints.length < 2) {
      // Hide trail if not enough points
      if (this.trailMesh) {
        this.trailMesh.visible = false
      }
      return
    }
    
    // Create spline from trail points
    const points = this.trailPoints.map(point => point.position)
    this.spline = new THREE.CatmullRomCurve3(points)
    
    // Generate geometry along the spline
    const geometry = this.createTrailGeometry()
    
    // Update or create mesh
    if (this.trailMesh) {
      this.trailMesh.geometry.dispose()
      this.trailMesh.geometry = geometry
      this.trailMesh.visible = true
    } else {
      this.trailMesh = new THREE.Mesh(geometry, this.material)
      this.add(this.trailMesh)
    }
  }
  
  private createTrailGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry()
    
    if (!this.spline) return geometry
    
    // Generate points along the spline
    const points: THREE.Vector3[] = []
    const progress: number[] = []
    const offsets: number[] = []
    const thicknesses: number[] = []
    const directions: THREE.Vector3[] = []
    
    for (let i = 0; i <= this.segmentCount; i++) {
      const t = i / this.segmentCount
      const point = this.spline.getPoint(t)
      const tangent = this.spline.getTangent(t)
      
      points.push(point)
      progress.push(t)
      offsets.push(Math.random()) // Random offset for variation
      
      // Thickness varies along the trail (thicker at start, thinner at end)
      const ageRatio = 1.0 - t
      thicknesses.push(this.thickness * ageRatio)
      
      directions.push(tangent.normalize())
    }
    
    // Create tube geometry along the spline
    const tubeGeometry = new THREE.TubeGeometry(this.spline, this.segmentCount, this.thickness, 8, false)
    
    // Add custom attributes for the shader
    const positionArray = tubeGeometry.attributes.position.array as Float32Array
    const vertexCount = positionArray.length / 3
    
    const progressArray = new Float32Array(vertexCount)
    const offsetArray = new Float32Array(vertexCount)
    const thicknessArray = new Float32Array(vertexCount)
    const directionArray = new Float32Array(vertexCount * 3)
    
    // Fill attribute arrays
    for (let i = 0; i < vertexCount; i++) {
      const segmentIndex = Math.floor(i / 8) // 8 vertices per segment (tube radial segments)
      const t = segmentIndex / this.segmentCount
      
      progressArray[i] = t
      offsetArray[i] = Math.random()
      thicknessArray[i] = this.thickness * (1.0 - t)
      
      // Direction (tangent at this point)
      if (segmentIndex < directions.length) {
        const direction = directions[segmentIndex]
        directionArray[i * 3] = direction.x
        directionArray[i * 3 + 1] = direction.y
        directionArray[i * 3 + 2] = direction.z
      }
    }
    
    // Set attributes
    geometry.copy(tubeGeometry)
    geometry.setAttribute('progress', new THREE.BufferAttribute(progressArray, 1))
    geometry.setAttribute('offset', new THREE.BufferAttribute(offsetArray, 1))
    geometry.setAttribute('thickness', new THREE.BufferAttribute(thicknessArray, 1))
    geometry.setAttribute('direction', new THREE.BufferAttribute(directionArray, 3))
    
    return geometry
  }
  
  // Update animation
  update(deltaTime: number) {
    const now = Date.now()
    
    // Remove expired trail points
    this.trailPoints = this.trailPoints.filter(
      point => (now - point.timestamp) / 1000 < this.trailLifetime
    )
    
    // Update material time
    this.material.updateTime(now / 1000)
    
    // Update trail geometry if points changed
    if (this.trailPoints.length >= 2) {
      this.updateTrailGeometry()
    } else if (this.trailMesh) {
      this.trailMesh.visible = false
    }
  }
  
  // Clear the trail
  clear(): this {
    this.trailPoints = []
    if (this.trailMesh) {
      this.trailMesh.visible = false
    }
    return this
  }
  
  // Set trail colors
  setColors(primary: THREE.Color, secondary: THREE.Color) {
    this.material.uniforms.primaryColor.value = primary
    this.material.uniforms.secondaryColor.value = secondary
  }
  
  // Set trail intensity
  setIntensity(intensity: number) {
    this.intensity = intensity
    this.material.setIntensity(intensity)
  }
  
  // Set trail opacity
  setOpacity(opacity: number) {
    this.material.setOpacity(opacity)
  }
  
  // Get current trail length
  getTrailLength(): number {
    return this.trailPoints.length
  }
  
  // Check if trail is active
  isActive(): boolean {
    return this.trailPoints.length > 0
  }
  
  // Dispose resources
  dispose() {
    if (this.trailMesh) {
      this.trailMesh.geometry.dispose()
      this.remove(this.trailMesh)
    }
    this.material.dispose()
  }
}