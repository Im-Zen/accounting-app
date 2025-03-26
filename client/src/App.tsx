import { useEffect, lazy, Suspense } from 'react';
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/MainLayout";

// Pages with lazy loading
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Employees = lazy(() => import('./pages/Employees'));
const Accounting = lazy(() => import('./pages/Accounting'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));

// Add dark mode class
const applyDarkMode = () => {
  document.documentElement.classList.add('dark');
};

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Direct access without authentication
function AuthenticatedRoute({ component: Component, ...rest }: any) {
  const [, setLocation] = useLocation();
  
  // Auto-login as admin on component mount
  useEffect(() => {
    // Create a mock admin user if not already logged in
    if (!localStorage.getItem('user')) {
      const adminUser = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      };
      localStorage.setItem('user', JSON.stringify(adminUser));
      localStorage.setItem('isAdmin', 'true');
    }
  }, []);

  return (
    <MainLayout>
      <Component {...rest} />
    </MainLayout>
  );
}

function Router() {
  // Redirect to dashboard on any location change
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    if (location !== '/dashboard' && location !== '/employees' && 
        location !== '/accounting' && location !== '/reports' && 
        location !== '/settings') {
      setLocation('/dashboard');
    }
  }, [location, setLocation]);
  
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/dashboard">
          {(params) => <AuthenticatedRoute component={Dashboard} params={params} />}
        </Route>
        <Route path="/employees">
          {(params) => <AuthenticatedRoute component={Employees} params={params} />}
        </Route>
        <Route path="/accounting">
          {(params) => <AuthenticatedRoute component={Accounting} params={params} />}
        </Route>
        <Route path="/reports">
          {(params) => <AuthenticatedRoute component={Reports} params={params} />}
        </Route>
        <Route path="/settings">
          {(params) => <AuthenticatedRoute component={Settings} params={params} />}
        </Route>
        <Route path="/">
          {(params) => <AuthenticatedRoute component={Dashboard} params={params} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  // Apply dark mode on app load
  useEffect(() => {
    applyDarkMode();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
