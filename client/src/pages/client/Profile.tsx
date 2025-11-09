import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { updateClientProfileSchema, type UpdateClientProfileInput, type AuthResponse } from '@shared/schema';

export default function ClientProfile() {
  const { toast } = useToast();
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const { data: authData } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
  });

  const { data: statsData } = useQuery({
    queryKey: ['/api/client/stats'],
    enabled: !!authData,
  });

  const form = useForm<UpdateClientProfileInput>({
    resolver: zodResolver(updateClientProfileSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneE164: '',
      currentPassword: '',
      newPassword: '',
    },
  });

  useEffect(() => {
    if (authData && statsData) {
      form.reset({
        fullName: (statsData as any).clientName || '',
        email: authData.user.email,
        phoneE164: (statsData as any).phoneE164 || '',
        currentPassword: '',
        newPassword: '',
      });
    }
  }, [authData, statsData, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateClientProfileInput) => {
      await apiRequest('PATCH', '/api/client/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/client/stats'] });
      toast({
        title: 'Perfil actualizado',
        description: 'Tu perfil ha sido actualizado correctamente',
      });
      form.reset({
        fullName: form.getValues('fullName'),
        email: form.getValues('email'),
        phoneE164: form.getValues('phoneE164'),
        currentPassword: '',
        newPassword: '',
      });
      setShowPasswordFields(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar perfil',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: UpdateClientProfileInput) => {
    const payload: UpdateClientProfileInput = {};
    
    const originalFullName = (statsData as any)?.clientName || '';
    const originalEmail = authData?.user.email || '';
    const originalPhone = (statsData as any)?.phoneE164 || '';
    
    if (data.fullName && data.fullName !== originalFullName) {
      payload.fullName = data.fullName;
    }
    
    if (data.email && data.email !== originalEmail) {
      payload.email = data.email;
    }
    
    if (data.phoneE164 && data.phoneE164 !== originalPhone) {
      payload.phoneE164 = data.phoneE164;
    }
    
    if (data.newPassword) {
      payload.currentPassword = data.currentPassword;
      payload.newPassword = data.newPassword;
    }

    if (Object.keys(payload).length === 0) {
      toast({
        title: 'Sin cambios',
        description: 'No hay cambios para guardar',
      });
      return;
    }

    updateMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">Administra tu información personal</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información personal</CardTitle>
              <CardDescription>Actualiza tu nombre, email y teléfono</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={(statsData as any)?.clientName || 'Tu nombre completo'}
                        data-testid="input-fullname"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="cliente@sparta.com"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneE164"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="+573001234567"
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
              <CardDescription>Cambia tu contraseña</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showPasswordFields && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordFields(true)}
                  data-testid="button-change-password"
                >
                  Cambiar contraseña
                </Button>
              )}

              {showPasswordFields && (
                <>
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña actual</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Contraseña actual"
                            data-testid="input-current-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva contraseña</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Nueva contraseña (mínimo 8 caracteres)"
                            data-testid="input-new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowPasswordFields(false);
                      form.setValue('currentPassword', '');
                      form.setValue('newPassword', '');
                    }}
                    data-testid="button-cancel-password"
                  >
                    Cancelar cambio de contraseña
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
