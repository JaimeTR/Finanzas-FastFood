'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User, Role, AuditLog } from '@/lib/types';
import { userService, auditLogService, businessSettingsService } from '@/lib/supabase-services';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  businessName: string;
  setBusinessName: (name: string) => void;
  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string) => void;
  reloadUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessNameState] = useState('Finanzas FastFood');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const addAuditLog = useCallback(
    async (action: string, details: string) => {
      if (!user) return;
      try {
        const newLog = await auditLogService.createAuditLog({
          action,
          userId: user.id,
          details
        });
        setAuditLogs(prev => [newLog, ...prev]);
      } catch (error) {
        console.error('Error creating audit log:', error);
      }
    },
    [user]
  );

  const reloadUser = useCallback(async () => {
    try {
      if (!user) return;
      const fresh = await userService.getUserById(user.id);
      if (fresh) {
        setUser(fresh);
        localStorage.setItem('fffinanzas-user', JSON.stringify(fresh));
      }
    } catch (error) {
      console.error('Error reloading user:', error);
    }
  }, [user]);
  
  const setBusinessName = async (name: string) => {
    if (!user) return;
    try {
      await businessSettingsService.updateBusinessSettings(name, user.id);
      await addAuditLog('Nombre del Negocio Cambiado', `El nombre cambió a "${name}"`);
      setBusinessNameState(name);
    } catch (error) {
      console.error('Error updating business name:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load audit logs
        const logs = await auditLogService.getAuditLogs();
        setAuditLogs(logs);

        // Load business settings
        const settings = await businessSettingsService.getBusinessSettings();
        if (settings) {
          setBusinessNameState(settings.businessName);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    if (user) {
      loadInitialData();
    }
  }, [user]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('fffinanzas-user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Validate user exists in database
          const foundUser = await userService.getUserById(parsedUser.id);
          if (foundUser) {
            setUser(foundUser);
          } else {
            localStorage.removeItem('fffinanzas-user');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('fffinanzas-user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    try {
      const foundUser = await userService.authenticateUser(email, pass);
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('fffinanzas-user', JSON.stringify(foundUser));
        await addAuditLog('Inicio de Sesión de Usuario', `${foundUser.name} ha iniciado sesión.`);
        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    if (user) {
      await addAuditLog('Cierre de Sesión de Usuario', `${user.name} ha cerrado sesión.`);
    }
    setUser(null);
    localStorage.removeItem('fffinanzas-user');
  };

  const value = { 
    user, 
    login, 
    logout, 
    loading, 
    businessName, 
    setBusinessName, 
    auditLogs, 
    addAuditLog,
    reloadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
