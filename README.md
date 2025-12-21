# Cyber Threat Globe

A flagship 3D interactive web application that visualizes global cyber threat and financial vulnerability intelligence on an interactive globe. Built with Next.js 14, Three.js, and React Three Fiber.

## Features

- 🌍 Interactive 3D globe visualization
- 🔍 Natural language threat queries
- 🎯 Multi-criteria filtering system
- ✨ Digital filament effects and animations
- 📊 Real-time data synchronization
- 🎨 Premium visual experience with WebGL rendering

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **3D Rendering**: Three.js with React Three Fiber
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Testing**: Vitest with React Testing Library
- **Property-Based Testing**: fast-check

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── globe/          # 3D globe components
│   └── ui/             # UI components
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── test/               # Test setup and utilities
```

## Development

This project follows a spec-driven development approach. See the `.kiro/specs/cyber-threat-globe/` directory for:

- `requirements.md` - Feature requirements and acceptance criteria
- `design.md` - Technical design and architecture
- `tasks.md` - Implementation task list

## Testing

The project uses a dual testing approach:

- **Unit Tests**: Specific examples and edge cases using Vitest
- **Property-Based Tests**: Universal properties using fast-check

Run tests with:
```bash
npm run test
```

## License

Private - Gen Digital Internal Project