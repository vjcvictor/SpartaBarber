import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar, Users, DollarSign, UserCheck, CalendarDays, CalendarIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

type DatePreset = '5d' | '7d' | '30d' | 'month' | 'year' | 'custom';

export default function AdminDashboard() {
  const now = new Date();
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(now, 4), 'yyyy-MM-dd'), // Últimos 5 días
    endDate: format(now, 'yyyy-MM-dd'),
  });
  const [activePreset, setActivePreset] = useState<DatePreset>('5d');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

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
      case '5d':
        startDate = subDays(now, 4);
        break;
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
      case 'custom':
        return; // Don't change anything for custom
    }

    setDateRange({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(now, 'yyyy-MM-dd'),
    });
    setActivePreset(preset);
  };

  const handleCustomDateSelect = (range: { from: Date | undefined; to: Date | undefined }) => {
    setCustomDateRange(range);
    if (range.from && range.to) {
      setDateRange({
        startDate: format(range.from, 'yyyy-MM-dd'),
        endDate: format(range.to, 'yyyy-MM-dd'),
      });
      setActivePreset('custom');
    }
  };

  const formatChartDate = (dateStr: string) => {
    // Parse date string as local date (not UTC) to avoid timezone shift
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return format(date, 'dd/MMM', { locale: es });
  };

  console.log('DASHBOARD STATS:', stats);

  const chartData = stats?.timeSeries?.map(point => ({
    date: formatChartDate(point.date),
    citas: point.appointments,
    ingresos: point.revenueCOP,
  })) || [];

  const barberChartData = stats?.barberStats?.map(item => ({
    name: item.barberName,
    citas: item.completedAppointments,
  })) || [];

  const serviceChartData = stats?.serviceStats?.map(item => ({
    name: item.serviceName,
    cantidad: item.count,
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
            variant={activePreset === '5d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetChange('5d')}
            data-testid="button-preset-5d"
          >
            Últimos 5 días
          </Button>
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={activePreset === 'custom' ? 'default' : 'outline'}
                size="sm"
                data-testid="button-preset-custom"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Personalizado
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={{ from: customDateRange.from, to: customDateRange.to }}
                onSelect={(range: any) => handleCustomDateSelect(range || { from: undefined, to: undefined })}
                numberOfMonths={2}
                locale={es}
              />
            </PopoverContent>
          </Popover>
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
            {/* 1. Citas en el período */}
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

            {/* 2. Ingresos en el período */}
            <Card className="p-6" data-testid="card-ingresos">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos en el período</p>
                  <p className="text-2xl font-bold" data-testid="text-revenue">
                    ${stats.revenueThisMonth.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            </Card>

            {/* 3. Clientes en el periodo */}
            <Card className="p-6" data-testid="card-clientes">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <UserCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clientes en el periodo</p>
                  <p className="text-2xl font-bold" data-testid="text-total-clients">
                    {stats.clientsInPeriod ?? 0}
                  </p>
                </div>
              </div>
            </Card>

            {/* 4. Citas Hoy (solo visible cuando activePreset === '5d' - por defecto) */}
            {activePreset === '5d' && (
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
            )}
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Barber Performance Chart */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Citas Completadas por Barbero</h2>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : barberChartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No hay datos disponibles
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barberChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  className="text-sm"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis className="text-sm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  formatter={(value: number) => [value, 'Citas']}
                />
                <Bar
                  dataKey="citas"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  name="Citas Completadas"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Service Usage Chart */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Servicios Más Solicitados</h2>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : serviceChartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No hay datos disponibles
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  className="text-sm"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis className="text-sm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  formatter={(value: number) => [value, 'Servicios']}
                />
                <Bar
                  dataKey="cantidad"
                  fill="hsl(142.1 76.2% 36.3%)"
                  radius={[4, 4, 0, 0]}
                  name="Cantidad"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
