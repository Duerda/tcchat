/**
 * SCRIPT DE LIMPEZA - PROJETO TCCHAT
 * Este script remove dados de coleções específicas para resetar o ambiente de testes.
 */

// Simulação da lógica de limpeza para documentação
const collectionsToClear = ['usuarios', 'grupos', 'avisos', 'biblioteca', 'avaliacoes', 'duvidas'];

async function clearDatabase() {
    console.log("Iniciando limpeza do banco de dados Firestore...");
    
    for (const collection of collectionsToClear) {
        console.log(`[CLEAN] Removendo todos os documentos da coleção: ${collection}`);
        // Lógica real usando Firebase Admin:
        // const snapshot = await db.collection(collection).get();
        // snapshot.forEach(doc => doc.ref.delete());
    }

    console.log("Limpeza concluída!");
}

clearDatabase().catch(console.error);
