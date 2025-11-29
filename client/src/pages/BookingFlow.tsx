import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronLeft, LogIn, UserPlus, Home, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBookingStore } from '@/lib/store';
import BookingProgress from '@/components/BookingProgress';
import ServiceSelection from '@/components/ServiceSelection';
import BarberSelection from '@/components/BarberSelection';
import DateTimeSelection from '@/components/DateTimeSelection';
import ClientForm, { type ClientFormOutput } from '@/components/ClientForm';
import BookingReview from '@/components/BookingReview';
import AppointmentConfirmation from './AppointmentConfirmation';
import AuthDialog from '@/components/AuthDialog';
import type { Service, Barber, AuthResponse } from '@shared/schema';

export default function BookingFlow() {
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<'login' | 'register'>('login');
  const [, setLocation] = useLocation();

  // Refs for auto-scrolling
  const barberSectionRef = useRef<HTMLDivElement>(null);
  const nextButtonRef = useRef<HTMLDivElement>(null);

  const {
    currentStep,
    selectedService,
    selectedBarber,
    selectedDate,
    selectedTime,
    clientData,
    clientDraft,
    clientDraftVersion,
    hasUserEditedDraft,
    setService,
    setBarber,
    setDate,
    setTime,
    hydrateClientDraft,
    patchClientDraft,
    commitClientData,
    goBack,
    goNext,
    reset,
  } = useBookingStore();

  const { data: barbers = [], isLoading: isLoadingBarbers } = useQuery<Barber[]>({
    queryKey: ['/api/barbers', { serviceId: selectedService?.id }],
    enabled: !!selectedService,
  });

  const { data: authData } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  const { data: clientStats, isLoading: clientStatsLoading } = useQuery({
    queryKey: ['/api/client/stats'],
    enabled: !!authData && authData.user.role === 'CLIENT',
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });

  const isAuthenticated = !!authData && authData.user.role === 'CLIENT';

  // Hydrate client draft only once before user starts editing
  useEffect(() => {
    if (isAuthenticated && clientStats && !hasUserEditedDraft) {
      const statsData = clientStats as any;
      const phoneWithoutCountryCode = statsData.phoneE164?.replace('+57', '').trim() || '';
      const emailFromAuth = authData?.user.email || '';

      hydrateClientDraft({
        fullName: statsData.clientName || '',
        countryCode: '+57',
        phone: phoneWithoutCountryCode,
        email: emailFromAuth,
        notes: '',
      });
    }
  }, [isAuthenticated, clientStats, authData, hasUserEditedDraft, hydrateClientDraft]);

  const handleClientFormSubmit = (data: ClientFormOutput) => {
    // Commit the draft to final clientData
    commitClientData(data.phoneE164);
    goNext();
  };

  const handleAppointmentConfirmed = (id: string) => {
    setAppointmentId(id);
    setShowConfirmation(true);
  };

  const handleBackToHome = () => {
    reset();
    setAppointmentId(null);
    setShowConfirmation(false);
    setLocation('/');
  };

  const canProceedFromStep1 = selectedService && selectedBarber;
  const canProceedFromStep2 = selectedDate && selectedTime;

  // Auto-scroll when service is selected
  useEffect(() => {
    if (selectedService && barberSectionRef.current && currentStep === 1) {
      setTimeout(() => {
        barberSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 300);
    }
  }, [selectedService, currentStep]);

  // Auto-scroll when barber is selected
  useEffect(() => {
    if (selectedBarber && nextButtonRef.current && currentStep === 1) {
      setTimeout(() => {
        nextButtonRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
    }
  }, [selectedBarber, currentStep]);


  if (showConfirmation && appointmentId) {
    return (
      <AppointmentConfirmation
        appointmentId={appointmentId}
        onBackToHome={handleBackToHome}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#1d1816] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with logo and step indicators */}
        <div className="bg-zinc-800 rounded-lg p-4 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Logo and branding */}
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Sparta Logo"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-white font-bold text-lg">Barbería Sparta</h1>
                <p className="text-gray-400 text-sm">Agenda tu cita</p>
              </div>
            </div>

            {/* Step indicators - centered on mobile with dividers */}
            <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-3">
              {[
                { num: 1, label: 'Servicio' },
                { num: 2, label: 'Fecha y hora' },
                { num: 3, label: 'Datos' },
                { num: 4, label: 'Confirmación' }
              ].map((step, index) => (
                <React.Fragment key={step.num}>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === step.num
                        ? 'bg-amber-500 text-black'
                        : currentStep > step.num
                          ? 'bg-green-600 text-white'
                          : 'bg-zinc-700 text-gray-400'
                        }`}
                    >
                      {currentStep > step.num ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        step.num
                      )}
                    </div>
                    <span className={`text-[10px] sm:text-xs whitespace-nowrap ${currentStep === step.num ? 'text-white font-medium' : 'text-gray-400'
                      }`}>
                      {step.label}
                    </span>
                  </div>
                  {/* Horizontal divider between steps */}
                  {index < 3 && (
                    <div className="h-px w-4 sm:w-8 bg-zinc-600 mb-6" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              {currentStep > 1 && currentStep < 4 && (
                <Button
                  variant="ghost"
                  onClick={goBack}
                  data-testid="button-back"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Atrás
                </Button>
              )}
            </div>
            {currentStep === 3 && (
              <Button
                variant="outline"
                onClick={handleBackToHome}
                data-testid="button-back-to-home"
              >
                <Home className="w-4 h-4 mr-2" />
                Volver a inicio
              </Button>
            )}
          </div>

          {currentStep === 1 && (
            <div className="space-y-8">
              {servicesLoading ? (
                <div className="space-y-4">
                  <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-5 w-96" />
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-64 w-full" />
                    ))}
                  </div>
                </div>
              ) : (
                <ServiceSelection
                  services={services}
                  selectedService={selectedService}
                  onSelect={setService}
                />
              )}
              {selectedService && (
                <div ref={barberSectionRef} className="scroll-mt-8">
                  <BarberSelection
                    serviceId={selectedService.id}
                    selectedBarber={selectedBarber}
                    onSelect={(barber) => {
                      setBarber(barber);
                    }}
                    barbers={barbers}
                    isLoading={isLoadingBarbers}
                  />
                </div>
              )}
              {canProceedFromStep1 && (
                <div
                  ref={nextButtonRef}
                  className="sticky bottom-4 z-10 pt-4"
                >
                  <div className="flex justify-end">
                    <Button
                      size="lg"
                      className="shadow-lg"
                      onClick={goNext}
                      data-testid="button-next-step1"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && selectedService && selectedBarber && (
            <div className="space-y-8">
              <DateTimeSelection
                serviceId={selectedService.id}
                barberId={selectedBarber.id}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onDateSelect={setDate}
                onTimeSelect={(time, barberId) => {
                  setTime(time);

                }}
              />
              {canProceedFromStep2 && (
                <div className="flex justify-end">
                  <Button
                    size="lg"
                    onClick={goNext}
                    data-testid="button-next-step2"
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && selectedService && selectedBarber && selectedDate && selectedTime && (
            <div className="space-y-6">

              {clientStatsLoading && isAuthenticated ? (
                <div className="space-y-4" data-testid="skeleton-client-form">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <ClientForm
                  draftData={clientDraft}
                  dataVersion={clientDraftVersion}
                  onChange={patchClientDraft}
                  onSubmit={handleClientFormSubmit}
                />
              )}
            </div>
          )}

          {currentStep === 4 && selectedService && selectedBarber && selectedDate && selectedTime && clientData.fullName && (
            <div className="max-w-2xl mx-auto">
              <BookingReview
                service={selectedService}
                barber={selectedBarber}
                date={selectedDate}
                time={selectedTime}
                clientData={clientData}
                onSuccess={handleAppointmentConfirmed}
              />
            </div>
          )}
        </div>
      </div>

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        initialMode={authDialogMode}
      />
    </div>
  );
}
