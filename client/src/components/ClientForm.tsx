import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { parsePhoneNumber } from 'libphonenumber-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

const clientFormSchema = z.object({
  fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  countryCode: z.string().default('+57'),
  phone: z.string().min(7, 'El teléfono debe tener al menos 7 dígitos'),
  email: z.string().email('Ingresa un email válido'),
  notes: z.string().optional(),
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

type ClientFormData = z.infer<typeof clientFormSchema>;

export interface ClientFormOutput {
  fullName: string;
  phoneE164: string;
  email: string;
  notes: string;
}

interface ClientFormProps {
  initialData?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormOutput) => void;
}

export default function ClientForm({ initialData, onSubmit }: ClientFormProps) {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      countryCode: initialData?.countryCode || '+57',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      notes: initialData?.notes || '',
    },
  });

  const handleSubmit = (data: ClientFormData) => {
    try {
      const phoneNumber = parsePhoneNumber(data.phone, 'CO');
      const phoneE164 = phoneNumber.format('E.164');
      
      onSubmit({
        fullName: data.fullName,
        phoneE164,
        email: data.email,
        notes: data.notes || '',
      });
    } catch (error) {
      form.setError('phone', { message: 'Error al procesar el número de teléfono' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Tus Datos de Contacto</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Completa la información para confirmar tu cita
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Completo *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Juan Pérez" 
                    {...field} 
                    data-testid="input-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>Número de WhatsApp *</FormLabel>
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem className="w-24 sm:w-28">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-country">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="+57">🇨🇴 +57</SelectItem>
                        <SelectItem value="+1">🇺🇸 +1</SelectItem>
                        <SelectItem value="+52">🇲🇽 +52</SelectItem>
                        <SelectItem value="+34">🇪🇸 +34</SelectItem>
                      </SelectContent>
                    </Select>
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
                        {...field}
                        data-testid="input-phone"
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo Electrónico *</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="juan@ejemplo.com" 
                    {...field}
                    data-testid="input-email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas (Opcional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Alguna preferencia o comentario especial..."
                    className="resize-none"
                    rows={3}
                    {...field}
                    data-testid="input-notes"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            data-testid="button-submit-client-form"
          >
            Continuar
          </Button>
        </form>
      </Form>
    </div>
  );
}
