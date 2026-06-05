import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  BarChart3,
  FolderKanban,
  Users,
  FileText,
  Receipt,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  Search,
  DollarSign,
  MapPin,
  Sparkles,
  Package,
  Wrench,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NotificationCenter } from '@/components/shared/NotificationCenter';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { useState } from 'react';


export function AppLayout() {
  const { profile, signOut, isAdmin, isStaff, isClient } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Global search keyboard shortcut
  useState(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { icon: Sparkles, label: 'Command Center', path: '/', roles: ['admin', 'staff', 'client'] },
    { icon: DollarSign, label: 'Financial Intelligence', path: '/financial-intelligence', roles: ['admin', 'staff'] },
    { icon: MapPin, label: 'Field Operations', path: '/field-operations', roles: ['admin', 'staff'] },
    { icon: BarChart3, label: 'Analytics', path: '/analytics', roles: ['admin', 'staff'] },
    { icon: FolderKanban, label: 'Projects', path: '/projects', roles: ['admin', 'staff', 'client'] },
    { icon: Users, label: 'Clients', path: '/clients', roles: ['admin', 'staff'] },
    { icon: FileText, label: 'Proposals', path: '/proposals', roles: ['admin', 'staff', 'client'] },
    { icon: Receipt, label: 'Invoices', path: '/invoices', roles: ['admin', 'staff', 'client'] },
    { icon: ClipboardList, label: 'Reports', path: '/reports', roles: ['admin', 'staff', 'client'] },
    { icon: Package, label: 'Materials', path: '/materials', roles: ['admin', 'staff'] },
    { icon: Wrench, label: 'Equipment', path: '/equipment', roles: ['admin', 'staff'] },
    { icon: Shield, label: 'Safety', path: '/safety/incidents', roles: ['admin', 'staff'] },
    { icon: DollarSign, label: 'Budget', path: '/budget/variance', roles: ['admin', 'staff'] },
    { icon: Settings, label: 'Admin', path: '/admin', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(profile?.role || ''));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-semibold text-sidebar-foreground">LynkPro</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Decision Intelligence</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r border-border bg-sidebar">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0 bg-sidebar">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
              <h2 className="text-lg font-semibold text-foreground">Welcome, {profile?.full_name || profile?.email}</h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Global Search */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchOpen(true)}
                className="gap-2"
              >
                <Search className="h-5 w-5" />
                <span className="hidden md:inline text-xs text-muted-foreground">⌘K</span>
              </Button>

              {/* Notifications */}
              <NotificationCenter />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {profile?.full_name?.[0] || profile?.email?.[0] || 'U'}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin/firm-settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Firm Settings
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
