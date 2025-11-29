import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AdminLayout from '@/components/AdminLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { parsePhoneNumber } from 'libphonenumber-js';
import {
  GiScissors,
  GiBeard,
  GiRazor,
  GiComb,
  GiTowel,
  GiMustache,
  GiStarsStack,
  GiMedal,
  GiTrophy,
  GiDiamondHard
} from 'react-icons/gi';
import { FaEye, FaSpa, FaStar, FaCrown, FaFire } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { createBarberSchema, updateBarberSchema, type Service, type WeeklySchedule } from '@shared/schema';
import type { CreateBarberInput, UpdateBarberInput } from '@shared/schema';
import WeeklyScheduleEditor from '@/components/WeeklyScheduleEditor';

interface BarberResponse {
  id: string;
  userId: string;
  name: string;
  email: string;
  photoUrl: string | null;
  phone: string | null;
  active: boolean;
  weeklySchedule: WeeklySchedule[];
  exceptions: any;
  services: string[];
}

interface BarberFormData {
  name: string;
  email: string;
  password?: string;
  photoUrl?: string;
  countryCode: string;
  phone: string;
  active: boolean;
  weeklySchedule: WeeklySchedule[];
  services: string[];
}

// Map string names to React Icon components
const IconMap: Record<string, IconType> = {
  'Scissors': GiScissors,
  'Beard': GiBeard,
  'Eye': FaEye,
  'Spa': FaSpa,
  'Razor': GiRazor,
  'Star': FaStar,
  'Towel': GiTowel,
  'Mustache': GiMustache,
  'Diamond': GiDiamondHard,
  'Fire': FaFire,
  'Medal': GiMedal,
  'Trophy': GiTrophy,
  'Stars': GiStarsStack,
  'Comb': GiComb,
  'Crown': FaCrown,
};

const DEFAULT_SCHEDULE: WeeklySchedule[] = [
  { dayOfWeek: 1, start: '09:00', end: '17:00', breaks: [] },
  { dayOfWeek: 2, start: '09:00', end: '17:00', breaks: [] },
  { dayOfWeek: 3, start: '09:00', end: '17:00', breaks: [] },
  { dayOfWeek: 4, start: '09:00', end: '17:00', breaks: [] },
  { dayOfWeek: 5, start: '09:00', end: '17:00', breaks: [] },
  { dayOfWeek: 6, start: '09:00', end: '14:00', breaks: [] },
];

export default function Barbers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<BarberResponse | null>(null);
  const { toast } = useToast();

  const { data: barbers, isLoading } = useQuery<BarberResponse[]>({
    queryKey: ['/api/admin/barbers'],
  });

  const { data: services } = useQuery<Service[]>({
    queryKey: ['/api/admin/services'],
  });

  const form = useForm<BarberFormData>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      photoUrl: '',
      countryCode: '+57',
      phone: '',
      active: true,
      weeklySchedule: DEFAULT_SCHEDULE,
      services: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateBarberInput) => {
      await apiRequest('POST', '/api/admin/barbers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/barbers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/barbers'] });
      toast({
        title: 'Barbero creado',
        description: 'El barbero se ha creado correctamente',
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al crear el barbero',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBarberInput }) => {
      await apiRequest('PUT', `/api/admin/barbers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/barbers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/barbers'] });
      toast({
        title: 'Barbero actualizado',
        description: 'El barbero se ha actualizado correctamente',
      });
      setIsDialogOpen(false);
      setEditingBarber(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar el barbero',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/barbers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/barbers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/barbers'] });
      toast({
        title: 'Barbero desactivado',
        description: 'El barbero se ha desactivado correctamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al desactivar el barbero',
        variant: 'destructive',
      });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('PUT', `/api/admin/barbers/${id}`, { active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/barbers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/barbers'] });
      toast({
        title: 'Barbero reactivado',
        description: 'El barbero se ha reactivado correctamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al reactivar el barbero',
        variant: 'destructive',
      });
    },
  });

  function handleEdit(barber: BarberResponse) {
    let countryCode = '+57';
    let phone = '';

    if (barber.phone) {
      try {
        // Parse phone number using libphonenumber-js
        const parsed = parsePhoneNumber(barber.phone);
        if (parsed) {
          countryCode = `+${parsed.countryCallingCode}`;
          phone = parsed.nationalNumber;
        } else {
          phone = barber.phone;
        }
      } catch (e) {
        console.error('Error parsing phone:', e);
        phone = barber.phone;
      }
    }

    setEditingBarber(barber);
    form.reset({
      name: barber.name,
      email: barber.email,
      password: '',
      photoUrl: barber.photoUrl || '',
      countryCode,
      phone,
      active: barber.active,
      weeklySchedule: barber.weeklySchedule,
      services: barber.services,
    });
    setIsDialogOpen(true);
  }

  function handleDialogClose(open: boolean) {
    if (!open) {
      setIsDialogOpen(false);
      setEditingBarber(null);
      form.reset({
        name: '',
        email: '',
        password: '',
        photoUrl: '',
        countryCode: '+57',
        phone: '',
        active: true,
        weeklySchedule: DEFAULT_SCHEDULE,
        services: [],
      });
    } else {
      setIsDialogOpen(true);
    }
  }

  function onSubmit(data: BarberFormData) {
    // Clean phone number (remove non-digits)
    const cleanPhone = data.phone.replace(/\D/g, '');

    const payload = {
      ...data,
      phone: cleanPhone ? `${data.countryCode}${cleanPhone}` : undefined,
      weeklySchedule: JSON.stringify(data.weeklySchedule),
    };

    if (editingBarber) {
      const updateData: UpdateBarberInput = {
        name: payload.name,
        email: payload.email,
        photoUrl: payload.photoUrl,
        phone: payload.phone,
        active: payload.active,
        weeklySchedule: payload.weeklySchedule,
        services: payload.services,
      };
      if (data.password) {
        updateData.password = data.password;
      }
      updateMutation.mutate({ id: editingBarber.id, data: updateData });
    } else {
      if (!payload.password) {
        toast({
          title: 'Error',
          description: 'La contraseña es requerida para crear un barbero',
          variant: 'destructive',
        });
        return;
      }
      const createData: CreateBarberInput = {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        photoUrl: payload.photoUrl,
        phone: payload.phone,
        active: payload.active,
        weeklySchedule: payload.weeklySchedule,
        services: payload.services,
      };
      createMutation.mutate(createData);
    }
  }

  const selectedServices = form.watch('services') || [];

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Barberos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gestiona el equipo de barberos
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-barber">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Barbero
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingBarber ? 'Editar Barbero' : 'Nuevo Barbero'}
                </DialogTitle>
                <DialogDescription>
                  {editingBarber ? 'Actualiza la información del barbero' : 'Crea un nuevo barbero'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-barber-name" />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="input-barber-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Contraseña {editingBarber && '(dejar vacío para no cambiar)'}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="password" data-testid="input-barber-password" />
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
                        control={form.control}
                        name="countryCode"
                        render={({ field }) => (
                          <FormItem className="w-32">
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
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
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="3001234567"
                                autoComplete="tel"
                                {...field}
                                data-testid="input-barber-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Barbero Activo
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Si se desactiva, no aparecerá disponible para nuevas citas.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="photoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Foto (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." data-testid="input-barber-photo" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weeklySchedule"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <WeeklyScheduleEditor
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="services"
                    render={() => (
                      <FormItem>
                        <FormLabel>Servicios</FormLabel>
                        <div className="space-y-2">
                          {services?.map((service) => (
                            <FormField
                              key={service.id}
                              control={form.control}
                              name="services"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={selectedServices.includes(service.id)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        const updated = checked
                                          ? [...current, service.id]
                                          : current.filter((id: string) => id !== service.id);
                                        field.onChange(updated);
                                      }}
                                      data-testid={`checkbox-service-${service.id}`}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-normal flex items-center gap-2">
                                      {(() => {
                                        const IconComponent = IconMap[service.icon];
                                        return IconComponent ? (
                                          <IconComponent className="w-5 h-5 text-amber-500" />
                                        ) : (
                                          <span>{service.icon}</span>
                                        );
                                      })()}
                                      {service.name}
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDialogClose(false)}
                      data-testid="button-cancel"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-submit-barber"
                    >
                      {editingBarber ? 'Actualizar' : 'Crear'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          {isLoading ? (
            <div className="p-4 sm:p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nombre</TableHead>
                    <TableHead className="min-w-[180px]">Email</TableHead>
                    <TableHead className="min-w-[120px]">Teléfono</TableHead>
                    <TableHead className="min-w-[100px]">Estado</TableHead>
                    <TableHead className="min-w-[200px]">Servicios</TableHead>
                    <TableHead className="text-right min-w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {barbers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No hay barberos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    barbers?.map((barber) => (
                      <TableRow key={barber.id} data-testid={`row-barber-${barber.id}`}>
                        <TableCell className="font-medium" data-testid="text-barber-name">
                          {barber.name}
                        </TableCell>
                        <TableCell className="whitespace-nowrap" data-testid="text-barber-email">
                          {barber.email}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {barber.phone || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={barber.active ? 'default' : 'destructive'}>
                            {barber.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {barber.services.map((serviceId) => {
                              const service = services?.find(s => s.id === serviceId);
                              if (!service) return null;
                              const IconComponent = IconMap[service.icon];
                              return (
                                <Badge key={serviceId} variant="secondary" data-testid="badge-barber-service" className="flex items-center gap-1">
                                  {IconComponent ? (
                                    <IconComponent className="w-4 h-4 text-amber-500" />
                                  ) : (
                                    <span>{service.icon}</span>
                                  )}
                                  {service.name}
                                </Badge>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(barber)}
                              data-testid="button-edit-barber"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {barber.active ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMutation.mutate(barber.id)}
                                disabled={deleteMutation.isPending}
                                title="Desactivar barbero"
                                data-testid="button-delete-barber"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => reactivateMutation.mutate(barber.id)}
                                disabled={reactivateMutation.isPending}
                                title="Reactivar barbero"
                              >
                                <RotateCcw className="w-4 h-4 text-green-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
