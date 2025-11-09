import { create } from 'zustand';
import type { Service, Barber } from '@shared/schema';

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
  setStep: (step: number) => void;
  setService: (service: Service | null) => void;
  setBarber: (barber: Barber | null) => void;
  setDate: (date: Date | null) => void;
  setTime: (time: string | null) => void;
  setClientData: (data: Partial<BookingState['clientData']>) => void;
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

export const useBookingStore = create<BookingState>((set) => ({
  currentStep: 1,
  selectedService: null,
  selectedBarber: null,
  selectedDate: null,
  selectedTime: null,
  clientData: initialClientData,
  setStep: (step) => set({ currentStep: step }),
  setService: (service) => set({ selectedService: service }),
  setBarber: (barber) => set({ selectedBarber: barber }),
  setDate: (date) => set({ selectedDate: date }),
  setTime: (time) => set({ selectedTime: time }),
  setClientData: (data) => set((state) => ({
    clientData: { ...state.clientData, ...data }
  })),
  reset: () => set({
    currentStep: 1,
    selectedService: null,
    selectedBarber: null,
    selectedDate: null,
    selectedTime: null,
    clientData: initialClientData,
  }),
  goBack: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),
  goNext: () => set((state) => ({ currentStep: Math.min(4, state.currentStep + 1) })),
}));
