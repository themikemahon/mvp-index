# Globe Components

## ZoomController

The `ZoomController` component manages zoom level transitions and switches between heat map and pixel visualization modes based on camera distance from the globe.

### Features

- **Automatic Mode Switching**: Transitions between heat map (global view) and pixel (regional detail) modes based on zoom level
- **Smooth Animations**: Uses easing functions for smooth transitions between visualization modes
- **Configurable Callbacks**: Provides callbacks for zoom changes and visualization mode changes
- **Distance-Based Logic**: Calculates appropriate visualization mode based on camera distance

### Zoom Thresholds

- **Distance ≥ 12**: Full heat map mode (global view)
- **Distance 8-12**: Transition zone with smooth interpolation
- **Distance ≤ 8**: Full pixel mode (regional detail)

### Usage

```tsx
import { ZoomController } from '@/components/globe'

<ZoomController
  onZoomChange={(zoomLevel, progress) => {
    console.log('Zoom level:', zoomLevel)
  }}
  onVisualizationModeChange={(mode, progress) => {
    console.log('Visualization mode:', mode, 'Progress:', progress)
  }}
>
  {/* Your 3D scene components */}
</ZoomController>
```

### Hook

The `useZoomController` hook provides access to the current zoom state:

```tsx
const { distance, mode, progress, isTransitioning } = useZoomController()
```

## VisualizationModeManager

The `VisualizationModeManager` component handles the rendering of data points in either heat map or pixel mode, with smooth transitions between them.

### Features

- **Heat Map Rendering**: Generates dynamic heat map textures from data points
- **Pixel Rendering**: Renders individual glowing pixels for each data point
- **Transition Effects**: Displays intermediate particles during mode transitions
- **Color Coding**: Uses red/orange/yellow for threats based on severity

### Usage

```tsx
import { VisualizationModeManager } from '@/components/globe'

<VisualizationModeManager
  mode="heatmap" // or "pixels"
  transitionProgress={0.5} // 0 = full heatmap, 1 = full pixels
  dataPoints={[
    {
      id: '1',
      coordinates: { latitude: 40.7128, longitude: -74.0060 },
      severity: 8,
      threatType: 'vulnerability'
    }
  ]}
/>
```

## Integration

The `GlobeRenderer` component integrates both the `ZoomController` and `VisualizationModeManager` to provide a complete zoom-based visualization system:

```tsx
import { GlobeRenderer } from '@/components/globe'

<GlobeRenderer
  dataPoints={sampleDataPoints}
  className="w-full h-full"
/>
```

## Requirements Validation

This implementation satisfies:

- **Requirement 4.1**: Heat map visualization at global zoom levels
- **Requirement 4.2**: Individual pixel visualization at regional detail levels
- Smooth transitions between visualization modes
- Automatic mode switching based on camera distance
