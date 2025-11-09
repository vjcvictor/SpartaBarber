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
import { updateBarberProfileSchema, type UpdateBarberProfileInput, type AuthResponse, type WeeklySchedule, type Barber } from '@shared/schema';
import WeeklyScheduleEditor from '@/components/WeeklyScheduleEditor';

export default function BarberProfile() {
  const { toast } = useToast();
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule[]>([]);
  const [originalWeeklySchedule, setOriginalWeeklySchedule] = useState<WeeklySchedule[]>([]);

  const { data: authData } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
  });

  const { data: barberData } = useQuery({
    queryKey: ['/api/barber/stats'],
    enabled: !!authData,
  });

  const { data: barbersData } = useQuery<Barber[]>({
    queryKey: ['/api/barbers'],
    enabled: !!barberData,
  });

  const form = useForm<UpdateBarberProfileInput>({
    resolver: zodResolver(updateBarberProfileSchema),
    defaultValues: {
      name: '',
      email: '',
      currentPassword: '',
      newPassword: '',
    },
  });

  useEffect(() => {
    if (authData && barberData && barbersData) {
      const barberName = (barberData as any).barberName || '';
      const currentBarber = barbersData.find((b) => b.name === barberName);
      
      form.reset({
        name: barberName,
        email: authData.user.email,
        currentPassword: '',
        newPassword: '',
      });

      if (currentBarber && currentBarber.weeklySchedule) {
        setWeeklySchedule(currentBarber.weeklySchedule);
        setOriginalWeeklySchedule(currentBarber.weeklySchedule);
      }
    }
  }, [authData, barberData, barbersData, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateBarberProfileInput) => {
      await apiRequest('PATCH', '/api/barber/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/barber/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/barbers'] });
      
      setOriginalWeeklySchedule(weeklySchedule);
      
      toast({
        title: 'Perfil actualizado',
        description: 'Tu perfil ha sido actualizado correctamente',
      });
      form.reset({
        name: form.getValues('name'),
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

  const onSubmit = (data: UpdateBarberProfileInput) => {
    const payload: UpdateBarberProfileInput = {};
    
    const originalName = (barberData as any)?.barberName || '';
    const originalEmail = authData?.user.email || '';
    
    if (data.name && data.name !== originalName) {
      payload.name = data.name;
    }
    
    if (data.email && data.email !== originalEmail) {
      payload.email = data.email;
    }
    
    if (data.newPassword) {
      payload.currentPassword = data.currentPassword;
      payload.newPassword = data.newPassword;
    }

    // Compare weeklySchedule with original using JSON.stringify
    // Send if different, including when it's an empty array (barber wants to clear schedule)
    const scheduleChanged = JSON.stringify(weeklySchedule) !== JSON.stringify(originalWeeklySchedule);
    if (scheduleChanged) {
      payload.weeklySchedule = JSON.stringify(weeklySchedule) as any;
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
        <p className="text-muted-foreground">Administra tu información personal y horario</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información personal</CardTitle>
              <CardDescription>Actualiza tu nombre y email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={(barberData as any)?.barberName || 'Tu nombre'}
                        data-testid="input-name"
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
                        placeholder="barbero@sparta.com"
                        data-testid="input-email"
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

          <Card>
            <CardHeader>
              <CardTitle>Horario de disponibilidad</CardTitle>
              <CardDescription>Configura tu horario semanal de trabajo</CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyScheduleEditor
                value={weeklySchedule}
                onChange={setWeeklySchedule}
              />
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
