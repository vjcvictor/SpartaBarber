import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { parsePhoneNumber } from 'libphonenumber-js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { AuthResponse } from '@shared/schema';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(7, 'Teléfono inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
}).refine((data) => {
  try {
    const phoneNumber = parsePhoneNumber(data.phone, 'CO');
    return phoneNumber.isValid();
  } catch {
    return false;
  }
}, {
  message: 'Número de teléfono inválido',
  path: ['phone'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: 'login' | 'register';
}

export default function AuthDialog({ open, onOpenChange, initialMode = 'login' }: AuthDialogProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await apiRequest('POST', '/api/auth/login', data);
      return res.json();
    },
    onSuccess: (data: AuthResponse) => {
      queryClient.setQueryData(['/api/auth/me'], data);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: '¡Bienvenido!',
        description: `Hola ${data.user.email}`,
      });
      onOpenChange(false);
      loginForm.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error al iniciar sesión',
        description: error.message || 'Credenciales inválidas',
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const phoneNumber = parsePhoneNumber(data.phone, 'CO');
      const phoneE164 = phoneNumber.format('E.164');

      const res = await apiRequest('POST', '/api/auth/register', {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phoneE164,
      });
      return res.json();
    },
    onSuccess: (data: AuthResponse) => {
      queryClient.setQueryData(['/api/auth/me'], data);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: '¡Cuenta creada!',
        description: `Bienvenido ${data.user.email}`,
      });
      onOpenChange(false);
      registerForm.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error al registrarse',
        description: error.message || 'No se pudo crear la cuenta',
      });
    },
  });

  const handleLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const handleRegisterSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-auth">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'login'
              ? 'Ingresa tus credenciales para acceder'
              : 'Completa tus datos para crear una cuenta'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'login' ? (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="tu@email.com"
                        {...field}
                        data-testid="input-login-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        data-testid="input-login-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-login-submit"
              >
                {loginMutation.isPending ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
              <div className="text-center text-sm">
                <span className="text-muted-foreground">¿No tienes cuenta? </span>
                <Button
                  type="button"
                  variant="ghost"
                  className="p-0 h-auto"
                  onClick={() => setMode('register')}
                  data-testid="button-switch-register"
                >
                  Regístrate
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Juan Pérez"
                        {...field}
                        data-testid="input-register-fullname"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="tu@email.com"
                        {...field}
                        data-testid="input-register-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono (Colombia)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="3001234567"
                        {...field}
                        data-testid="input-register-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        data-testid="input-register-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
                data-testid="button-register-submit"
              >
                {registerMutation.isPending ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>
              <div className="text-center text-sm">
                <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
                <Button
                  type="button"
                  variant="ghost"
                  className="p-0 h-auto"
                  onClick={() => setMode('login')}
                  data-testid="button-switch-login"
                >
                  Inicia sesión
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
