const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://somzygvplcazfytxalsd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbXp5Z3ZwbGNhemZ5dHhhbHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzQyNzksImV4cCI6MjA5MDIxMDI3OX0.Wz46WntHr3JH8ypLlDxufNC21VSKWbtcB920-coe3Eg'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase
    .from('projets')
    .select('*, communes(nom), types_projets(nom)')
    .eq('visible_public', true)
    
  console.log('Error:', error)
  console.log('Data length:', data ? data.length : null)
  
  if (data) {
    console.log(data.map(p => ({ id: p.id, commune_id: p.commune_id, visible_public: p.visible_public })));
  }
}

test()
