import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { ClientWithStats } from '@shared/schema';

export default function Clients() {
  const { data: clients, isLoading } = useQuery<ClientWithStats[]>({
    queryKey: ['/api/admin/clients'],
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Todos los clientes registrados
          </p>
        </div>

        <Card>
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Total Citas</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No hay clientes registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  clients?.map((client) => (
                    <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                      <TableCell className="font-medium" data-testid="text-client-name">
                        {client.fullName}
                      </TableCell>
                      <TableCell data-testid="text-client-email">
                        {client.email}
                      </TableCell>
                      <TableCell data-testid="text-client-phone">
                        {client.phoneE164}
                      </TableCell>
                      <TableCell>
                        <Badge data-testid="badge-appointment-count">
                          {client.appointmentCount} citas
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm" data-testid="text-client-notes">
                        {client.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
