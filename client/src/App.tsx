import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import BookingFlow from "@/pages/BookingFlow";
import DashboardPage from "@/pages/admin/Dashboard";
import Appointments from "@/pages/admin/Appointments";
import Services from "@/pages/admin/Services";
import Barbers from "@/pages/admin/Barbers";
import Clients from "@/pages/admin/Clients";
import Settings from "@/pages/admin/Settings";
import BarberDashboard from "@/pages/barber/Dashboard";
import BarberAppointments from "@/pages/barber/Appointments";
import BarberProfile from "@/pages/barber/Profile";
import ClientDashboard from "@/pages/client/Dashboard";
import ClientAppointments from "@/pages/client/Appointments";
import ClientProfile from "@/pages/client/Profile";
import AdminProfile from "@/pages/admin/Profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/book" component={BookingFlow} />
      <Route path="/admin" component={DashboardPage} />
      <Route path="/admin/appointments" component={Appointments} />
      <Route path="/admin/services" component={Services} />
      <Route path="/admin/barbers" component={Barbers} />
      <Route path="/admin/clients" component={Clients} />
      <Route path="/admin/settings" component={Settings} />
      <Route path="/admin/profile" component={AdminProfile} />
      <Route path="/barber" component={BarberDashboard} />
      <Route path="/barber/appointments" component={BarberAppointments} />
      <Route path="/barber/profile" component={BarberProfile} />
      <Route path="/client" component={ClientDashboard} />
      <Route path="/client/appointments" component={ClientAppointments} />
      <Route path="/client/profile" component={ClientProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
