import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AdminLayout from '@/components/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { updateConfigSchema, type Config, type UpdateConfigInput } from '@shared/schema';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const { toast } = useToast();

  const { data: config, isLoading } = useQuery<Config>({
    queryKey: ['/api/config'],
  });

  const form = useForm<UpdateConfigInput>({
    resolver: zodResolver(updateConfigSchema),
    values: config ? {
      businessName: config.businessName,
      timezone: config.timezone,
      currency: config.currency,
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateConfigInput) => {
      await apiRequest('PUT', '/api/admin/config', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/config'] });
      toast({
        title: 'Configuración actualizada',
        description: 'Los cambios se han guardado correctamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar la configuración',
        variant: 'destructive',
      });
    },
  });

  function onSubmit(data: UpdateConfigInput) {
    updateMutation.mutate(data);
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">
            Ajustes generales del sistema
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="general" data-testid="tab-general">
              General
            </TabsTrigger>
            <TabsTrigger value="email" data-testid="tab-email">
              Email
            </TabsTrigger>
            <TabsTrigger value="whatsapp" data-testid="tab-whatsapp">
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="vapid" data-testid="tab-vapid">
              VAPID Keys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Negocio</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-business-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zona Horaria</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="America/Bogota" data-testid="input-timezone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moneda</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="COP" data-testid="input-currency" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    data-testid="button-save-general"
                  >
                    {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </form>
              </Form>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Configuración SMTP</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configura el servidor SMTP para enviar notificaciones por email.
                  </p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="smtpHost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Host SMTP</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="smtp.gmail.com" data-testid="input-smtp-host" />
                          </FormControl>
                          <FormDescription>
                            Servidor SMTP (ej: smtp.gmail.com, smtp-mail.outlook.com)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="smtpPort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Puerto SMTP</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="587"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              data-testid="input-smtp-port"
                            />
                          </FormControl>
                          <FormDescription>
                            Puerto (587 para TLS, 465 para SSL)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="smtpUser"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usuario SMTP</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="tu-email@gmail.com" data-testid="input-smtp-user" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="smtpPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contraseña SMTP</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="••••••••" data-testid="input-smtp-password" />
                          </FormControl>
                          <FormDescription>
                            Para Gmail, usa una contraseña de aplicación
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="smtpFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Remitente</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="noreply@barberiasparta.com" data-testid="input-smtp-from" />
                          </FormControl>
                          <FormDescription>
                            Dirección de email que aparecerá como remitente
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="smtpTls"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-1"
                              data-testid="checkbox-smtp-tls"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Usar TLS
                            </FormLabel>
                            <FormDescription>
                              Recomendado para la mayoría de servidores SMTP
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                      data-testid="button-save-email"
                    >
                      {updateMutation.isPending ? 'Guardando...' : 'Guardar Configuración Email'}
                    </Button>
                  </form>
                </Form>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">WhatsApp Cloud API</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configura la integración con WhatsApp para enviar notificaciones automáticas.
                  </p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="whatsappToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token de Acceso</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="EAAxx..." data-testid="input-whatsapp-token" />
                          </FormControl>
                          <FormDescription>
                            Token permanente de WhatsApp Cloud API
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="whatsappPhoneNumberId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number ID</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123456789" data-testid="input-whatsapp-phone-id" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="whatsappBusinessId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Account ID</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123456789" data-testid="input-whatsapp-business-id" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="whatsappFromNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de WhatsApp</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+573001234567" data-testid="input-whatsapp-from-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                      data-testid="button-save-whatsapp"
                    >
                      {updateMutation.isPending ? 'Guardando...' : 'Guardar Configuración WhatsApp'}
                    </Button>
                  </form>
                </Form>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="vapid">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">VAPID Keys</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Llaves para notificaciones push web. Solo lectura.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">VAPID Public Key</label>
                    <Input
                      value={config?.vapidPublicKey || 'No configurado'}
                      readOnly
                      className="mt-1 font-mono text-xs"
                      data-testid="input-vapid-public-key"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">VAPID Private Key</label>
                    <Input
                      value="*********************** (encriptado)"
                      readOnly
                      className="mt-1"
                      data-testid="input-vapid-private-key"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      La llave privada está encriptada y no se puede mostrar
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
