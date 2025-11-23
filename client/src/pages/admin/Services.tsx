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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { createServiceSchema, type Service, type CreateServiceInput } from '@shared/schema';
import { cn } from '@/lib/utils';

// Import specific icons from React Icons (same as ServiceSelection)
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

export default function Services() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { toast } = useToast();

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ['/api/admin/services'],
  });

  const form = useForm<CreateServiceInput>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      name: '',
      category: undefined as any,
      icon: '',
      priceCOP: 0,
      description: '',
      durationMin: 30,
      active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateServiceInput) => {
      await apiRequest('POST', '/api/admin/services', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({
        title: 'Servicio creado',
        description: 'El servicio se ha creado correctamente',
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al crear el servicio',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateServiceInput> }) => {
      await apiRequest('PUT', `/api/admin/services/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({
        title: 'Servicio actualizado',
        description: 'El servicio se ha actualizado correctamente',
      });
      setIsDialogOpen(false);
      setEditingService(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar el servicio',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({
        title: 'Servicio eliminado',
        description: 'El servicio se ha desactivado correctamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar el servicio',
        variant: 'destructive',
      });
    },
  });

  function handleEdit(service: Service) {
    setEditingService(service);
    form.reset({
      name: service.name,
      category: service.category,
      icon: service.icon,
      priceCOP: service.priceCOP,
      description: service.description,
      durationMin: service.durationMin,
      active: service.active,
    });
    setIsDialogOpen(true);
  }

  function handleDialogClose(open: boolean) {
    if (!open) {
      setIsDialogOpen(false);
      setEditingService(null);
      form.reset({
        name: '',
        category: undefined as any,
        icon: '',
        priceCOP: 0,
        description: '',
        durationMin: 30,
        active: true,
      });
    } else {
      setIsDialogOpen(true);
    }
  }

  function onSubmit(data: CreateServiceInput) {
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Servicios</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gestiona los servicios de la barbería
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-service">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Servicio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                </DialogTitle>
                <DialogDescription>
                  {editingService ? 'Actualiza la información del servicio' : 'Crea un nuevo servicio para la barbería'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form} key={editingService?.id || 'new'}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-service-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoría</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-service-category">
                                <SelectValue placeholder="Selecciona una categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Combo completo">Combo completo</SelectItem>
                              <SelectItem value="Combos de tres servicios">Combos de tres servicios</SelectItem>
                              <SelectItem value="Combos de dos servicios">Combos de dos servicios</SelectItem>
                              <SelectItem value="Servicios Individuales">Servicios Individuales</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icono</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 p-2 border rounded-md bg-zinc-900/50">
                            {Object.entries(IconMap).map(([name, Icon]) => (
                              <div
                                key={name}
                                className={cn(
                                  "flex flex-col items-center justify-center p-2 rounded-md cursor-pointer transition-all hover:bg-zinc-800 aspect-square",
                                  field.value === name ? "bg-amber-500/20 border-2 border-amber-500" : "border border-transparent"
                                )}
                                onClick={() => field.onChange(name)}
                                title={name}
                              >
                                <Icon className={cn("w-6 h-6 mb-1", field.value === name ? "text-amber-500" : "text-zinc-400")} />
                              </div>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground mt-1">
                          Seleccionado: {field.value || 'Ninguno'}
                        </p>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priceCOP"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-service-price"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="durationMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duración (minutos)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-service-duration"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} data-testid="input-service-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-service-active"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Activo</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
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
                      data-testid="button-submit-service"
                    >
                      {editingService ? 'Actualizar' : 'Crear'}
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
              <Table className="min-w-[850px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Nombre</TableHead>
                    <TableHead className="min-w-[150px]">Categoría</TableHead>
                    <TableHead className="min-w-[60px]">Icono</TableHead>
                    <TableHead className="min-w-[100px] whitespace-nowrap">Precio</TableHead>
                    <TableHead className="min-w-[110px] whitespace-nowrap">Duración (min)</TableHead>
                    <TableHead className="min-w-[90px]">Estado</TableHead>
                    <TableHead className="text-right min-w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No hay servicios
                      </TableCell>
                    </TableRow>
                  ) : (
                    services?.map((service) => {
                      const IconComponent = IconMap[service.icon];
                      return (
                        <TableRow key={service.id} data-testid={`row-service-${service.id}`}>
                          <TableCell className="font-medium" data-testid="text-service-name">
                            {service.name}
                          </TableCell>
                          <TableCell data-testid="text-service-category">
                            <Badge variant="outline">{service.category}</Badge>
                          </TableCell>
                          <TableCell className="text-2xl" data-testid="text-service-icon">
                            {IconComponent ? (
                              <IconComponent className="w-6 h-6 text-amber-500" />
                            ) : (
                              <span>{service.icon}</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap" data-testid="text-service-price">
                            ${service.priceCOP.toLocaleString('es-CO')}
                          </TableCell>
                          <TableCell className="whitespace-nowrap" data-testid="text-service-duration">
                            {service.durationMin}
                          </TableCell>
                          <TableCell>
                            <Badge variant={service.active ? 'default' : 'secondary'} data-testid="badge-service-status">
                              {service.active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(service)}
                                data-testid="button-edit-service"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMutation.mutate(service.id)}
                                disabled={deleteMutation.isPending}
                                data-testid="button-delete-service"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
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
