import { useEffect } from "react";

type Props = {
  open: boolean;
  hasUnsavedEdits: boolean;
  hasValidationIssues: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
};

/**
 * Shown when leaving the properties panel while the current node has
 * unsaved edits (vs last baseline) or validation messages.
 */
export function InspectorLeavePrompt({
  open,
  hasUnsavedEdits,
  hasValidationIssues,
  onSave,
  onDiscard,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="exec-modal-overlay"
      onClick={onCancel}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      role="presentation"
    >
      <div
        className="exec-modal inspector-leave-prompt"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspector-leave-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="inspector-leave-title">Leave properties?</h2>
        <div className="inspector-leave-prompt__body">
          {hasUnsavedEdits ? (
            <p>You have unsaved changes for this node.</p>
          ) : null}
          {hasValidationIssues ? (
            <p>This node still has validation issues.</p>
          ) : null}
          <p className="inspector-leave-prompt__hint">
            Save to browser storage, discard edits, or stay on this node.
          </p>
        </div>
        <div className="inspector-leave-prompt__actions">
          <button type="button" className="inspector-leave-prompt__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="inspector-leave-prompt__discard" onClick={onDiscard}>
            Don&apos;t save
          </button>
          <button type="button" className="inspector-leave-prompt__save" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
