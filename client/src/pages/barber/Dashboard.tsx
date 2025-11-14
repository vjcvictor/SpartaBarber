import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfMonth, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import BarberLayout from '@/components/BarberLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, DollarSign, CalendarDays, UserCheck } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { Appointment, BarberDashboardStats } from '@shared/schema';

const TIMEZONE = 'America/Bogota';

const COLORS = ['#f59f0a', '#3a312c', '#b8ac94', '#1d1816', '#8b7355', '#d4c5a9'];

type DatePreset = '7d' | '30d' | 'month' | 'year';

export default function BarberDashboard() {
  const now = new Date();
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(now, 6), 'yyyy-MM-dd'),
    endDate: format(now, 'yyyy-MM-dd'),
  });
  const [activePreset, setActivePreset] = useState<DatePreset>('7d');
  const [showOnlyToday, setShowOnlyToday] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<BarberDashboardStats>({
    queryKey: ['/api/barber/stats', dateRange],
  });

  const { data: appointments, isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/barber/appointments'],
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

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  const startDateObj = new Date(dateRange.startDate + 'T00:00:00');
  const endDateObj = new Date(dateRange.endDate + 'T23:59:59');

  const filteredAppointments = showOnlyToday
    ? appointments?.filter((appt) => {
        const apptDate = new Date(appt.startDateTime);
        return apptDate >= startOfToday && 
               apptDate < endOfToday &&
               (appt.status === 'agendado' || appt.status === 'reagendado');
      }) || []
    : appointments?.filter((appt) => {
        const apptDate = new Date(appt.startDateTime);
        return apptDate >= startDateObj && 
               apptDate <= endDateObj &&
               (appt.status === 'agendado' || appt.status === 'reagendado' || appt.status === 'completado');
      }) || [];

  function formatDateTime(dateTime: string) {
    const zonedDate = toZonedTime(new Date(dateTime), TIMEZONE);
    return format(zonedDate, "HH:mm");
  }

  function formatDate(dateTime: string) {
    const zonedDate = toZonedTime(new Date(dateTime), TIMEZONE);
    return format(zonedDate, "dd/MMM/yyyy", { locale: es });
  }

  function formatChartDate(dateStr: string) {
    // Parse date string as local date (not UTC) to avoid timezone shift
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return format(date, 'dd/MMM', { locale: es });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'agendado':
        return <Badge data-testid={`badge-status-${status}`}>Agendado</Badge>;
      case 'cancelado':
        return <Badge variant="destructive" data-testid={`badge-status-${status}`}>Cancelado</Badge>;
      case 'reagendado':
        return <Badge variant="secondary" data-testid={`badge-status-${status}`}>Reagendado</Badge>;
      case 'completado':
        return <Badge data-testid={`badge-status-${status}`}>Completado</Badge>;
      default:
        return <Badge variant="outline" data-testid={`badge-status-${status}`}>{status}</Badge>;
    }
  }

  const chartData = stats?.timeSeries?.map(point => ({
    date: formatChartDate(point.date),
    citas: point.appointments,
    ingresos: point.revenueCOP,
  })) || [];

  const pieChartData = stats?.serviceBreakdown?.map(service => ({
    name: service.serviceName,
    value: service.appointments,
  })) || [];

  return (
    <BarberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-welcome-barber">
            Bienvenido, {stats?.barberName || 'Barbero'}
          </h1>
          <p className="text-muted-foreground">
            Administra tus citas y visualiza tu agenda
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

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-period-appointments">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Citas en el período</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="stat-period-appointments">
                  {stats?.periodAppointments || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-appointments-today">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="stat-appointments-today">
                  {stats?.appointmentsToday || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-revenue">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos estimados</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="stat-revenue">
                  ${stats?.periodRevenueCOP.toLocaleString('es-CO') || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-unique-clients">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes atendidos</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="stat-unique-clients">
                  {stats?.uniqueClientsInPeriod || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Citas por día</h2>
            {statsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="w-full h-full" />
              </div>
            ) : chartData.length === 0 ? (
              <div 
                className="h-[300px] flex items-center justify-center text-muted-foreground"
                data-testid="text-no-chart-data"
              >
                No hay datos disponibles para el período seleccionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="citas" fill="#f59f0a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Distribución de servicios</h2>
            {statsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="w-full h-full" />
              </div>
            ) : pieChartData.length === 0 ? (
              <div 
                className="h-[300px] flex items-center justify-center text-muted-foreground"
                data-testid="text-no-pie-data"
              >
                No hay datos disponibles para el período seleccionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Appointments Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{showOnlyToday ? 'Citas de Hoy' : 'Citas en el período'}</CardTitle>
                <CardDescription>
                  {filteredAppointments.length} cita{filteredAppointments.length !== 1 ? 's' : ''} programada{filteredAppointments.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOnlyToday(!showOnlyToday)}
                data-testid="button-toggle-today"
              >
                {showOnlyToday ? 'Ver período completo' : 'Solo hoy'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No tienes citas {showOnlyToday ? 'para hoy' : 'en el período seleccionado'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAppointments.map((appt) => (
                      <TableRow key={appt.id} data-testid={`row-appointment-${appt.id}`}>
                        <TableCell data-testid="text-appointment-date">
                          {formatDate(appt.startDateTime)}
                        </TableCell>
                        <TableCell className="font-medium" data-testid="text-appointment-time">
                          {formatDateTime(appt.startDateTime)}
                        </TableCell>
                        <TableCell data-testid="text-client-name">
                          {appt.client?.fullName || 'N/A'}
                        </TableCell>
                        <TableCell data-testid="text-service-name">
                          {appt.service?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(appt.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </BarberLayout>
  );
}
