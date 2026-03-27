import type { JourneyNodeType } from "@/lib/journeySchema";

const ITEMS: { type: JourneyNodeType; label: string }[] = [
  { type: "start", label: "Start" },
  { type: "audience", label: "Audience" },
  { type: "event", label: "Event" },
  { type: "email", label: "Email" },
  { type: "end", label: "End" },
];

function onDragStart(ev: React.DragEvent, nodeType: JourneyNodeType) {
  ev.dataTransfer.setData("application/reactflow", nodeType);
  ev.dataTransfer.effectAllowed = "move";
}

type Props = {
  width: number;
};

export function Palette({ width }: Props) {
  return (
    <aside className="palette" style={{ width, flexShrink: 0 }}>
      <div className="palette-scroll">
        <h2>Nodes</h2>
        {ITEMS.map((item) => (
          <div
            key={item.type}
            className="palette-item"
            data-kind={item.type}
            draggable
            onDragStart={(e) => onDragStart(e, item.type)}
          >
            {item.label}
          </div>
        ))}
      </div>
    </aside>
  );
}
