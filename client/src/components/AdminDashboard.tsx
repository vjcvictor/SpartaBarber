import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Users, DollarSign, UserCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DashboardStats } from '@shared/schema';

const chartData = [
  { day: 'Lun', citas: 18 },
  { day: 'Mar', citas: 22 },
  { day: 'Mié', citas: 25 },
  { day: 'Jue', citas: 19 },
  { day: 'Vie', citas: 28 },
  { day: 'Sáb', citas: 15 },
];

function StatsCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/stats'],
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general de la barbería
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : stats ? (
          <>
            <Card className="p-6" data-testid="card-total-citas">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Citas</p>
                  <p className="text-2xl font-bold" data-testid="text-total-appointments">
                    {stats.totalAppointments}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6" data-testid="card-citas-hoy">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Citas Hoy</p>
                  <p className="text-2xl font-bold" data-testid="text-appointments-today">
                    {stats.appointmentsToday}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6" data-testid="card-ingresos">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos Este Mes (COP)</p>
                  <p className="text-2xl font-bold" data-testid="text-revenue">
                    ${stats.revenueThisMonth.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6" data-testid="card-clientes">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <UserCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Clientes</p>
                  <p className="text-2xl font-bold" data-testid="text-total-clients">
                    {stats.totalClients}
                  </p>
                </div>
              </div>
            </Card>
          </>
        ) : null}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Citas Esta Semana</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="day" className="text-sm" />
            <YAxis className="text-sm" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Bar dataKey="citas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
