// Configuração do Supabase
const SUPABASE_URL = "https://ktnlazcmojcrzxspggyf.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_NT8jHzUdqXM8lgL2Pfn2UQ_1W0IzCWH"; 

// Função para chamar API
async function chamadaSupabase(tabela, metodo = 'GET', dados = null) {
    const url = `${SUPABASE_URL}/rest/v1/${tabela}`;
    
    const opcoes = {
        method: metodo,
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    };
    
    if (dados) {
        opcoes.body = JSON.stringify(dados);
    }
    
    try {
        const resposta = await fetch(url, opcoes);
        return await resposta.json();
    } catch (erro) {
        console.error('Erro na chamada Supabase:', erro);
        return null;
    }
}
