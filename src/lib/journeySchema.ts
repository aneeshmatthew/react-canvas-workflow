import type { Edge, Node } from "@xyflow/react";

export const JOURNEY_VERSION = 1 as const;

export type JourneyNodeType = "start" | "audience" | "event" | "email" | "end";

export type JourneyNodeData = {
  label: string;
  subtitle?: string;
  segmentHint?: string;
  eventKey?: string;
  templateName?: string;
} & Record<string, unknown>;

export type JourneyDocument = {
  version: typeof JOURNEY_VERSION;
  meta?: { name?: string; updatedAt?: string };
  nodes: Node<JourneyNodeData>[];
  edges: Edge[];
  viewport?: { x: number; y: number; zoom: number };
};

export function defaultJourney(): JourneyDocument {
  return {
    version: JOURNEY_VERSION,
    meta: { name: "Untitled journey", updatedAt: new Date().toISOString() },
    nodes: [
      {
        id: "start-1",
        type: "start",
        position: { x: 120, y: 120 },
        data: { label: "Start" },
      },
    ],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}

export function parseJourney(raw: unknown): JourneyDocument {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid journey: not an object");
  }
  const o = raw as Record<string, unknown>;
  if (o.version !== JOURNEY_VERSION) {
    throw new Error(`Unsupported journey version: ${String(o.version)}`);
  }
  if (!Array.isArray(o.nodes)) {
    throw new Error("Invalid journey: nodes must be an array");
  }
  if (!Array.isArray(o.edges)) {
    throw new Error("Invalid journey: edges must be an array");
  }
  return {
    version: JOURNEY_VERSION,
    meta: o.meta as JourneyDocument["meta"],
    nodes: o.nodes as Node<JourneyNodeData>[],
    edges: o.edges as Edge[],
    viewport: o.viewport as JourneyDocument["viewport"],
  };
}

export function serializeJourney(doc: JourneyDocument): string {
  return JSON.stringify(
    {
      ...doc,
      meta: { ...doc.meta, updatedAt: new Date().toISOString() },
    },
    null,
    2,
  );
}

export function toJourneyDocument(
  nodes: Node<JourneyNodeData>[],
  edges: Edge[],
  meta?: JourneyDocument["meta"],
  viewport?: JourneyDocument["viewport"],
): JourneyDocument {
  return {
    version: JOURNEY_VERSION,
    meta,
    nodes,
    edges,
    viewport,
  };
}
