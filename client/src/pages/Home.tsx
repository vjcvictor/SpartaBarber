import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import LandingHero from '@/components/LandingHero';
import BookingFlow from './BookingFlow';
import AuthDialog from '@/components/AuthDialog';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient, getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { AuthResponse } from '@shared/schema';

export default function Home() {
  const [showBooking, setShowBooking] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { toast } = useToast();

  const { data: authData } = useQuery<AuthResponse | null>({
    queryKey: ['/api/auth/me'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/auth/logout', {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión exitosamente',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo cerrar sesión',
      });
    },
  });

  const handleLoginClick = () => {
    if (authData?.user) {
      logoutMutation.mutate();
    } else {
      setAuthMode('login');
      setAuthDialogOpen(true);
    }
  };

  const handleRegisterClick = () => {
    setAuthMode('register');
    setAuthDialogOpen(true);
  };

  if (showBooking) {
    return <BookingFlow />;
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        {authData?.user && (
          <div className="bg-primary/10 py-2 px-4 text-center">
            <span className="text-sm" data-testid="text-welcome-user">
              Bienvenido, {authData.user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-4"
              onClick={handleLoginClick}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              Cerrar sesión
            </Button>
          </div>
        )}
        <LandingHero
          onBookingClick={() => setShowBooking(true)}
          onLoginClick={handleLoginClick}
          onRegisterClick={authData?.user ? undefined : handleRegisterClick}
          isLoggedIn={!!authData?.user}
        />
      </div>
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        initialMode={authMode}
      />
    </>
  );
}
