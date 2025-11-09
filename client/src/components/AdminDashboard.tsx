import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Users, DollarSign, UserCheck, CalendarDays } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfMonth, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DashboardStats } from '@shared/schema';

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

type DatePreset = '7d' | '30d' | 'month' | 'year';

export default function AdminDashboard() {
  const now = new Date();
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(now, 6), 'yyyy-MM-dd'),
    endDate: format(now, 'yyyy-MM-dd'),
  });
  const [activePreset, setActivePreset] = useState<DatePreset>('7d');

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/stats', dateRange],
    queryFn: async () => {
      const url = new URL('/api/admin/stats', window.location.origin);
      url.searchParams.set('startDate', dateRange.startDate);
      url.searchParams.set('endDate', dateRange.endDate);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch admin stats');
      return res.json();
    },
  });

  const handlePresetChange = (preset: DatePreset) => {
    const now = new Date();
    let startDate: Date;
    
    switch (preset) {
      case '7d':
        startDate = subDays(now, 6);
        break;
      case '30d':
        startDate = subDays(now, 29);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        break;
    }
    
    setDateRange({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(now, 'yyyy-MM-dd'),
    });
    setActivePreset(preset);
  };

  const formatChartDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'dd/MMM', { locale: es });
  };

  const chartData = stats?.timeSeries?.map(point => ({
    date: formatChartDate(point.date),
    citas: point.appointments,
    ingresos: point.revenueCOP,
  })) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general de la barbería
        </p>
      </div>

      {/* Date Filter Presets */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <CalendarDays className="w-5 h-5 text-muted-foreground mr-2" />
          <span className="text-sm font-medium mr-2">Período:</span>
          <Button
            variant={activePreset === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetChange('7d')}
            data-testid="button-preset-7d"
          >
            Últimos 7 días
          </Button>
          <Button
            variant={activePreset === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetChange('30d')}
            data-testid="button-preset-30d"
          >
            Últimos 30 días
          </Button>
          <Button
            variant={activePreset === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetChange('month')}
            data-testid="button-preset-month"
          >
            Mes actual
          </Button>
          <Button
            variant={activePreset === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetChange('year')}
            data-testid="button-preset-year"
          >
            Año actual
          </Button>
        </div>
      </Card>

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
                  <p className="text-sm text-muted-foreground">Citas en el período</p>
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
                  <p className="text-sm text-muted-foreground">Ingresos en el período (COP)</p>
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
        <h2 className="text-xl font-semibold mb-6">Citas en el Período</h2>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div 
            className="h-[300px] flex items-center justify-center text-muted-foreground"
            data-testid="text-no-data"
          >
            No hay datos disponibles para el período seleccionado
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="date" 
                className="text-sm"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="text-sm" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'ingresos') {
                    return [`$${value.toLocaleString('es-CO')}`, 'Ingresos'];
                  }
                  return [value, 'Citas'];
                }}
              />
              <Bar 
                dataKey="citas" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]} 
                name="Citas"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
