"use client";

import { Heart, X, Eye } from "lucide-react";
import { useState } from "react";

interface QuickActionButtonsProps {
  eventId:    string;
  slug:       string;
  isSaved?:   boolean;
  onSave?:    (id: string) => void;
  onDismiss?: (id: string) => void;
  onPreview?: (slug: string) => void;
  sessionId?: string;
}

export function QuickActionButtons({
  eventId,
  slug,
  isSaved = false,
  onSave,
  onDismiss,
  onPreview,
  sessionId,
}: QuickActionButtonsProps) {
  const [saved, setSaved] = useState(isSaved);

  async function logInteraction(actionType: string) {
    fetch("/api/interactions", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        event_id:    eventId,
        action_type: actionType,
        source:      "feed",
        session_id:  sessionId,
      }),
    }).catch(() => {});
  }

  function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    logInteraction(next ? "save" : "unsave");
    onSave?.(eventId);
  }

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    logInteraction("not_interested");
    onDismiss?.(eventId);
  }

  function handlePreview(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    logInteraction("peek_open");
    onPreview?.(slug);
  }

  const buttonBase: React.CSSProperties = {
    width:           "30px",
    height:          "30px",
    borderRadius:    "50%",
    background:      "rgba(0,0,0,0.65)",
    border:          "1px solid rgba(255,255,255,0.15)",
    backdropFilter:  "blur(8px)",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    cursor:          "pointer",
    transition:      "transform 120ms ease",
    color:           "rgba(255,255,255,0.85)",
    flexShrink:      0,
  };

  return (
    <div
      className="quick-action-buttons"
      style={{
        display:  "flex",
        gap:      "6px",
        position: "absolute",
        top:      "8px",
        right:    "8px",
      }}
    >
      {/* Preview */}
      {onPreview && (
        <button
          onClick={handlePreview}
          style={buttonBase}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          aria-label="Preview event"
        >
          <Eye size={14} />
        </button>
      )}

      {/* Dismiss */}
      {onDismiss && (
        <button
          onClick={handleDismiss}
          style={buttonBase}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          aria-label="Not interested"
        >
          <X size={14} />
        </button>
      )}

      {/* Save — always visible (opacity 1), others appear on hover via parent CSS */}
      <button
        onClick={handleSave}
        style={{
          ...buttonBase,
          color:      saved ? "#E85D8A" : "rgba(255,255,255,0.85)",
          background: saved ? "rgba(232,93,138,0.15)" : "rgba(0,0,0,0.65)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        aria-label={saved ? "Unsave" : "Save event"}
      >
        <Heart size={14} fill={saved ? "#E85D8A" : "none"} />
      </button>
    </div>
  );
}
