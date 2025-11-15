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
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Clientes</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Todos los clientes registrados
          </p>
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
                  <TableHead className="min-w-[120px] whitespace-nowrap">Teléfono</TableHead>
                  <TableHead className="min-w-[100px] whitespace-nowrap">Total Citas</TableHead>
                  <TableHead className="min-w-[150px]">Notas</TableHead>
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
                      <TableCell className="whitespace-nowrap" data-testid="text-client-email">
                        {client.email}
                      </TableCell>
                      <TableCell className="whitespace-nowrap" data-testid="text-client-phone">
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
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
