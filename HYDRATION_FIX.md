# Hydration Error Fix

## Problem
The app was experiencing a hydration mismatch error due to `Math.random()` values being different between server-side rendering (SSR) and client-side rendering (CSR). This is a common Next.js issue when using random values in components.

## Root Cause
The animated particles in the AppLoader component used `Math.random()` to generate:
- Particle positions (`left` and `top` percentages)
- Animation delays and durations

Since `Math.random()` produces different values on the server vs. client, React detected a mismatch during hydration.

## Solution Implemented

### 1. Client-Side Only Rendering
Added an `isClient` state that only becomes `true` after the component mounts on the client:

```typescript
const [isClient, setIsClient] = useState(false)

useEffect(() => {
  setIsClient(true)
}, [])
```

### 2. Deterministic Particle Generation
Replaced `Math.random()` with a deterministic seeded random function:

```typescript
const particlePositions = Array.from({ length: 50 }, (_, i) => {
  const seed = i * 12345
  const x = ((seed * 9301 + 49297) % 233280) / 233280 * 100
  const y = ((seed * 9301 + 49297 + 1000) % 233280) / 233280 * 100
  // ... etc
})
```

### 3. Conditional Rendering
Only render animated elements when `isClient` is true:

```jsx
{isClient && (
  <div className="absolute inset-0">
    {particlePositions.map((particle, i) => (
      // ... particle JSX
    ))}
  </div>
)}
```

## Benefits

1. **No Hydration Errors**: Server and client render the same initial HTML
2. **Consistent Animations**: Particles appear in the same positions every time
3. **Better Performance**: No layout shifts during hydration
4. **Graceful Degradation**: Works even if JavaScript is disabled initially

## Result
The app now loads without hydration errors and the loading screen displays properly with smooth animations.