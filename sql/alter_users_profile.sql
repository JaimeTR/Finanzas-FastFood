-- Agregar columnas necesarias para perfil de usuario
-- Ejecutar en tu proyecto de Supabase

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.users ADD COLUMN avatar_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password'
  ) THEN
    ALTER TABLE public.users ADD COLUMN password text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_namespace n
    WHERE n.nspname = 'storage'
  ) THEN
    -- Si el esquema storage no existe, es que el proyecto no tiene storage habilitado; omitir.
    RAISE NOTICE 'Si no has habilitado Storage, crea un bucket llamado "avatars" desde el Dashboard de Supabase.';
  END IF;
END $$;

-- Crear bucket "avatars" manualmente en Supabase Dashboard si no existe.
-- Configurar el bucket como público o añadir una política de acceso para lectura pública.
-- Ejemplo de política (si necesitas RLS en Storage):
-- En Storage > Policies del bucket "avatars":
--   - Nombre: public-read
--   - Definition:
--     (auth.role() = 'anon' OR auth.role() = 'authenticated')
--     AND (request.method = 'GET')
--   - Permite leer archivos públicamente.
