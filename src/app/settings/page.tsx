 'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldAlert, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SettingsPage() {
  const router = useRouter();
  const { user, businessName, setBusinessName, auditLogs, addAuditLog } = useAuth();
  const { toast } = useToast();
  
  const [newBusinessName, setNewBusinessName] = useState(businessName);
  const [nameIsLoading, setNameIsLoading] = useState(false);
  
  // Simplificada: solo nombre del negocio y auditoría

  useEffect(() => {}, []);

  // Permitir acceso a administradores (según tipos actuales: 'admin' | 'user')
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Acceso Denegado</h1>
        <p className="mt-2 text-muted-foreground">No tienes permiso para ver esta página.</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-6">
          Ir al Panel
        </Button>
      </div>
    );
  }

  const handleNameChange = (e: React.FormEvent) => {
    e.preventDefault();
    setNameIsLoading(true);
    setTimeout(() => {
        setBusinessName(newBusinessName);
        toast({ title: 'Éxito', description: 'Nombre del negocio actualizado.' });
        setNameIsLoading(false);
    }, 500);
  };
  
  // Secciones de atributos movidas a /attributes

  return (
    <>
      <PageHeader title="Configuración" description="Gestiona la configuración de tu negocio y ve los registros de auditoría." />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          {/* Estado de IA (Gemini) */}
          <AIStatusCard />
          <Card>
            <CardHeader>
              <CardTitle>Información del Negocio</CardTitle>
              <CardDescription>Actualiza el nombre de tu negocio.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNameChange} className="flex items-end gap-2">
                <div className="flex-grow">
                  <label htmlFor="businessName" className="text-sm font-medium">Nombre del Negocio</label>
                  <Input id="businessName" value={newBusinessName} onChange={(e) => setNewBusinessName(e.target.value)} />
                </div>
                <Button type="submit" disabled={nameIsLoading}>
                  {nameIsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  Guardar
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Registro de Auditoría</CardTitle>
            <CardDescription>Un registro de todas las acciones importantes realizadas en la aplicación.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Acción</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.slice(0, 10).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell title={log.details || ''}>{log.userId}</TableCell>
                    <TableCell>{new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Lima' }).format(new Date(log.date))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function AIStatusCard() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai-config')
      .then((r) => r.json())
      .then((json) => setConfigured(Boolean(json?.isConfigured)))
      .catch(() => setConfigured(false))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Estado de IA (Gemini)</CardTitle>
            <CardDescription>Configuración de la integración con Google AI (Genkit).</CardDescription>
          </div>
          {loading ? (
            <Badge variant="secondary">Verificando...</Badge>
          ) : configured ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              <CheckCircle2 className="mr-1 h-4 w-4" /> Configurada
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
              <XCircle className="mr-1 h-4 w-4" /> No configurada
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!configured && !loading && (
          <Alert variant="destructive">
            <AlertTitle>Falta la API Key</AlertTitle>
            <AlertDescription>
              Agrega <code>GOOGLE_GENKIT_API_KEY</code> a tu archivo <code>.env.local</code> y reinicia el servidor de desarrollo.
            </AlertDescription>
          </Alert>
        )}
        <div className="text-sm text-muted-foreground">
          <p>
            La página de <code>Consejos Financieros</code> utiliza esta configuración para generar análisis con IA.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
