import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronLeft, LogIn, UserPlus, Home } from 'lucide-react';
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
import type { Service, AuthResponse } from '@shared/schema';

export default function BookingFlow() {
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<'login' | 'register'>('login');
  const [, setLocation] = useLocation();

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
    setLocation('/');
  };

  const canProceedFromStep1 = selectedService && selectedBarber;
  const canProceedFromStep2 = selectedDate && selectedTime;

  const getInitialFormData = () => {
    if (isAuthenticated && clientStats && !clientData.fullName) {
      const statsData = clientStats as any;
      const phoneWithoutCountryCode = statsData.phoneE164?.replace('+57', '').trim() || '';
      const emailFromAuth = authData?.user.email || '';
      
      return {
        fullName: statsData.clientName || '',
        countryCode: '+57' as const,
        phone: phoneWithoutCountryCode,
        email: emailFromAuth,
        notes: '',
      };
    }
    
    return {
      fullName: clientData.fullName,
      countryCode: '+57' as const,
      phone: clientData.phoneE164.replace('+57', '').trim(),
      email: clientData.email,
      notes: clientData.notes,
    };
  };

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
            <div className="space-y-6">
              {!isAuthenticated && (
                <Card data-testid="card-login-prompt">
                  <CardHeader>
                    <CardTitle>¿Ya tienes una cuenta?</CardTitle>
                    <CardDescription>
                      Inicia sesión para completar automáticamente tus datos o crea una cuenta nueva
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="default"
                      onClick={() => {
                        setAuthDialogMode('login');
                        setShowAuthDialog(true);
                      }}
                      data-testid="button-open-login"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Iniciar Sesión
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => {
                        setAuthDialogMode('register');
                        setShowAuthDialog(true);
                      }}
                      data-testid="button-open-register"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Registrarse
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {}}
                      data-testid="button-continue-without-login"
                    >
                      Continuar sin iniciar sesión
                    </Button>
                  </CardContent>
                </Card>
              )}

              {clientStatsLoading && isAuthenticated ? (
                <div className="space-y-4" data-testid="skeleton-client-form">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <ClientForm
                  initialData={getInitialFormData()}
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
