import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import {
  ConnectionLineType,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  reconnectEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ExecutionDryRunModal } from "@/components/ExecutionDryRunModal";
import { Inspector } from "@/components/Inspector";
import { PanelResizeHandle } from "@/components/PanelResizeHandle";
import {
  AudienceNode,
  EmailNode,
  EndNode,
  EventNode,
  StartNode,
} from "@/components/nodes/journeyNodes";
import { Palette } from "@/components/palette/Palette";
import {
  defaultJourney,
  parseJourney,
  serializeJourney,
  toJourneyDocument,
  type JourneyDocument,
  type JourneyNodeData,
  type JourneyNodeType,
} from "@/lib/journeySchema";
import { JourneyValidationProvider } from "@/context/JourneyValidationContext";
import { buildPublishBundle, serializePublishBundle } from "@/lib/publishBundle";
import { validateJourney, type JourneyValidationResult } from "@/lib/journeyValidation";
import { simulateJourney } from "@/lib/simulateJourney";
import {
  INSPECTOR_PANEL,
  PALETTE_PANEL,
  clampWidth,
  loadPanelWidth,
  savePanelWidth,
} from "@/lib/panelWidths";
import {
  downloadJson,
  loadStoredJourneyOrDefault,
  readFileAsText,
  saveToLocalStorage,
} from "@/lib/storage";

const nodeTypes = {
  start: StartNode,
  audience: AudienceNode,
  event: EventNode,
  email: EmailNode,
  end: EndNode,
} satisfies NodeTypes;

function defaultData(type: JourneyNodeType): JourneyNodeData {
  switch (type) {
    case "start":
      return { label: "Start" };
    case "end":
      return { label: "End" };
    case "audience":
      return { label: "Audience", subtitle: "Who enters" };
    case "event":
      return {
        label: "Event",
        subtitle: "When it happens",
        eventKey: "event.name",
      };
    case "email":
      return {
        label: "Email",
        subtitle: "Send message",
        templateName: "welcome",
      };
    default:
      return { label: "Node" };
  }
}

function useDebouncedEffect(
  fn: () => void,
  deps: unknown[],
  ms: number,
): void {
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(t.current);
    t.current = setTimeout(fn, ms);
    return () => clearTimeout(t.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce bundle
  }, deps);
}

function ValidationStatusBanner({ v }: { v: JourneyValidationResult }) {
  if (v.isValid) {
    return (
      <div className="validation-banner validation-banner--ok" role="status">
        All checks passed. Dry run, Publish, and Export are allowed.
      </div>
    );
  }
  const nodeIssueCount = Object.entries(v.byNode).filter(
    ([, msgs]) => msgs.length > 0,
  ).length;
  return (
    <div className="validation-banner validation-banner--bad" role="alert">
      <strong>Fix issues below to enable Dry run &amp; Publish.</strong> Export is
      blocked until validation passes.
      {v.global.length > 0 ? (
        <ul>
          {v.global.map((g, i) => (
            <li key={`${i}-${g.slice(0, 24)}`}>{g}</li>
          ))}
        </ul>
      ) : null}
      {nodeIssueCount > 0 ? (
        <p>
          {nodeIssueCount} node(s) have errors (red outline). Hover a node for
          details.
        </p>
      ) : null}
    </div>
  );
}

function FlowCanvas({
  initialDoc,
  journeyName,
  setJourneyName,
  error,
  setError,
}: {
  initialDoc: JourneyDocument;
  journeyName: string;
  setJourneyName: (s: string) => void;
  error: string | null;
  setError: (s: string | null) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<JourneyNodeData>>(
    initialDoc.nodes,
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialDoc.edges);
  const {
    screenToFlowPosition,
    setViewport,
    getViewport,
    zoomIn,
    zoomOut,
    fitView,
  } = useReactFlow();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = nodes.find((n) => n.id === selectedId) ?? null;
  const [viewTick, setViewTick] = useState(0);
  const [simulation, setSimulation] = useState<
    | { kind: "success"; path: string; warnings: string[] }
    | { kind: "error"; message: string }
    | null
  >(null);
  const [dryRunModal, setDryRunModal] = useState<{
    steps: { id: string; label: string; type: string }[];
    warnings: string[];
  } | null>(null);
  const [dryRunError, setDryRunError] = useState<string | null>(null);

  const [paletteWidth, setPaletteWidth] = useState(() =>
    loadPanelWidth(
      PALETTE_PANEL.storageKey,
      PALETTE_PANEL.default,
      PALETTE_PANEL.min,
      PALETTE_PANEL.max,
    ),
  );
  const [inspectorWidth, setInspectorWidth] = useState(() =>
    loadPanelWidth(
      INSPECTOR_PANEL.storageKey,
      INSPECTOR_PANEL.default,
      INSPECTOR_PANEL.min,
      INSPECTOR_PANEL.max,
    ),
  );

  useEffect(() => {
    savePanelWidth(PALETTE_PANEL.storageKey, paletteWidth);
  }, [paletteWidth]);

  useEffect(() => {
    savePanelWidth(INSPECTOR_PANEL.storageKey, inspectorWidth);
  }, [inspectorWidth]);

  const onPaletteResizeDelta = useCallback((deltaX: number) => {
    setPaletteWidth((w) =>
      clampWidth(w + deltaX, PALETTE_PANEL.min, PALETTE_PANEL.max),
    );
  }, []);

  const onInspectorResizeDelta = useCallback((deltaX: number) => {
    setInspectorWidth((w) =>
      clampWidth(w - deltaX, INSPECTOR_PANEL.min, INSPECTOR_PANEL.max),
    );
  }, []);

  const validation = useMemo(
    () => validateJourney(nodes, edges),
    [nodes, edges],
  );

  useEffect(() => {
    if (
      validation.isValid &&
      error === "Resolve all validation issues before exporting."
    ) {
      setError(null);
    }
  }, [validation.isValid, error, setError]);

  useDebouncedEffect(
    () => {
      const doc = toJourneyDocument(
        nodes,
        edges,
        {
          name: journeyName,
          updatedAt: new Date().toISOString(),
        },
        getViewport(),
      );
      saveToLocalStorage(doc);
    },
    [nodes, edges, journeyName, viewTick],
    450,
  );

  useEffect(() => {
    if (initialDoc.viewport) {
      void setViewport(initialDoc.viewport);
    }
  }, [initialDoc.viewport, setViewport]);

  const applyDocument = useCallback(
    (doc: JourneyDocument) => {
      setJourneyName(doc.meta?.name ?? "Untitled journey");
      setNodes(doc.nodes);
      setEdges(doc.edges);
      if (doc.viewport) {
        void setViewport(doc.viewport);
      }
      setSelectedId(null);
      setError(null);
      setSimulation(null);
      setDryRunModal(null);
      setDryRunError(null);
    },
    [setEdges, setError, setJourneyName, setNodes, setViewport],
  );

  const onConnect = useCallback(
    (c: Connection) => setEdges((eds) => addEdge(c, eds)),
    [setEdges],
  );

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
    },
    [setEdges],
  );

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const type = e.dataTransfer.getData(
        "application/reactflow",
      ) as JourneyNodeType;
      if (!type || !(type in nodeTypes)) return;
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setNodes((nds) =>
        nds.concat({
          id: crypto.randomUUID(),
          type,
          position: pos,
          data: defaultData(type),
        }),
      );
    },
    [screenToFlowPosition, setNodes],
  );

  const onNodeData = useCallback(
    (id: string, patch: Partial<JourneyNodeData>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...patch } } : n,
        ),
      );
    },
    [setNodes],
  );

  const closeInspector = useCallback(() => {
    setSelectedId(null);
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
  }, [setNodes]);

  const saveJourneyToStorage = useCallback(() => {
    const doc = toJourneyDocument(
      nodes,
      edges,
      {
        name: journeyName,
        updatedAt: new Date().toISOString(),
      },
      getViewport(),
    );
    saveToLocalStorage(doc);
  }, [nodes, edges, journeyName, getViewport]);

  const exportFile = () => {
    if (!validation.isValid) {
      setError("Resolve all validation issues before exporting.");
      return;
    }
    setError(null);
    const doc = toJourneyDocument(
      nodes,
      edges,
      {
        name: journeyName,
        updatedAt: new Date().toISOString(),
      },
      getViewport(),
    );
    const safe =
      journeyName.replace(/[^\w\d-]+/g, "-").replace(/^-|-$/g, "") ||
      "journey";
    downloadJson(`${safe}.json`, serializeJourney(doc));
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      applyDocument(parseJourney(JSON.parse(text)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON file");
    }
  };

  const newJourney = () => {
    setSimulation(null);
    setDryRunModal(null);
    setDryRunError(null);
    applyDocument(defaultJourney());
  };

  const runSimulation = () => {
    const result = simulateJourney(nodes, edges);
    if (result.ok) {
      const path = result.steps.map((s) => s.label).join(" → ");
      setSimulation({ kind: "success", path, warnings: result.warnings });
      setError(null);
    } else {
      setSimulation({ kind: "error", message: result.error });
    }
  };

  const runDryRun = () => {
    if (!validation.isValid) return;
    const result = simulateJourney(nodes, edges);
    if (result.ok) {
      setDryRunError(null);
      setDryRunModal({ steps: result.steps, warnings: result.warnings });
    } else {
      setDryRunModal(null);
      setDryRunError(result.error);
    }
  };

  const publishBundle = () => {
    if (!validation.isValid) return;
    const doc = toJourneyDocument(
      nodes,
      edges,
      {
        name: journeyName,
        updatedAt: new Date().toISOString(),
      },
      getViewport(),
    );
    const bundle = buildPublishBundle(doc);
    const safe =
      journeyName.replace(/[^\w\d-]+/g, "-").replace(/^-|-$/g, "") ||
      "journey";
    downloadJson(`${safe}-publish.json`, serializePublishBundle(bundle));
  };

  return (
    <JourneyValidationProvider value={validation}>
      <>
      <header className="app-toolbar">
        <h1>Journey builder</h1>
        <input
          className="journey-name"
          aria-label="Journey name"
          value={journeyName}
          onChange={(e) => setJourneyName(e.target.value)}
        />
        <button type="button" onClick={newJourney}>
          New
        </button>
        <label className="file-btn">
          Import
          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => void importFile(e.target.files?.[0])}
          />
        </label>
        <button
          type="button"
          onClick={exportFile}
          disabled={!validation.isValid}
          title={
            validation.isValid
              ? "Export journey JSON"
              : "Fix validation issues before export"
          }
        >
          Export
        </button>
        <button type="button" onClick={runSimulation} title="Walk Start → End in the graph">
          Simulate path
        </button>
        <button
          type="button"
          onClick={runDryRun}
          disabled={!validation.isValid}
          title={
            validation.isValid
              ? "Run an animated dry run (no external systems)"
              : "Fix validation issues first"
          }
        >
          Dry run
        </button>
        <button
          type="button"
          onClick={publishBundle}
          disabled={!validation.isValid}
          title={
            validation.isValid
              ? "Download publish bundle (journey + n8n stub) for deployment"
              : "Fix validation issues first"
          }
        >
          Publish
        </button>
        <div className="toolbar-zoom" role="group" aria-label="Canvas zoom">
          <button
            type="button"
            onClick={() => zoomOut({ duration: 200 })}
            title="Zoom out"
            aria-label="Zoom out canvas"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => void fitView({ padding: 0.2, duration: 200 })}
            title="Zoom to fit journey in view"
            aria-label="Zoom to fit journey in view"
          >
            Zoom
          </button>
          <button
            type="button"
            onClick={() => zoomIn({ duration: 200 })}
            title="Zoom in"
            aria-label="Zoom in canvas"
          >
            +
          </button>
        </div>
      </header>
      <ValidationStatusBanner v={validation} />
      {error ? (
        <div className="error-banner" role="alert">
          {error}
        </div>
      ) : null}
      {simulation?.kind === "success" ? (
        <div className="sim-banner sim-banner--success" role="status">
          <strong>Simulated path:</strong> {simulation.path}
          {simulation.warnings.length > 0 ? (
            <ul className="sim-warnings">
              {simulation.warnings.map((w, i) => (
                <li key={`${i}-${w.slice(0, 24)}`}>{w}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {simulation?.kind === "error" ? (
        <div className="error-banner" role="alert">
          {simulation.message}
        </div>
      ) : null}
      {dryRunError ? (
        <div className="error-banner" role="alert">
          Dry run: {dryRunError}
        </div>
      ) : null}
      <ExecutionDryRunModal
        open={dryRunModal !== null}
        onClose={() => setDryRunModal(null)}
        steps={dryRunModal?.steps ?? []}
        warnings={dryRunModal?.warnings ?? []}
      />
      <div className="app-body">
        <Palette width={paletteWidth} />
        <PanelResizeHandle
          ariaLabel="Resize palette"
          onResizeDelta={onPaletteResizeDelta}
        />
        <div className="canvas-wrap">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
            edgesReconnectable
            onMoveEnd={() => setViewTick((t) => t + 1)}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            onSelectionChange={({ nodes: sel }) =>
              setSelectedId(sel[0]?.id ?? null)
            }
            fitView
            minZoom={0.08}
            maxZoom={2.5}
            connectionLineType={ConnectionLineType.Bezier}
            snapToGrid
            snapGrid={[12, 12]}
            defaultEdgeOptions={{
              animated: true,
              /* Bezier curves — smooth “free-flow” links vs step/smoothstep */
              type: "default",
              reconnectable: true,
            }}
          >
            <Controls showZoom showFitView showInteractive={false} />
            <MiniMap zoomable pannable />
          </ReactFlow>
        </div>
        {selected ? (
          <>
            <PanelResizeHandle
              ariaLabel="Resize properties panel"
              onResizeDelta={onInspectorResizeDelta}
            />
            <Inspector
              selected={selected}
              onChange={onNodeData}
              validationMessages={
                validation.byNode[selected.id] ?? []
              }
              onClose={closeInspector}
              onSave={saveJourneyToStorage}
              panelWidth={inspectorWidth}
            />
          </>
        ) : null}
      </div>
      </>
    </JourneyValidationProvider>
  );
}

export function JourneyBuilder() {
  const initialDoc = useMemo(() => loadStoredJourneyOrDefault(), []);
  const [journeyName, setJourneyName] = useState(
    () => initialDoc.meta?.name ?? "Untitled journey",
  );
  const [error, setError] = useState<string | null>(null);
  return (
    <ReactFlowProvider>
      <div className="app-shell">
        <FlowCanvas
          initialDoc={initialDoc}
          journeyName={journeyName}
          setJourneyName={setJourneyName}
          error={error}
          setError={setError}
        />
      </div>
    </ReactFlowProvider>
  );
}
