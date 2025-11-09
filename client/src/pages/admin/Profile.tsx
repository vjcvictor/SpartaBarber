import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AdminLayout from '@/components/AdminLayout';
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
import { updateAdminProfileSchema, type UpdateAdminProfileInput, type AuthResponse } from '@shared/schema';

export default function AdminProfile() {
  const { toast } = useToast();
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const { data: authData } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
  });

  const form = useForm<UpdateAdminProfileInput>({
    resolver: zodResolver(updateAdminProfileSchema),
    defaultValues: {
      email: '',
      currentPassword: '',
      newPassword: '',
    },
  });

  useEffect(() => {
    if (authData) {
      form.reset({
        email: authData.user.email,
        currentPassword: '',
        newPassword: '',
      });
    }
  }, [authData, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateAdminProfileInput) => {
      await apiRequest('PATCH', '/api/admin/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: 'Perfil actualizado',
        description: 'Tu perfil ha sido actualizado correctamente',
      });
      form.reset({
        email: form.getValues('email'),
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

  const onSubmit = (data: UpdateAdminProfileInput) => {
    const payload: UpdateAdminProfileInput = {};
    
    if (data.email !== authData?.user.email) {
      payload.email = data.email;
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
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <p className="text-muted-foreground">Administra tu información personal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de la cuenta</CardTitle>
            <CardDescription>Actualiza tu email y contraseña</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="admin@sparta.com"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
