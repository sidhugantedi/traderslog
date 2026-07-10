import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ugxzcgytswxsaefcfpwy.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVneHpjZ3l0c3d4c2FlZmNmcHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODE0ODQsImV4cCI6MjA4OTM1NzQ4NH0.iHk7h1KX8tl8s1CnlrRhIK8xRsnaMRk8gnZaWnC8lr4'

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
