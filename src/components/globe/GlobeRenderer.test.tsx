import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { GlobeRenderer } from './GlobeRenderer'

describe('GlobeRenderer', () => {
  it('should render the wrapper div without crashing', () => {
    const { container } = render(<GlobeRenderer />)
    expect(container.firstChild).toBeTruthy()
  })

  it('should apply custom className when provided', () => {
    const { container } = render(<GlobeRenderer className="custom-class" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('custom-class')
  })

  it('should have default dimensions', () => {
    const { container } = render(<GlobeRenderer />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('w-full')
    expect(wrapper.className).toContain('h-full')
  })

  it('should render with proper structure', () => {
    const { container } = render(<GlobeRenderer />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.tagName).toBe('DIV')
  })
})
