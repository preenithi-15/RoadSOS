import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://umhiyqcvkrxkwwglchjm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtaGl5cWN2a3J4a3d3Z2xjaGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNjMxMzcsImV4cCI6MjA5NTczOTEzN30.LAowMSMsFVnumwEGvgKhfLkNMWIDd1Ee_B4oPn1-uII',
  { auth: { persistSession: false } }
)
