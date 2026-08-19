# Scripts de Automação de Banco de Dados — TCChat

Esta pasta contém scripts Node.js para automatizar operações no Firebase Firestore, servindo tanto para o desenvolvimento quanto para a demonstração técnica no TCC.

## Arquivos

1. **`seed_database.js`**: Popula o Firestore com dados iniciais (usuários, grupos, avisos, etc.) baseados na estrutura definida na documentação.
2. **`clear_database.js`**: Remove dados das coleções principais para resetar o banco de dados.

## Como Executar

Para rodar os scripts, você precisa ter o Node.js instalado e configurar as credenciais do Firebase Admin SDK:

1. No Console do Firebase, vá em **Configurações do Projeto > Contas de Serviço**.
2. Clique em **Gerar nova chave privada** e salve o arquivo JSON como `serviceAccountKey.json` nesta pasta.
3. Instale a dependência:
   ```bash
   npm install firebase-admin
   ```
4. Execute o script desejado:
   ```bash
   node seed_database.js
   ```

---
*Nota: Estes scripts são complementares ao arquivo `tcchat_database_full.sql`, que serve como documentação lógica relacional para o projeto.*
