import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Users, Scissors } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AuthResponse, AccessibleRole } from '@shared/schema';

export default function PanelSwitcher() {
  const [location, setLocation] = useLocation();
  const { data: authData, isLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
  });

  // Don't render if loading or no auth data
  if (isLoading || !authData) {
    return null;
  }

  // Don't render if user has only one accessible role
  if (authData.user.accessibleRoles.length <= 1) {
    return null;
  }

  // Determine current panel based on location
  const isAdminPanel = location.startsWith('/admin');
  const isBarberPanel = location.startsWith('/barber');
  
  const currentPanel = isAdminPanel ? 'admin' : isBarberPanel ? 'barber' : '';

  // Build available panel options based on accessible roles
  const panelOptions: Array<{ value: string; label: string; icon: typeof Users }> = [];
  
  if (authData.user.accessibleRoles.includes('ADMIN')) {
    panelOptions.push({
      value: 'admin',
      label: 'Panel de Administrador',
      icon: Users,
    });
  }
  
  if (authData.user.accessibleRoles.includes('BARBER')) {
    panelOptions.push({
      value: 'barber',
      label: 'Panel de Barbero',
      icon: Scissors,
    });
  }

  const handlePanelChange = (value: string) => {
    if (value === 'admin') {
      setLocation('/admin');
    } else if (value === 'barber') {
      setLocation('/barber');
    }
  };

  return (
    <Select value={currentPanel} onValueChange={handlePanelChange}>
      <SelectTrigger 
        className="w-[200px] h-9" 
        data-testid="select-panel-switcher"
      >
        <SelectValue placeholder="Seleccionar panel" />
      </SelectTrigger>
      <SelectContent data-testid="select-panel-content">
        {panelOptions.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            data-testid={`select-panel-${option.value}`}
          >
            <div className="flex items-center gap-2">
              <option.icon className="w-4 h-4" />
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
