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


## Buy Me a Coffee

The app includes a **Support the project** button in the toolbar. Before distributing the app, edit `src/app.js` and replace `YOUR_USERNAME` in `BUY_ME_A_COFFEE_URL` with your Buy Me a Coffee username.

## Windows installer and GitHub releases

The project is configured for Electron Builder and includes a GitHub Actions workflow at `.github/workflows/build-windows.yml`. The workflow builds the Windows `.exe` on GitHub's Windows runner when you push a version tag such as `v0.2.0`.

To create a release:

```bash
git add .
git commit -m "Prepare v0.2.0 release"
git push
git tag v0.2.0
git push origin v0.2.0
```

GitHub Actions will build the installer and attach the `.exe` to the GitHub Release.
