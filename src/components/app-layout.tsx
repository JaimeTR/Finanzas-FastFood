'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  DollarSign,
  Receipt,
  Lightbulb,
  Settings,
  LogOut,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { userService } from '@/lib/supabase-services';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout, loading, businessName, reloadUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Hooks de estado deben declararse antes de cualquier return condicional
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Sincronizar estados del formulario con el usuario cuando esté disponible
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  // Cuando se cierre el diálogo, restaurar avatar original y limpiar estado
  useEffect(() => {
    if (!settingsOpen) {
      // Restaurar avatar del usuario (evita que el preview se quede en memoria/estado)
      if (user) {
        setAvatarUrl(user.avatarUrl || '');
      }
      setNewPassword('');
    }
  }, [settingsOpen, user]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <p>Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
    { href: '/sales', label: 'Ventas', icon: DollarSign },
    { href: '/expenses', label: 'Gastos', icon: Receipt },
    { href: '/advice', label: 'Asesoramiento', icon: Lightbulb },
    { href: '/attributes', label: 'Atributos', icon: Settings },
    { href: '/settings', label: 'Configuración', icon: Settings, adminOnly: true },
  ];

  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) =>
                (!item.adminOnly || user.role === 'admin') && (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      className="text-sidebar-foreground"
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4 text-accent" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
             {/* Can be used for extra links or info */}
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:pt-4">
            <SidebarTrigger className="sm:hidden" />
            <div className="ml-auto flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 rounded-full border-2 border-transparent hover:border-primary"
                  >
                    <Avatar className="h-8 w-8">
                       {(user.avatarUrl || avatarUrl) ? (
                         <AvatarImage src={(user.avatarUrl || avatarUrl) as string} alt={user.name} />
                       ) : (
                         userAvatar && <AvatarImage src={userAvatar.imageUrl} alt={user.name} data-ai-hint={userAvatar.imageHint} />
                       )}
                       <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{user.name}</span>
                    <ChevronDown className="h-4 w-4 hidden sm:inline" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSettingsOpen(true)}>Configuración</DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      router.push('/login');
                    }}
                    className="text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 pb-20 sm:pb-6">{children}</main>
          {/* Dialog de Configuración de Perfil */}
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configuración de Perfil</DialogTitle>
                <DialogDescription>Actualiza tu información personal y credenciales.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : userAvatar && <AvatarImage src={userAvatar.imageUrl} alt={name} />}
                    <AvatarFallback>{name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Nombre</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Correo</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Nueva contraseña</label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                  <p className="text-xs text-muted-foreground mt-1">Déjalo vacío si no deseas cambiarla.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancelar</Button>
                <Button
                  onClick={async () => {
                    try {
                      setSaving(true);
                      // Actualizar solo datos básicos; avatar se mantiene como está
                      if ((name !== user.name) || (email !== user.email)) {
                        await userService.updateUser(user.id, { name, email });
                      }
                      if (newPassword.trim()) {
                        await userService.updatePassword(user.id, newPassword.trim());
                      }
                      // Refrescar usuario en AuthContext para ver cambios inmediatamente
                      await reloadUser();
                      setSettingsOpen(false);
                    } catch (e) {
                      console.error('Error updating profile', e);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Bottom Navigation para móvil */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <ul className="grid grid-cols-4">
              {navItems
                .filter((item) => !item.adminOnly || user.role === 'admin')
                .slice(0,4)
                .map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link href={item.href} className={`flex flex-col items-center justify-center py-2 text-xs ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                        <Icon className={`h-5 w-5 ${active ? 'text-primary' : ''}`} />
                        <span className="mt-0.5">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </nav>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
