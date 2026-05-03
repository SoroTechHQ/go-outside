"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PencilSimple,
  Eye,
  EyeSlash,
  PaperPlaneTilt,
  Trash,
} from "@phosphor-icons/react";
import { ConfirmModal } from "../../_components/ConfirmModal";
import { MessageAttendeesModal } from "../../_components/MessageAttendeesModal";

interface EventDetailActionsProps {
  eventId: string;
  eventSlug: string;
  eventName: string;
  status: string;
  ticketsSold: number;
  attendeeCount: number;
}

export function EventDetailActions({
  eventId,
  eventSlug,
  eventName,
  status,
  ticketsSold,
  attendeeCount,
}: EventDetailActionsProps) {
  const router = useRouter();
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isDraft = status === "draft";
  const isPublished = status === "published";

  async function updateStatus(newStatus: string) {
    setIsLoading(true);
    try {
      await fetch(`/api/organizer/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setIsLoading(false);
      setUnpublishOpen(false);
      setPublishOpen(false);
    }
  }

  async function deleteEvent() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/organizer/events/${eventId}`, {
        method: "DELETE",
      });
      const data = await res.json() as { error?: string; message?: string };
      if (!res.ok) {
        alert(data.message ?? data.error ?? "Failed to delete event.");
        return;
      }
      router.push("/organizer/events");
    } finally {
      setIsLoading(false);
      setDeleteOpen(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => router.push(`/organizer/events/new?edit=${eventId}`)}
          className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        >
          <PencilSimple size={14} />
          Edit
        </button>

        {isPublished ? (
          <button
            type="button"
            onClick={() => setUnpublishOpen(true)}
            className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            <EyeSlash size={14} />
            Unpublish
          </button>
        ) : isDraft ? (
          <button
            type="button"
            onClick={() => setPublishOpen(true)}
            className="flex items-center gap-2 rounded-full bg-[var(--brand)] px-3 py-1.5 text-[13px] font-semibold text-black transition hover:bg-[#4fa824]"
          >
            <Eye size={14} />
            Publish
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setMessageOpen(true)}
          className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        >
          <PaperPlaneTilt size={14} />
          Message attendees
        </button>

        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="flex items-center gap-2 rounded-full border border-red-500/20 px-3 py-1.5 text-[13px] font-medium text-red-500 transition hover:bg-red-500/8 hover:border-red-500/40"
          title="Delete event"
        >
          <Trash size={14} />
        </button>
      </div>

      <ConfirmModal
        isOpen={unpublishOpen}
        title="Unpublish this event?"
        description="The event will be removed from the public feed. Ticket holders will receive an in-app notification."
        confirmLabel="Unpublish event"
        variant="default"
        isLoading={isLoading}
        onConfirm={() => updateStatus("draft")}
        onCancel={() => setUnpublishOpen(false)}
      />

      <ConfirmModal
        isOpen={publishOpen}
        title="Publish this event?"
        description="The event will go live on the GoOutside feed and your followers will be notified."
        confirmLabel="Publish event"
        variant="default"
        isLoading={isLoading}
        onConfirm={() => updateStatus("published")}
        onCancel={() => setPublishOpen(false)}
      />

      <ConfirmModal
        isOpen={deleteOpen}
        title="Delete this event?"
        description={
          ticketsSold > 0
            ? `This event has ${ticketsSold} sold ticket${ticketsSold !== 1 ? "s" : ""} — it cannot be deleted. Unpublish or cancel it instead.`
            : "This action cannot be undone. The event page will be removed immediately."
        }
        confirmLabel={ticketsSold > 0 ? "Got it" : "Delete event"}
        cancelLabel={ticketsSold > 0 ? "Close" : "Cancel"}
        variant={ticketsSold > 0 ? "default" : "destructive"}
        isLoading={isLoading}
        onConfirm={ticketsSold > 0 ? () => setDeleteOpen(false) : deleteEvent}
        onCancel={() => setDeleteOpen(false)}
      />

      <MessageAttendeesModal
        isOpen={messageOpen}
        onClose={() => setMessageOpen(false)}
        eventId={eventId}
        eventName={eventName}
        attendeeCount={attendeeCount}
      />
    </>
  );
}
