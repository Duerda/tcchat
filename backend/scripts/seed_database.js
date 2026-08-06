/**
 * SCRIPT DE POVOAMENTO (SEED) - PROJETO TCCHAT
 * Este script automatiza a inserção de dados iniciais no Firebase Firestore.
 * 
 * Como usar:
 * 1. Configure suas credenciais do Firebase Admin
 * 2. Execute: node seed_database.js
 */

const admin = require('firebase-admin');

// ATENÇÃO: Para rodar este script localmente, você precisa baixar o arquivo JSON 
// de conta de serviço no Console do Firebase (Configurações do Projeto > Contas de Serviço)
// e apontar o caminho abaixo para ele.
// const serviceAccount = require("./serviceAccountKey.json");

/*
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
*/

// Para fins de documentação no TCC, este script simula a lógica de inserção:
const db = {
    collection: (name) => ({
        doc: (id) => ({
            set: (data) => console.log(`[SEED] Inserindo em ${name}/${id}:`, data),
            add: (data) => console.log(`[SEED] Adicionando em ${name}:`, data)
        }),
        add: (data) => console.log(`[SEED] Adicionando em ${name}:`, data)
    })
};

async function seedDatabase() {
    console.log("Iniciando povoamento do banco de dados Firestore...");

    // 1. Criar Usuários de Exemplo
    const usuarios = [
        {
            uid: "uid_aluno_123",
            nome: "Eduarda Silva",
            email: "eduarda@aluno.cps.sp.gov.br",
            tipo: "aluno",
            iniciais: "ES",
            codigoSala: "DS-3",
            curso: "Desenvolvimento de Sistemas",
            ano: "3º Ano",
            dataCadastro: new Date().toISOString()
        },
        {
            uid: "uid_prof_456",
            nome: "Ricardo Santos",
            email: "ricardo.santos@professor.cps.sp.gov.br",
            tipo: "professor",
            iniciais: "RS",
            dataCadastro: new Date().toISOString()
        }
    ];

    for (const user of usuarios) {
        await db.collection('usuarios').doc(user.uid).set(user);
    }

    // 2. Criar Grupo de Exemplo
    const grupo = {
        numero: 1,
        nomeProjeto: "TCChat - Gestão de TCC",
        descricao: "Sistema de gerenciamento de projetos escolares",
        codigoSala: "DS-3",
        liderUid: "uid_aluno_123",
        membros: ["uid_aluno_123"],
        nomesMembros: ["Eduarda Silva"]
    };
    await db.collection('grupos').add(grupo);

    // 3. Criar Aviso de Exemplo
    const aviso = {
        titulo: "Entrega da 1ª Fase",
        conteudo: "Lembrem-se que a documentação deve ser entregue até sexta.",
        autor: "Ricardo Santos",
        tipoAutor: "professor",
        data: new Date(),
        codigoSala: "DS-3"
    };
    await db.collection('avisos').add(aviso);

    // 4. Criar Item na Biblioteca
    const biblioteca = {
        nome: "Manual ABNT 2026",
        url: "https://exemplo.com/abnt.pdf",
        tipo: "arquivo",
        icone: "pdf-icon",
        codigoSala: "DS-3",
        enviadoPor: "uid_prof_456"
    };
    await db.collection('biblioteca').add(biblioteca);

    console.log("Povoamento concluído com sucesso!");
}

seedDatabase().catch(console.error);
