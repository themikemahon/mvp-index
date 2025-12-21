import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Type declaration for jest-dom matchers
declare module 'vitest' {
  interface Assertion<T = any> extends jest.Matchers<void, T> {}
  interface AsymmetricMatchersContaining extends jest.Matchers<void, any> {}
}

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock ResizeObserver for Three.js compatibility
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock WebGL context for Three.js
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: (contextType: string) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return {
        canvas: {},
        drawingBufferWidth: 300,
        drawingBufferHeight: 150,
        getExtension: () => null,
        getParameter: () => null,
        createShader: () => ({}),
        shaderSource: () => {},
        compileShader: () => {},
        createProgram: () => ({}),
        attachShader: () => {},
        linkProgram: () => {},
        useProgram: () => {},
        createBuffer: () => ({}),
        bindBuffer: () => {},
        bufferData: () => {},
        enableVertexAttribArray: () => {},
        vertexAttribPointer: () => {},
        createTexture: () => ({}),
        bindTexture: () => {},
        texImage2D: () => {},
        texParameteri: () => {},
        clear: () => {},
        clearColor: () => {},
        clearDepth: () => {},
        enable: () => {},
        disable: () => {},
        depthFunc: () => {},
        viewport: () => {},
        drawArrays: () => {},
        drawElements: () => {},
        getShaderParameter: () => true,
        getProgramParameter: () => true,
        getShaderInfoLog: () => '',
        getProgramInfoLog: () => '',
      }
    }
    return null
  }
})