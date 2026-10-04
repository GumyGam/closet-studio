# Closet Studio Full Pro — Design Spec
*Date: 2026-10-04 | Status: draft for review | Decisions so far: DIY-first usability + full-pro catalog, all-at-once single version, clean v2 next to v1, core model first*

## 0. What you asked for (in plain words)
One full version, not lite vs pro. Every closet option available in real life, with best UI, best 3D, best settings. DIY-easy like IKEA PAX on the surface, factory-correct underneath.

> Safety: we keep current `main` working. New work happens in `v2-pro` branch/folder. No delete until v2 is proven. This is a 🚨 LARGE CHANGE — we design first, code only after you approve this file.

## 1. Core model (APPROVED Section 1)
- Canonical store in **mm only**. One converter at 3D edge: `MM_TO_M = 0.001`. Think: mm for humans, meters for GPU. Fixes current 1000x bug in `ClosetScene.tsx:98-119`.
- Joinery fix (carries over `dimensionsForPart` with patch): sides full-height, top/bottom fit between (`width-36`). Boards 18mm, back 9mm, door 20mm, shelf depth `D-25`, gaps 2-3mm. Back `W-36 x H-36`.
- Finish identity: stable IDs `oak/walnut/white/graphite` + glass/mirror/linen/concrete in full catalog (not hex). Migrate old files that stored hex like `#b9966c`. Grain follows longest edge, edgeband matches face.
- History: Zustand + zundo `limit 50`, partialize out transient (selection, camera). Persist to localStorage + share-link URL. Keep 80-snapshot spirit but lighter.
- Languages: en/he (RTL)/zh/es for UI. CAD/DXF stays English + mm. Add ~15 missing keys (door position, breadcrumb, footer, PDF headings, PNG overlay, production notes).

## 2. Full real-life catalog (Section 2 — you asked ALL)
### Carcass
- Single bay W300-3600 H300-3000 D200-1200 (keep v1 ranges), multi-bay side-by-side, corner L, U-shape, tall split over 2400 (center support), plinth/toe-kick 60-100mm, crown/pelmet, side cover panels, back full/half/none, sloped-ceiling cut, adjustable feet.

### Doors (all variants)
- Open/no doors, double hinged, single hinged L/R, sliding bypass 2-door + 3-door, bifold, glass-front, mirror-front, louvered/panel style flag. Each with swing/clearance rule (hinged needs 500mm front clearance, sliding needs track depth +25mm), soft-close flag, handle cutout.

### Drawers + interior (all variants)
- Drawers: standard 140-180H, deep 250-300H, file, jewelry insert, dividers, felt, soft-close, push-to-open. Slides: side-mount / undermount / tip-on.
- Hang: single long (H1400+ D500+), double hang (H1500+ D500+), valet pull-out, tie/belt pull-out, trouser pull-out.
- Shelves: fixed + adjustable (32mm holes), glass shelves, shoe flat/tilted/pull-out (shoe needs D350+), baskets wire/canvas, hamper pull-out, safe box, interior mirror, LED strip/puck + motion sensor, ironing fold-out.
- Rods: round chrome/wood, oval, length = bay W minus hardware.

### Hardware + materials
- Hinges Blum/Hettich 110/165 deg + soft-close, handles: bar/knob/recessed/push, 32mm system holes, shelf pins, rod supports.
- Materials: melamine, plywood, MDF lacquer, solid oak/walnut, glass, mirror. Edge-banding per edge (0/0.8/2mm) + finished-vs-cut size in cut list.

## 3. 2D + 3D (full pro)
- 2D plan editor: room rect + walls + doors/windows/obstacles (overrides earlier no-room vote — full real-life needs fit checks), drag modules with snap 10/50mm, clamp-to-room, block overlaps, rule engine on drag-end.
- 3D premium: R3F9 + Drei10 keep, RoomEnvironment PMREM + 1 key light + ContactShadows 512, PBR wood sets, `frameloop=demand`, `dpr [1,2]`, InstancedMesh shelves, exploded lerp, camera presets front/iso/top, dimension lines + Html labels, click-select syncs 2D<->3D.
- Keep stack: React19 TS Vite, add Tailwind v4 + shadcn `rtl:true` + i18next + DirectionProvider, Noto Sans Hebrew.

## 4. Validation (pro moat)
- Hard blocks: out-of-range, overlap, door swing clash, rod too short, drawer won't open (front clearance), hang depth <450.
- Soft warnings (keep v1 4 + add): tall >2400 split, wide >1000 sag, shallow <300 hangers won't fit, no doors clearance note, sloped ceiling clash, load >15kg/shelf, LED needs power.
- Show all warnings in list (v1 only showed first), each with fix button (add divider, reduce span, add doors).

## 5. Exports (fix 6 + add pro)
- Fix: PNG (render-then-capture, real W/H/D overlay, translated), PDF (real part dims not carcass, multi-page tables via @react-pdf, translated headings + Hebrew RTL), CSV (names not hex, qty>0 only, columns PartID/L/W/T/Qty/Material/Grain/Edgeband4/FinishedVsCut), JSON project + production (stable IDs), GLB (correct meters scale, keep textures, embed package in userData).
- Add: copy share-link (URL holds config), hardware schedule CSV (SKU/qty/drill map), DXF per panel (outline + 32mm holes on layers, mm units via dxf-writer).
- Reuse from audit: `isClosetProject`, `isClosetProjectPackage`, `getWarnings` (extend), `buildCutList` (fix names/material/qty), `dimensionsForPart` (fix corners), `copyProject`, `translate` dict, CSV quoting + BOM pattern, save/restore accepting bare project.

## 6. Data flow + errors + testing
- Flow: single Zustand store (source of truth) -> 2D editor mutates -> validator runs -> 3D derives view -> BOM derives live. 3D never writes directly.
- Errors: unit clamp + toast (Hebrew/EN/etc), autosave fail -> prompt export backup, GLB import missing metadata -> invalid file notice, texture fail -> flat color fallback, PDF overflow -> paginate.
- Testing: Vitest for units/validation/cutlist, Playwright for funnel (add module -> resize -> export), visual check of 2.2m box next to 1.8m grid (verify-before-claim: no win without screenshot/PDF/CSV artifacts).

## 7. Open risks
- Scope is ~4x DIY core. All-at-once = longer before usable, more bugs. Mitigation: build internally in order 1->6 above, demo each slice, still ship as one version.
- Textures need licensed seamless PBR sets. Decide buy vs procedural fallback.
- PDF Hebrew RTL with tables needs @react-pdf verification early.
- GLB texture bloat (PNG re-encode 5x) — cap texture size, test round-trip early.
- Room re-added: confirms full real-life overrides Q3 no-room vote. Say so explicitly in review.

## 8. Done looks like (v2 single version)
Measure room -> inventory -> drag modules in 2D -> see premium 3D with dimensions -> pick real finishes/hardware/lighting -> live BOM + price estimate -> export PDF/CSV/DXF/GLB/PNG/link that a carpenter accepts. No placeholder text, no hex materials, no 1000x scale, works EN/HE/ZH/ES + mobile.
