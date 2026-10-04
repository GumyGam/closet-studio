# Forme Closet Studio — Product Brief

## Product we decided to build

Forme Closet Studio is an online, browser-based tool for designing a custom closet from an empty starting point through a reviewable, production-oriented design. The core experience is a live 3D closet configurator: the user enters overall measurements, chooses and edits individual parts, sees the result immediately, and can inspect the materials and assembly from different angles.

The first deliverable is a usable web app, hosted publicly at <https://gumygam.github.io/closet-studio/> in the `GumyGam/closet-studio` repository. The agreed implementation stack is React, TypeScript, and Three.js. The site is a public GitHub Pages app; project autosave is currently local to the browser, not tied to a user account or cloud sync.

## What the user asked it to do

- Let someone create a closet from scratch and keep control from the initial dimensions through the finished design.
- Provide an interactive 3D viewer that makes the selected materials and overall closet easy to inspect.
- Let the user set the whole closet's width, height, and depth, select components, and edit a selected part's own measurements. Where feasible in the interaction, dimensions should be editable directly on the selected object using dimension labels, arrows, or controls as well as in the settings panel.
- Make it possible to configure parts of the closet rather than limiting the user to one fixed cabinet shape. The design should grow toward useful closet options such as panels, shelves, doors, and other interior components.
- Provide assembly/exploded-view animation controls, including a slider, to communicate how the design fits together.
- Explain or flag choices that are impractical or need attention instead of silently allowing a design that may not work. Feasibility feedback should cover measurable manufacturing or usability concerns and help the user understand what to change.
- Keep the tool approachable and easy to use without hiding meaningful design controls.
- Include English, Hebrew, Chinese, and Spanish. Hebrew needs right-to-left layout support.
- Make the design shareable with images and information useful for discussing or preparing it for production.
- Save the work so the user does not have to start over. Exported 3D/project files should carry metadata and all settings needed to import the project into a fresh page and restore it as it was created, including its editing history.

## Agreed initial defaults and outputs

- Metric dimensions, with mm and cm display choices.
- Initial board assumptions: 18 mm panels and an assumed 9 mm back panel. These are starting assumptions, not a manufacturing standard; users and production shops must be able to confirm or change the rules as the product grows.
- Prioritized outputs: dimensioned PNG, printable PDF drawings, CSV cut list, editable JSON project/specification, and a 3D model with metadata. The implemented 3D format is binary glTF (`.glb`).
- Opening an exported project on a new browser/device should restore the design settings and saved undo/redo history, rather than merely displaying a static mesh. GLB metadata is useful for this round trip; keep editable JSON as a fallback for tools that discard glTF extras.
- The initial app stores a bounded history of up to 80 snapshots in browser storage and in project exports. Automatic account-based synchronization was not part of the implemented first release.

## Intended visual and interaction direction

The app should feel like a focused design studio: calm, polished, precise, and easy to scan rather than like a dense CAD workstation. The current visual direction uses a warm off-white 3D workspace, white settings surfaces, restrained grey dividers and labels, and muted natural-wood accents. Use clear typography, compact but legible measurement controls, and familiar icons. Keep the closet itself prominent, with room to orbit, zoom, inspect surfaces, and show its dimensions.

The workspace should make the main tasks apparent:

1. A persistent settings area for overall dimensions, structure/interior options, finishes, selected part, language, and measurement units.
2. A large interactive 3D viewport with overall dimension cues, orbit/zoom, part selection, and door/assembly previews.
3. A visible assembly slider that makes the transition from assembled to exploded easy to understand and control.
4. An export area for images, editable/restorable project data, production information, and 3D output.
5. Clear feasibility feedback that distinguishes a warning from a design that needs no current attention.

Selecting a component should keep it visually identifiable and expose that component's measurements and relevant settings. Editing a measurement should immediately update the 3D view. The wider product vision includes direct manipulation of dimension arrows/labels in or beside the model as an alternative to typing measurements in the panel.

## Feasibility and production intent

The tool should prevent avoidable mistakes where possible and explain constraints in context. The initial prototype has basic reminders for tall units, wide shelves, shallow depth, and missing doors. Those reminders are guidance, not structural calculations or a guarantee that a design is safe, manufacturable, or code-compliant.

Production-facing exports should grow to describe a complete, reviewable build: dimensions per panel, quantity, material/finish, board thickness, and ultimately hardware, edge treatment, joinery, clearances, and shop-specific notes. The current PDF is a preliminary front/side drawing plus cut list, CSV contains panel dimensions and quantities, and JSON contains the project/specification. A manufacturer must verify construction details and site measurements before cutting.

## Current prototype versus the full product vision

The live first version includes an orbitable 3D closet, overall dimensions, selected-part dimension inputs, shelves and hinged doors, four finish choices, a slider-controlled exploded preview, basic feasibility reminders, the four requested languages, and PNG/PDF/CSV/JSON/GLB exports. It saves locally and can restore editable JSON or a GLB containing the project package and history.

This is a foundation, not yet the complete “all closet options” production system. In particular, sophisticated arbitrary assemblies, hanging rails/drawers/accessories, dimension arrows manipulated directly in the 3D scene, configurable manufacturing-rule profiles, account sign-in/cloud project library, and manufacturer-certified engineering checks remain future work. Continue the product toward the user's goal of a very capable closet tool while keeping each editing step understandable and surfacing the practical limits of the chosen design.
