# react-canvas-workflow

A **journey builder** web app: drag nodes from a palette onto a canvas, connect them, edit properties, validate the graph, simulate paths, and export or publish JSON. The UI is built with **React** and **React Flow** (@xyflow/react). Authoring happens entirely in this app; **n8n** is only a **planned runtime target** via a small stub compiler (see [n8n in this project](#n8n-in-this-project)).

---

## Tech stack

| Layer | Technology |
|--------|------------|
| UI | React 19, TypeScript |
| Graph / canvas | [@xyflow/react](https://reactflow.dev/) v12 (`ReactFlow`, nodes, edges, viewport, controls, minimap) |
| Build | Vite 6, `@vitejs/plugin-react` |
| Lint | ESLint 9, TypeScript ESLint, React Hooks plugin |

Runtime dependencies are intentionally minimal: **only** `react`, `react-dom`, and `@xyflow/react`. There is no router, global state library, or UI kit.

---

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build   # production build
npm run lint    # ESLint
```

---

## Project layout

```
src/
├── main.tsx                 # React root
├── App.tsx                  # Renders JourneyBuilder
├── JourneyBuilder.tsx       # Toolbar, FlowCanvas: palette | canvas | inspector, validation wiring
├── index.css                # App styles
├── components/
│   ├── palette/Palette.tsx  # Draggable node types
│   ├── nodes/journeyNodes.tsx  # Custom React Flow nodes (Start, Audience, Event, Email, End)
│   ├── Inspector.tsx        # Selected node property editor
│   ├── PanelResizeHandle.tsx # Resize palette / properties panels
│   ├── ExecutionDryRunModal.tsx
├── context/
│   └── JourneyValidationContext.tsx  # Shares validation result with node components
├── hooks/
│   └── useNodeValidation.ts   # Per-node messages from context (node outline ok/error)
└── lib/
    ├── journeySchema.ts       # Types, JSON parse/serialize, JourneyDocument
    ├── journeyValidation.ts   # Rules + reachability + simulation gate
    ├── simulateJourney.ts     # Path walk for “simulate” / dry run
    ├── publishBundle.ts       # Publish artifact: journey + n8n stub
    ├── adapters/n8n.ts        # Stub: journey → n8n-shaped JSON
    ├── storage.ts             # localStorage autosave, file import/export helpers
    └── panelWidths.ts         # Resizable panel widths persisted locally
```

---

## Main components (roles)

- **`JourneyBuilder`** — Wraps the app in `ReactFlowProvider`. Hosts the toolbar (journey name, New, Import, Export, Simulate path, Dry run, Publish) and **`FlowCanvas`**, which owns all canvas state.
- **`FlowCanvas`** (inside `JourneyBuilder.tsx`) — Holds `nodes` / `edges` via `useNodesState` / `useEdgesState`, selection, debounced autosave, import/export, simulation banners, and the dry-run modal. Wraps content in **`JourneyValidationProvider`** so custom nodes can read validation.
- **`Palette`** — Renders journey node types; drag uses `dataTransfer` with type `application/reactflow`. Drops are handled on the React Flow pane (`onDrop` / `onDragOver`) to create nodes at cursor position.
- **Custom nodes** (`journeyNodes.tsx`) — Map to `nodeTypes` for `start`, `audience`, `event`, `email`, `end`. Each uses **`useNodeValidation`** to show valid vs invalid styling.
- **`Inspector`** — Edits `data` for the selected node when something is selected; hidden when nothing is selected.
- **`PanelResizeHandle`** — Draggable separators between palette, canvas, and inspector; widths clamped and stored (see `lib/panelWidths.ts`).
- **`ExecutionDryRunModal`** — Modal listing simulated steps when validation passes and dry run runs.

---

## Data model

- **`JourneyDocument`** (`lib/journeySchema.ts`): versioned JSON with `meta` (name, updatedAt), `nodes` (React Flow nodes with `JourneyNodeData`), `edges`, optional `viewport`.
- **Node types**: `start`, `audience`, `event`, `email`, `end` — each has a `label`; optional fields include `subtitle`, `segmentHint`, `eventKey`, `templateName` depending on type.

The canvas is the source of truth while editing; snapshots go to **`toJourneyDocument`** for export, publish, and autosave.

---

## Execution flow (behavior)

1. **Authoring** — Users add nodes (palette drag or existing graph), connect edges (`onConnect`, `onReconnect`), pan/zoom. Viewport changes trigger debounced save.
2. **`validateJourney`** (`lib/journeyValidation.ts`) — Enforces:
   - Exactly one **Start** and one **End** node
   - Unique non-empty **labels**
   - Required fields per type (e.g. segment hint, event key, template name)
   - All nodes **reachable** from Start
   - If Start and End are unique, **`simulateJourney`** must complete successfully (single coherent path in the simulator’s sense)
3. **`simulateJourney`** (`lib/simulateJourney.ts`) — Walks from Start; at branches, sorts targets by id and follows the **first** (with warnings if multiple outgoing edges). Detects cycles and dead ends.
4. **Dry run** — When validation passes, opens **`ExecutionDryRunModal`** with the same simulation result (preview only; no external systems).
5. **Export** — Downloads journey JSON (`serializeJourney`), gated on full validity in the UI.
6. **Autosave** — `lib/storage.ts` writes the journey to `localStorage` under `journey-builder:last` (debounced).

---

## n8n in this project

**n8n is not installed or executed by this app.** It is modeled as a **future deployment/runtime**:

- **`lib/adapters/n8n.ts`** — Exports `journeyToN8nWorkflow(journey)`. Today this returns a **stub** object (minimal `name`, empty `nodes` / `connections`, `meta.template: "journey-to-n8n-stub"`). The intent is that a later **compiler** turns a `JourneyDocument` into real n8n workflow JSON while **authoring stays in React**.
- **`lib/publishBundle.ts`** — **Publish** builds a JSON bundle containing:
  - the full **`journey`** document, and
  - **`n8nWorkflow`** from `journeyToN8nWorkflow`.

So: **authoring** = this UI; **running in production** = envisioned as importing the published bundle into n8n (or similar) once the adapter is implemented — not using n8n’s own visual editor as the source of truth.

---

## Local storage keys

| Key | Purpose |
|-----|--------|
| `journey-builder:last` | Last autosaved journey JSON |
| `journey-builder:palette-width` | Palette panel width |
| `journey-builder:inspector-width` | Properties panel width |

---

## License

Private / project-specific — add a `LICENSE` file if you need to publish terms.
