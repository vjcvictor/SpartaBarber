import { create } from 'zustand';
import type { Service, Barber } from '@shared/schema';

export interface ClientDraftData {
  fullName: string;
  countryCode: string;
  phone: string;
  email: string;
  notes: string;
}

export interface BookingState {
  currentStep: number;
  selectedService: Service | null;
  selectedBarber: Barber | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  clientData: {
    fullName: string;
    phoneE164: string;
    email: string;
    notes: string;
  };
  clientDraft: ClientDraftData;
  clientDraftVersion: number;
  hasUserEditedDraft: boolean;
  setStep: (step: number) => void;
  setService: (service: Service | null) => void;
  setBarber: (barber: Barber | null) => void;
  setDate: (date: Date | null) => void;
  setTime: (time: string | null) => void;
  setClientData: (data: Partial<BookingState['clientData']>) => void;
  hydrateClientDraft: (draft: Partial<ClientDraftData>) => void;
  patchClientDraft: (draft: Partial<ClientDraftData>) => void;
  commitClientData: (phoneE164: string) => void;
  reset: () => void;
  goBack: () => void;
  goNext: () => void;
}

const initialClientData = {
  fullName: '',
  phoneE164: '+57',
  email: '',
  notes: '',
};

const initialClientDraft = {
  fullName: '',
  countryCode: '+57',
  phone: '',
  email: '',
  notes: '',
};

export const useBookingStore = create<BookingState>((set) => ({
  currentStep: 1,
  selectedService: null,
  selectedBarber: null,
  selectedDate: null,
  selectedTime: null,
  clientData: initialClientData,
  clientDraft: initialClientDraft,
  clientDraftVersion: 0,
  hasUserEditedDraft: false,
  setStep: (step) => set({ currentStep: step }),
  setService: (service) => set({ selectedService: service }),
  setBarber: (barber) => set({ selectedBarber: barber }),
  setDate: (date) => set({ selectedDate: date }),
  setTime: (time) => set({ selectedTime: time }),
  setClientData: (data) => set((state) => ({
    clientData: { ...state.clientData, ...data }
  })),
  hydrateClientDraft: (draft) => set((state) => ({
    clientDraft: { ...state.clientDraft, ...draft },
    clientDraftVersion: state.clientDraftVersion + 1,
  })),
  patchClientDraft: (draft) => set((state) => ({
    clientDraft: { ...state.clientDraft, ...draft },
    hasUserEditedDraft: true,
  })),
  commitClientData: (phoneE164) => set((state) => ({
    clientData: {
      fullName: state.clientDraft.fullName,
      phoneE164,
      email: state.clientDraft.email,
      notes: state.clientDraft.notes,
    },
  })),
  reset: () => set({
    currentStep: 1,
    selectedService: null,
    selectedBarber: null,
    selectedDate: null,
    selectedTime: null,
    clientData: initialClientData,
    clientDraft: initialClientDraft,
    clientDraftVersion: 0,
    hasUserEditedDraft: false,
  }),
  goBack: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),
  goNext: () => set((state) => ({ currentStep: Math.min(4, state.currentStep + 1) })),
}));
