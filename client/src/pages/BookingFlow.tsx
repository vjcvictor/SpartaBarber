import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useBookingStore } from '@/lib/store';
import BookingProgress from '@/components/BookingProgress';
import ServiceSelection from '@/components/ServiceSelection';
import BarberSelection from '@/components/BarberSelection';
import DateTimeSelection from '@/components/DateTimeSelection';
import ClientForm, { type ClientFormOutput } from '@/components/ClientForm';
import BookingReview from '@/components/BookingReview';
import AppointmentConfirmation from './AppointmentConfirmation';
import type { Service } from '@shared/schema';

export default function BookingFlow() {
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const {
    currentStep,
    selectedService,
    selectedBarber,
    selectedDate,
    selectedTime,
    clientData,
    setService,
    setBarber,
    setDate,
    setTime,
    setClientData,
    goBack,
    goNext,
    reset,
  } = useBookingStore();

  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });

  const handleClientFormSubmit = (data: ClientFormOutput) => {
    setClientData({
      fullName: data.fullName,
      phoneE164: data.phoneE164,
      email: data.email,
      notes: data.notes,
    });
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
  };

  const canProceedFromStep1 = selectedService && selectedBarber;
  const canProceedFromStep2 = selectedDate && selectedTime;

  if (showConfirmation && appointmentId) {
    return (
      <AppointmentConfirmation
        appointmentId={appointmentId}
        onBackToHome={handleBackToHome}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <BookingProgress currentStep={currentStep} />
        
        <div className="mt-8">
          {currentStep > 1 && currentStep < 4 && (
            <Button
              variant="ghost"
              onClick={goBack}
              className="mb-6"
              data-testid="button-back"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Atrás
            </Button>
          )}

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
                <BarberSelection
                  serviceId={selectedService.id}
                  selectedBarber={selectedBarber}
                  onSelect={setBarber}
                />
              )}
              {canProceedFromStep1 && (
                <div className="flex justify-end">
                  <Button 
                    size="lg" 
                    onClick={goNext}
                    data-testid="button-next-step1"
                  >
                    Siguiente
                  </Button>
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
                onTimeSelect={setTime}
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
            <div>
              <ClientForm
                initialData={{
                  fullName: clientData.fullName,
                  countryCode: '+57',
                  phone: clientData.phoneE164.replace('+57', '').trim(),
                  email: clientData.email,
                  notes: clientData.notes,
                }}
                onSubmit={handleClientFormSubmit}
              />
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
    </div>
  );
}
