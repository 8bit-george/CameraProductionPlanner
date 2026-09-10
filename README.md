# Camera Production Planner

A local Electron desktop app for planning camera positions on a venue/stage/background image.

## Requirements

- Windows 10/11 64-bit
- Visual Studio Code
- Node.js LTS

## Run in development

Open this folder in VS Code, then open Terminal > New Terminal:

```powershell
npm install
npm start
```

## Build a Windows installer

```powershell
npm run dist
```

The installer will be created in the `dist` folder.

## Current features

- Import PNG/JPEG/WebP background
- Add, move and rotate camera markers
- Camera sidebar
- Camera descriptions
- Lens/notes and operator fields
- Edit/remove cameras
- Zoom
- PNG export at background resolution
- PDF export through the Windows print dialog

## Planned next improvements

- Save/load project files
- Better camera icons
- Camera numbering that remains stable after deletion
- Panning/zooming with mouse wheel
- Production title/date fields
- Shot type dropdowns
- Exported PDF with camera information
- Mac packaging
