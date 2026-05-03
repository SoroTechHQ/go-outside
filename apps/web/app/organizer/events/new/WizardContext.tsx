"use client";

import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";

export type TicketTypeInput = {
  id: string;
  name: string;
  price: number;
  capacity: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
};

export type WizardState = {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  draftId: string | null;
  title: string;
  categoryId: string;
  shortDescription: string;
  tags: string[];
  startDatetime: string;
  endDatetime: string;
  timezone: string;
  venueId: string | null;
  venueName: string | null;
  venueAddress: string | null;
  venueLat: number | null;
  venueLng: number | null;
  customLocation: string | null;
  isOnline: boolean;
  onlinePlatform: string | null;
  onlineLink: string | null;
  ticketTypes: TicketTypeInput[];
  bannerUrl: string | null;
  galleryUrls: string[];
  videoUrl: string | null;
  publishNow: boolean;
  scheduledFor: string | null;
};

type WizardAction =
  | { type: "SET_STEP"; step: WizardState["step"] }
  | { type: "SET_FIELD"; field: keyof WizardState; value: WizardState[keyof WizardState] }
  | { type: "SET_TAG"; tags: string[] }
  | { type: "ADD_TICKET"; ticket: TicketTypeInput }
  | { type: "UPDATE_TICKET"; id: string; ticket: Partial<TicketTypeInput> }
  | { type: "REMOVE_TICKET"; id: string }
  | { type: "ADD_GALLERY"; url: string }
  | { type: "REMOVE_GALLERY"; url: string }
  | { type: "RESET" };

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step };
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_TAG":
      return { ...state, tags: action.tags };
    case "ADD_TICKET":
      return { ...state, ticketTypes: [...state.ticketTypes, action.ticket] };
    case "UPDATE_TICKET":
      return {
        ...state,
        ticketTypes: state.ticketTypes.map((t) =>
          t.id === action.id ? { ...t, ...action.ticket } : t
        ),
      };
    case "REMOVE_TICKET":
      return { ...state, ticketTypes: state.ticketTypes.filter((t) => t.id !== action.id) };
    case "ADD_GALLERY":
      return { ...state, galleryUrls: [...state.galleryUrls, action.url] };
    case "REMOVE_GALLERY":
      return { ...state, galleryUrls: state.galleryUrls.filter((u) => u !== action.url) };
    case "RESET":
      return baseInitialState;
    default:
      return state;
  }
}

const baseInitialState: WizardState = {
  step: 1,
  draftId: null,
  title: "",
  categoryId: "",
  shortDescription: "",
  tags: [],
  startDatetime: "",
  endDatetime: "",
  timezone: "Africa/Accra",
  venueId: null,
  venueName: null,
  venueAddress: null,
  venueLat: null,
  venueLng: null,
  customLocation: null,
  isOnline: false,
  onlinePlatform: null,
  onlineLink: null,
  ticketTypes: [],
  bannerUrl: null,
  galleryUrls: [],
  videoUrl: null,
  publishNow: true,
  scheduledFor: null,
};

const DRAFT_KEY = "go_event_wizard_v1";

function loadInitialState(): WizardState {
  if (typeof window === "undefined") return baseInitialState;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...baseInitialState, ...parsed, step: 1 };
    }
  } catch {}
  return baseInitialState;
}

type WizardContextValue = {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  next: () => void;
  back: () => void;
  setField: <K extends keyof WizardState>(field: K, value: WizardState[K]) => void;
  clearDraft: () => void;
  saveDraft: () => Promise<{ id: string } | null>;
  hasDraft: boolean;
};

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  const hasDraft = Boolean(
    typeof window !== "undefined" && (() => {
      try { return Boolean(localStorage.getItem(DRAFT_KEY)); } catch { return false; }
    })()
  );

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  function next() {
    if (state.step < 6) {
      dispatch({ type: "SET_STEP", step: (state.step + 1) as WizardState["step"] });
    }
  }

  function back() {
    if (state.step > 1) {
      dispatch({ type: "SET_STEP", step: (state.step - 1) as WizardState["step"] });
    }
  }

  function setField<K extends keyof WizardState>(field: K, value: WizardState[K]) {
    dispatch({ type: "SET_FIELD", field, value });
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    dispatch({ type: "RESET" });
  }

  async function saveDraft(): Promise<{ id: string } | null> {
    if (!state.title.trim()) return null;
    try {
      const res = await fetch("/api/organizer/events/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: state.draftId ?? undefined,
          title: state.title,
          categoryId: state.categoryId,
          shortDescription: state.shortDescription,
          tags: state.tags,
          startDatetime: state.startDatetime || null,
          endDatetime: state.endDatetime || null,
          timezone: state.timezone,
          venueId: state.venueId,
          customLocation: state.customLocation,
          venueLat: state.venueLat,
          venueLng: state.venueLng,
          isOnline: state.isOnline,
          onlinePlatform: state.onlinePlatform,
          onlineLink: state.onlineLink,
          bannerUrl: state.bannerUrl,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { id: string };
      if (!state.draftId) {
        dispatch({ type: "SET_FIELD", field: "draftId", value: data.id });
      }
      return data;
    } catch {
      return null;
    }
  }

  return (
    <WizardContext.Provider value={{ state, dispatch, next, back, setField, clearDraft, saveDraft, hasDraft }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used inside WizardProvider");
  return ctx;
}
