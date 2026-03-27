import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useNodeValidation } from "@/hooks/useNodeValidation";
import type { JourneyNodeData, JourneyNodeType } from "@/lib/journeySchema";

function Base({
  kind,
  title,
  subtitle,
  target,
  source,
  ok,
  validationTitle,
}: {
  kind: JourneyNodeType;
  title: string;
  subtitle?: string;
  target?: boolean;
  source?: boolean;
  ok: boolean;
  validationTitle: string;
}) {
  return (
    <div
      className={`journey-node journey-node--${kind} ${ok ? "journey-node--ok" : "journey-node--err"}`}
      title={validationTitle}
    >
      {target ? (
        <Handle type="target" position={Position.Left} id="in" />
      ) : null}
      <div className="journey-node__title">{title}</div>
      {subtitle ? <div className="journey-node__sub">{subtitle}</div> : null}
      {source ? (
        <Handle type="source" position={Position.Right} id="out" />
      ) : null}
    </div>
  );
}

function validationTooltip(ok: boolean, messages: string[]): string {
  if (ok) return "Valid";
  return messages.join("\n");
}

type Start = Node<JourneyNodeData, "start">;
type End = Node<JourneyNodeData, "end">;
type Audience = Node<JourneyNodeData, "audience">;
type Ev = Node<JourneyNodeData, "event">;
type Email = Node<JourneyNodeData, "email">;

export function StartNode(props: NodeProps<Start>) {
  const d = props.data;
  const { ok, messages } = useNodeValidation(props.id);
  return (
    <Base
      kind="start"
      title={d.label || "Start"}
      subtitle={d.subtitle}
      source
      ok={ok}
      validationTitle={validationTooltip(ok, messages)}
    />
  );
}

export function EndNode(props: NodeProps<End>) {
  const d = props.data;
  const { ok, messages } = useNodeValidation(props.id);
  return (
    <Base
      kind="end"
      title={d.label || "End"}
      subtitle={d.subtitle}
      target
      ok={ok}
      validationTitle={validationTooltip(ok, messages)}
    />
  );
}

export function AudienceNode(props: NodeProps<Audience>) {
  const d = props.data;
  const { ok, messages } = useNodeValidation(props.id);
  return (
    <Base
      kind="audience"
      title={d.label || "Audience"}
      subtitle={d.subtitle ?? d.segmentHint}
      target
      source
      ok={ok}
      validationTitle={validationTooltip(ok, messages)}
    />
  );
}

export function EventNode(props: NodeProps<Ev>) {
  const d = props.data;
  const { ok, messages } = useNodeValidation(props.id);
  return (
    <Base
      kind="event"
      title={d.label || "Event"}
      subtitle={d.subtitle ?? d.eventKey}
      target
      source
      ok={ok}
      validationTitle={validationTooltip(ok, messages)}
    />
  );
}

export function EmailNode(props: NodeProps<Email>) {
  const d = props.data;
  const { ok, messages } = useNodeValidation(props.id);
  return (
    <Base
      kind="email"
      title={d.label || "Email"}
      subtitle={d.subtitle ?? d.templateName}
      target
      source
      ok={ok}
      validationTitle={validationTooltip(ok, messages)}
    />
  );
}
