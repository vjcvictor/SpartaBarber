import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import LandingHero from '@/components/LandingHero';
import AuthDialog from '@/components/AuthDialog';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient, getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { LayoutDashboard } from 'lucide-react';
import type { AuthResponse } from '@shared/schema';

export default function Home() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: authData } = useQuery<AuthResponse | null>({
    queryKey: ['/api/auth/me'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  const getPanelRoute = () => {
    if (!authData?.user) return '/';
    switch (authData.user.role) {
      case 'ADMIN':
        return '/admin';
      case 'BARBER':
        return '/barber';
      case 'CLIENT':
        return '/client';
      default:
        return '/';
    }
  };

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



  return (
    <>
      <div className="min-h-screen bg-background">
        {authData?.user && (
          <div className="bg-primary/10 py-3 px-4 sm:px-6 text-center flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 flex-wrap">
            <span className="text-sm whitespace-nowrap" data-testid="text-welcome-user">
              Bienvenido, {authData.user.email}
            </span>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Button
                variant="default"
                size="sm"
                onClick={() => setLocation(getPanelRoute())}
                data-testid="button-access-panel"
                className="whitespace-nowrap"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Mi Panel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoginClick}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
                className="whitespace-nowrap"
              >
                Cerrar sesión
              </Button>
            </div>
          </div>
        )}
        <LandingHero
          onBookingClick={() => setLocation('/book')}
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
