# Forme Closet Studio

A browser-based, parametric closet configurator built with React, TypeScript, Three.js, and React Three Fiber.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`.

## Project backup and restore

The configurator saves the current project and up to 80 undo/redo snapshots in browser local storage. Use **Export → Editable JSON project** to make a portable backup, or **Export → 3D project · GLB** to download a binary glTF model with the same project package embedded as glTF metadata. On another browser or device, open the app and use **Open project** to import either `.json` or `.glb`; the current design, part overrides, material, display settings, assembly state, and saved editing history are restored.

The GLB geometry is independently viewable in compatible glTF software. Project settings and history are stored in its `formeProject` metadata. The editable JSON export is also available if a downstream tool strips glTF extras.

## Current design scope

- Metric closet dimensions with mm/cm display, editable carcass and part dimensions, shelves, hinged doors, finish choices, orbit/zoom, and an exploded assembly slider.
- English, Hebrew (RTL), Chinese, and Spanish interface.
- Feasibility reminders for tall units, wide shelves, shallow depth, and missing doors.
- PNG preview with overall dimensions; PDF front/side elevations and a cut list; CSV cut list; JSON project/production packages; GLB model with embedded restorable project/history.
- Initial production assumptions: 18 mm boards and 9 mm back panel. Verify joinery, hardware, edge banding, load ratings, tolerances, and site clearances with the manufacturer before ordering or cutting.

Automatic saving is local to the current browser and device. Export the project package to transfer it elsewhere. This prototype does not sync projects to an account or provide manufacturer-certified structural validation.
