import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Buscando alunos evadidos com equipamentos alocados...');

    // Buscar evasões ativas
    const { data: evasions, error: evasionsError } = await supabase
      .from('evasions')
      .select('student_id, date')
      .eq('status', 'active');

    if (evasionsError) throw evasionsError;

    console.log(`📊 Total de evasões ativas: ${evasions?.length || 0}`);

    let releasedCount = 0;

    if (evasions && evasions.length > 0) {
      for (const evasion of evasions) {
        // Buscar alocações ativas deste aluno
        const { data: allocations, error: allocError } = await supabase
          .from('equipment_allocations')
          .select('id, equipment_id')
          .eq('student_id', evasion.student_id)
          .eq('status', 'ativo');

        if (allocError) {
          console.error(`❌ Erro ao buscar alocações do aluno ${evasion.student_id}:`, allocError);
          continue;
        }

        if (allocations && allocations.length > 0) {
          console.log(`🔄 Liberando ${allocations.length} equipamentos do aluno ${evasion.student_id}`);

          // Cancelar alocações
          const { error: cancelError } = await supabase
            .from('equipment_allocations')
            .update({
              status: 'cancelado',
              observations: `Alocação cancelada automaticamente - Aluno evadido em ${new Date(evasion.date).toLocaleDateString('pt-BR')}`
            })
            .eq('student_id', evasion.student_id)
            .eq('status', 'ativo');

          if (cancelError) {
            console.error(`❌ Erro ao cancelar alocações:`, cancelError);
            continue;
          }

          // Atualizar status dos equipamentos para disponível
          for (const allocation of allocations) {
            await supabase
              .from('equipment')
              .update({ status: 'disponivel' })
              .eq('id', allocation.equipment_id);
          }

          releasedCount += allocations.length;
        }
      }
    }

    console.log(`✅ Total de equipamentos liberados: ${releasedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${releasedCount} equipamentos liberados de alunos evadidos`,
        releasedCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
