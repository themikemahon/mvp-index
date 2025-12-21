import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Home from './page'

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { name: /cyber threat globe/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<Home />)
    const description = screen.getByText(/interactive 3d visualization/i)
    expect(description).toBeInTheDocument()
  })
})