import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { parsePhoneNumber, type CountryCode } from 'libphonenumber-js';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useBookingStore } from '@/lib/store';
import { Eye, EyeOff } from 'lucide-react';
import type { AuthResponse } from '@shared/schema';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  countryCode: z.string().default('+57'),
  phone: z.string().min(7, 'Teléfono inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
}).refine((data) => {
  try {
    // Map country codes to country ISO codes
    const countryMap: Record<string, CountryCode> = {
      '+57': 'CO',  // Colombia
      '+58': 'VE',  // Venezuela
      '+1': 'US',   // United States
      '+52': 'MX',  // Mexico
      '+34': 'ES',  // Spain
    };

    const countryISO = countryMap[data.countryCode] || 'CO';
    const phoneNumber = parsePhoneNumber(data.phone, countryISO);
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
  const [formKey, setFormKey] = useState(0);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const { toast } = useToast();
  const { hydrateClientDraft } = useBookingStore();

  useEffect(() => {
    setMode(initialMode);
    if (open) {
      setFormKey(prev => prev + 1);
    }
  }, [initialMode, open]);

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
      countryCode: '+57',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await apiRequest('POST', '/api/auth/login', data);
      return res.json();
    },
    onSuccess: async (data: AuthResponse) => {
      queryClient.setQueryData(['/api/auth/me'], data);
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });

      // Fetch client stats to get phone number
      const statsRes = await fetch('/api/client/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const phoneWithoutCode = statsData.phoneE164?.replace(/^\+\d{1,3}/, '').trim() || '';
        const countryCode = statsData.phoneE164?.match(/^\+\d{1,3}/)?.[0] || '+57';

        hydrateClientDraft({
          fullName: statsData.clientName || '',
          countryCode,
          phone: phoneWithoutCode,
          email: data.user.email,
          notes: '',
        });
      }

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
      // Map country codes to country ISO codes
      const countryMap: Record<string, CountryCode> = {
        '+57': 'CO',
        '+58': 'VE',
        '+1': 'US',
        '+52': 'MX',
        '+34': 'ES',
      };

      const countryISO = countryMap[data.countryCode] || 'CO';
      const phoneNumber = parsePhoneNumber(data.phone, countryISO);
      const phoneE164 = phoneNumber.format('E.164');

      const res = await apiRequest('POST', '/api/auth/register', {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phoneE164,
      });
      return { ...await res.json(), registeredPhone: data.phone, registeredCountryCode: data.countryCode, registeredFullName: data.fullName };
    },
    onSuccess: (data: AuthResponse & { registeredPhone?: string; registeredCountryCode?: string; registeredFullName?: string }) => {
      queryClient.setQueryData(['/api/auth/me'], data);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });

      // Auto-populate ClientForm with registration data
      hydrateClientDraft({
        fullName: data.registeredFullName || '',
        countryCode: data.registeredCountryCode || '+57',
        phone: data.registeredPhone || '',
        email: data.user.email,
        notes: '',
      });

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
          <Form {...loginForm} key={`login-${formKey}`}>
            <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="tu@email.com"
                        autoComplete="email"
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
                        autoComplete="current-password"
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
          <Form {...registerForm} key={`register-${formKey}`}>
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
                        autoComplete="name"
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
                        placeholder="tu@email.com"
                        autoComplete="email"
                        {...field}
                        data-testid="input-register-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Teléfono
                </label>
                <div className="flex gap-2 mt-2">
                  <FormField
                    control={registerForm.control}
                    name="countryCode"
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-register-country">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="+57">
                              <div className="flex items-center">
                                <img src="https://flagcdn.com/w20/co.png" alt="Colombia" className="mr-2 h-4 w-6 object-cover rounded-sm" />
                                +57
                              </div>
                            </SelectItem>
                            <SelectItem value="+58">
                              <div className="flex items-center">
                                <img src="https://flagcdn.com/w20/ve.png" alt="Venezuela" className="mr-2 h-4 w-6 object-cover rounded-sm" />
                                +58
                              </div>
                            </SelectItem>
                            <SelectItem value="+1">
                              <div className="flex items-center">
                                <img src="https://flagcdn.com/w20/us.png" alt="USA" className="mr-2 h-4 w-6 object-cover rounded-sm" />
                                +1
                              </div>
                            </SelectItem>
                            <SelectItem value="+52">
                              <div className="flex items-center">
                                <img src="https://flagcdn.com/w20/mx.png" alt="Mexico" className="mr-2 h-4 w-6 object-cover rounded-sm" />
                                +52
                              </div>
                            </SelectItem>
                            <SelectItem value="+34">
                              <div className="flex items-center">
                                <img src="https://flagcdn.com/w20/es.png" alt="España" className="mr-2 h-4 w-6 object-cover rounded-sm" />
                                +34
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="3001234567"
                            autoComplete="tel"
                            {...field}
                            data-testid="input-register-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          className="pr-12"
                          {...field}
                          data-testid="input-register-password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          tabIndex={-1}
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showRegisterConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          className="pr-12"
                          {...field}
                          data-testid="input-register-confirm-password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                          onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                          tabIndex={-1}
                        >
                          {showRegisterConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
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
