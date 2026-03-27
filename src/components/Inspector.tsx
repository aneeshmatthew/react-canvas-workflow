import { useState } from "react";
import type { Node } from "@xyflow/react";
import type { JourneyNodeData, JourneyNodeType } from "@/lib/journeySchema";

type Props = {
  selected: Node<JourneyNodeData> | null;
  onChange: (id: string, data: Partial<JourneyNodeData>) => void;
  validationMessages?: string[];
  onClose: () => void;
  onSave: () => void;
  panelWidth: number;
};

export function Inspector({
  selected,
  onChange,
  validationMessages = [],
  onClose,
  onSave,
  panelWidth,
}: Props) {
  const [savedFlash, setSavedFlash] = useState(false);

  if (!selected) {
    return null;
  }

  const d = selected.data;
  const kind = selected.type as JourneyNodeType;

  const handleSave = () => {
    onSave();
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <aside
      className="inspector"
      style={{ width: panelWidth, flexShrink: 0 }}
    >
      <div className="inspector-header">
        <h2>Properties</h2>
        <button
          type="button"
          className="inspector-close"
          onClick={onClose}
          aria-label="Close properties"
        >
          Close
        </button>
      </div>
      <div className="inspector-body">
      {validationMessages.length > 0 ? (
        <ul className="inspector-validation">
          {validationMessages.map((m, i) => (
            <li key={`${i}-${m.slice(0, 40)}`}>{m}</li>
          ))}
        </ul>
      ) : null}
      <label htmlFor="label">Label</label>
      <input
        id="label"
        value={d.label}
        onChange={(e) => onChange(selected.id, { label: e.target.value })}
      />
      <label htmlFor="subtitle">Subtitle</label>
      <textarea
        id="subtitle"
        rows={2}
        value={d.subtitle ?? ""}
        onChange={(e) =>
          onChange(selected.id, { subtitle: e.target.value || undefined })
        }
      />
      {kind === "audience" ? (
        <>
          <label htmlFor="seg">Segment hint</label>
          <input
            id="seg"
            value={d.segmentHint ?? ""}
            onChange={(e) =>
              onChange(selected.id, { segmentHint: e.target.value || undefined })
            }
          />
        </>
      ) : null}
      {kind === "event" ? (
        <>
          <label htmlFor="ev">Event key</label>
          <input
            id="ev"
            value={d.eventKey ?? ""}
            onChange={(e) =>
              onChange(selected.id, { eventKey: e.target.value || undefined })
            }
          />
        </>
      ) : null}
      {kind === "email" ? (
        <>
          <label htmlFor="tpl">Template name</label>
          <input
            id="tpl"
            value={d.templateName ?? ""}
            onChange={(e) =>
              onChange(selected.id, { templateName: e.target.value || undefined })
            }
          />
        </>
      ) : null}
      </div>
      <div className="inspector-actions">
        <button type="button" className="inspector-save" onClick={handleSave}>
          Save
        </button>
        <button type="button" className="inspector-close-secondary" onClick={onClose}>
          Close
        </button>
      </div>
      {savedFlash ? (
        <p className="inspector-saved-hint" role="status">
          Saved to this browser
        </p>
      ) : null}
    </aside>
  );
}
