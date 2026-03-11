"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type BookingPackage = {
  id: string;
  name: string;
  price_aed: number;
  duration: string;
};

export type SelectedAddon = {
  id: string;
  name: string;
  price_aed: number;
};

export type SelectedStudio = {
  id: string;
  name: string;
  price_aed_per_hour: number;
};

type BookingState = {
  selectedStudio: SelectedStudio | null;
  selectedPackage: BookingPackage | null;
  selectedDurationHours: number | null;
  selectedDate: string | null;
  selectedTimeSlot: string | null;
  selectedAddOns: SelectedAddon[];
};

const STORAGE_KEY = "icube_booking_draft";

function loadState(): BookingState {
  if (typeof window === "undefined")
    return { selectedStudio: null, selectedPackage: null, selectedDurationHours: null, selectedDate: null, selectedTimeSlot: null, selectedAddOns: [] };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { selectedStudio: null, selectedPackage: null, selectedDurationHours: null, selectedDate: null, selectedTimeSlot: null, selectedAddOns: [] };
    const parsed = JSON.parse(raw) as BookingState;
    return {
      selectedStudio: parsed.selectedStudio ?? null,
      selectedPackage: parsed.selectedPackage ?? null,
      selectedDurationHours: typeof parsed.selectedDurationHours === "number" ? parsed.selectedDurationHours : null,
      selectedDate: parsed.selectedDate ?? null,
      selectedTimeSlot: parsed.selectedTimeSlot ?? null,
      selectedAddOns: Array.isArray(parsed.selectedAddOns) ? parsed.selectedAddOns : [],
    };
  } catch {
    return { selectedStudio: null, selectedPackage: null, selectedDurationHours: null, selectedDate: null, selectedTimeSlot: null, selectedAddOns: [] };
  }
}

function saveState(s: BookingState) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

type BookingContextValue = BookingState & {
  setSelectedStudio: (s: SelectedStudio | null) => void;
  setSelectedPackage: (p: BookingPackage | null) => void;
  setSelectedDurationHours: (h: number | null) => void;
  setSelectedDate: (d: string | null) => void;
  setSelectedTimeSlot: (t: string | null) => void;
  setSelectedAddOns: (a: SelectedAddon[]) => void;
  addAddon: (a: SelectedAddon) => void;
  removeAddon: (id: string) => void;
  clearBooking: () => void;
  totalAddonsAmount: number;
};

const defaultState: BookingState = {
  selectedStudio: null,
  selectedPackage: null,
  selectedDurationHours: null,
  selectedDate: null,
  selectedTimeSlot: null,
  selectedAddOns: [],
};

const BookingContext = createContext<BookingContextValue>({
  ...defaultState,
  setSelectedStudio: () => {},
  setSelectedPackage: () => {},
  setSelectedDurationHours: () => {},
  setSelectedDate: () => {},
  setSelectedTimeSlot: () => {},
  setSelectedAddOns: () => {},
  addAddon: () => {},
  removeAddon: () => {},
  clearBooking: () => {},
  totalAddonsAmount: 0,
});

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const setSelectedStudio = useCallback((s: SelectedStudio | null) => {
    setState((st) => ({ ...st, selectedStudio: s }));
  }, []);
  const setSelectedPackage = useCallback((p: BookingPackage | null) => {
    setState((s) => ({ ...s, selectedPackage: p }));
  }, []);
  const setSelectedDurationHours = useCallback((h: number | null) => {
    setState((s) => ({ ...s, selectedDurationHours: h }));
  }, []);
  const setSelectedDate = useCallback((d: string | null) => {
    setState((s) => ({ ...s, selectedDate: d }));
  }, []);
  const setSelectedTimeSlot = useCallback((t: string | null) => {
    setState((s) => ({ ...s, selectedTimeSlot: t }));
  }, []);
  const setSelectedAddOns = useCallback((a: SelectedAddon[]) => {
    setState((s) => ({ ...s, selectedAddOns: a }));
  }, []);
  const addAddon = useCallback((a: SelectedAddon) => {
    setState((s) => ({
      ...s,
      selectedAddOns: s.selectedAddOns.some((x) => x.id === a.id) ? s.selectedAddOns : [...s.selectedAddOns, a],
    }));
  }, []);
  const removeAddon = useCallback((id: string) => {
    setState((s) => ({ ...s, selectedAddOns: s.selectedAddOns.filter((x) => x.id !== id) }));
  }, []);
  const clearBooking = useCallback(() => {
    setState(defaultState);
    if (typeof window !== "undefined") sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const totalAddonsAmount = state.selectedAddOns.reduce((sum, a) => sum + a.price_aed, 0);

  return (
    <BookingContext.Provider
      value={{
        ...state,
        setSelectedStudio,
        setSelectedPackage,
        setSelectedDurationHours,
        setSelectedDate,
        setSelectedTimeSlot,
        setSelectedAddOns,
        addAddon,
        removeAddon,
        clearBooking,
        totalAddonsAmount,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}
