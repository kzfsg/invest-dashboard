# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production (runs TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint on the codebase
- `npm run preview` - Preview production build locally

### Testing
No test framework is currently configured. To add tests, check with the user first.

## Project Architecture

### High-Level Overview
This is a React TypeScript investment dashboard that displays National Financial Conditions Index (NFCI) data with sophisticated visual backgrounds. The app combines financial data visualization with WebGL-based animations in a glassmorphic UI design.

### Core Architecture Patterns

#### Data Acquisition Pipeline
The application uses a multi-stage data pipeline:
1. **External Data Sources**: Chicago Fed NFCI data and MacroMicro chart APIs
2. **Scraping Layer**: Playwright/Puppeteer scripts in `/screenshotScripts/` for automated data collection
3. **Processing Layer**: HTML parsing utilities in `/src/utils/` convert raw data to TypeScript interfaces
4. **Presentation Layer**: React components consume processed data via HTTP requests

#### Component Organization
- **Background System**: Dual animated backgrounds (`/src/components/background/`) using Three.js (Silk) and OGL (Aurora)
- **Data Components**: Chart and table components (`/src/components/charts/`) for financial data visualization
- **UI Components**: Navigation and overlay components with CSS Modules
- **Animation System**: Coordinated loading states and smooth transitions between themes

#### State Management
- Component-level state management using React hooks
- Theme switching between Silk/Aurora backgrounds
- No global state management library (Redux, Zustand, etc.)

### Key Technical Decisions

#### Styling Approach
- **CSS Modules** for scoped component styles (Navbar)
- **Global CSS** for app-wide glassmorphic design patterns
- **Component-specific CSS** for specialized visual effects
- Heavy use of `backdrop-filter: blur()` for glassmorphic effects

#### 3D Graphics Stack
- **Three.js + React Three Fiber**: Silk background with custom shaders
- **OGL (OpenGL library)**: Aurora background with vertex/fragment shaders
- **Custom shader implementations**: Noise-based procedural animations

#### Data Visualization
- **Highcharts** for financial charting (configured but not actively used in core components)
- **Custom HTML table parsing** for NFCI data display
- **Responsive table design** with horizontal scrolling and sticky headers

## File Structure Patterns

### Source Code Organization
- `/src/components/` - All React components, organized by feature
- `/src/utils/` - Utility functions for data processing
- `/src/types/` - TypeScript type definitions (currently empty, types defined inline)
- `/src/assets/` - Static assets and images

### Data and Scripts
- `/screenshotScripts/` - Automated data collection scripts
- `/screenshotScripts/nfci_html_extracts/` - Processed HTML data files
- `/currentScreenshots/` - Visual snapshots of data sources
- `/old models/` - Legacy scraping approaches

## Critical Dependencies

### Core Framework
- React 19.1.0 with TypeScript
- Vite 6.3.5 for build tooling
- Node.js ES modules (`"type": "module"` in package.json)

### Graphics and Animation
- `three` + `@react-three/fiber` for 3D graphics
- `ogl` for lightweight WebGL operations
- Custom shader implementations for procedural animations

### Data and Automation
- `playwright` for modern browser automation
- `cheerio` for server-side HTML parsing
- `highcharts` + `highcharts-react-official` for charting

## Development Workflow

### Adding New Components
1. Create component directory under `/src/components/`
2. Use either CSS Modules (`.module.css`) or component-specific CSS
3. Export from `index.tsx` within the component directory
4. Follow existing TypeScript patterns with inline type definitions

### Data Integration
1. HTML data files should be placed in `/screenshotScripts/nfci_html_extracts/`
2. Use `parseTableData.ts` utility for structured data extraction
3. Components should fetch data via HTTP and handle loading/error states
4. Follow the pattern in `NFCIDataTable.tsx` for data component structure

### Background System
- New background effects should extend the theme toggle system in `App.tsx`
- Use either Three.js (for complex 3D) or OGL (for performance-critical graphics)
- Maintain the glassmorphic design language with semi-transparent overlays

## Alias Configuration
- `@/` maps to `/src/` directory (configured in `vite.config.ts`)

## Browser Support
- Modern browsers supporting ES2020+ features
- WebGL 1.0+ required for background animations
- Responsive design targeting mobile-first approach