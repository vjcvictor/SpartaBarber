import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { parsePhoneNumber, type CountryCode } from 'libphonenumber-js';
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
import type { ClientDraftData } from '@/lib/store';

const clientFormSchema = z.object({
  fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  countryCode: z.string().default('+57'),
  phone: z.string().min(7, 'El teléfono debe tener al menos 7 dígitos'),
  email: z.string().email('Ingresa un email válido'),
  notes: z.string().optional(),
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

type ClientFormData = z.infer<typeof clientFormSchema>;

export interface ClientFormOutput {
  fullName: string;
  phoneE164: string;
  email: string;
  notes: string;
}

interface ClientFormProps {
  draftData: ClientDraftData;
  dataVersion: number;
  onChange: (data: Partial<ClientDraftData>) => void;
  onSubmit: (data: ClientFormOutput) => void;
}

export default function ClientForm({ draftData, dataVersion, onChange, onSubmit }: ClientFormProps) {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      fullName: draftData.fullName || '',
      countryCode: draftData.countryCode || '+57',
      phone: draftData.phone || '',
      email: draftData.email || '',
      notes: draftData.notes || '',
    },
  });

  // Reset form when dataVersion changes (deliberate hydration)
  useEffect(() => {
    form.reset({
      fullName: draftData.fullName || '',
      countryCode: draftData.countryCode || '+57',
      phone: draftData.phone || '',
      email: draftData.email || '',
      notes: draftData.notes || '',
    });
  }, [dataVersion]);

  // Watch form changes and sync to store
  useEffect(() => {
    const subscription = form.watch((value) => {
      onChange({
        fullName: value.fullName || '',
        countryCode: value.countryCode || '+57',
        phone: value.phone || '',
        email: value.email || '',
        notes: value.notes || '',
      });
    });
    return () => subscription.unsubscribe();
  }, [onChange]);

  const handleSubmit = (data: ClientFormData) => {
    try {
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
                        <SelectItem value="+58">🇻🇪 +58</SelectItem>
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
