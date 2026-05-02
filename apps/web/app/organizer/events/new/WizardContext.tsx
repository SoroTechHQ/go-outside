"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";

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
  title: string;
  categoryId: string;
  shortDescription: string;
  tags: string[];
  startDatetime: string;
  endDatetime: string;
  timezone: string;
  venueId: string | null;
  customLocation: string | null;
  isOnline: boolean;
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
  | { type: "REMOVE_GALLERY"; url: string };

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
    default:
      return state;
  }
}

const initialState: WizardState = {
  step: 1,
  title: "",
  categoryId: "",
  shortDescription: "",
  tags: [],
  startDatetime: "",
  endDatetime: "",
  timezone: "Africa/Accra",
  venueId: null,
  customLocation: null,
  isOnline: false,
  ticketTypes: [],
  bannerUrl: null,
  galleryUrls: [],
  videoUrl: null,
  publishNow: true,
  scheduledFor: null,
};

type WizardContextValue = {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  next: () => void;
  back: () => void;
  setField: <K extends keyof WizardState>(field: K, value: WizardState[K]) => void;
};

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

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

  return (
    <WizardContext.Provider value={{ state, dispatch, next, back, setField }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used inside WizardProvider");
  return ctx;
}
