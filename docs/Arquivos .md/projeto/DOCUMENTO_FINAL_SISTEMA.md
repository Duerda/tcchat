# Visão geral do sistema TCCHAT

Este documento descreve a implementação encontrada no repositório. O sistema é uma aplicação web acadêmica para apoiar o acompanhamento de projetos de TCC, com áreas para alunos, professores e coordenação. A presença de uma funcionalidade no código não comprova que os serviços externos estejam configurados ou que o fluxo tenha sido validado em produção.

## Arquitetura

- **Autenticação:** Firebase Authentication com e-mail e senha. O cadastro comum é destinado a alunos e professores e exige convite de turma. O perfil fica em `usuarios/{uid}`. Contas de coordenação são provisionadas pela administração.
- **Dados:** Firebase Firestore. As regras locais em `backend/firebase/firestore.rules` exigem e-mail confirmado e perfil válido, além de aplicar restrições por papel, turma e grupo.
- **Arquivos de entrega:** novos arquivos são enviados ao bucket privado Supabase Storage `tcchat-arquivos`; o Firestore guarda caminho e metadados. A abertura usa URL assinada temporária. A integração exige configuração externa do projeto Supabase.
- **Interface:** páginas web por papel, com listeners do Firestore (`onSnapshot`) em telas que acompanham alterações. A atualização depende da conectividade e das permissões do usuário.

## Funcionalidades presentes no código

- Cadastro e login por papel, confirmação de e-mail e verificação do perfil.
- Grupos, membros, mensagens de chat, atividades e submissões de arquivos.
- Avisos, dúvidas e biblioteca de recursos associados a turmas.
- Publicação de avaliações por professores e consulta das avaliações destinadas aos integrantes do grupo.
- Área de coordenação para gestão de turmas, usuários, convites, grupos e conteúdo.
- Preferências de interface e alteração de senha nas páginas de configurações.

As estruturas de dados e os caminhos utilizados estão descritos em [`../dados/firestore_estrutura_usuarios.md`](../dados/firestore_estrutura_usuarios.md). O DER relacional é uma referência de modelagem, não o esquema da implementação atual.

## Preparação para uma demonstração

1. Configure Firebase Authentication, contas e perfis de demonstração; convites válidos são necessários para cadastros comuns.
2. Revise e publique as regras Firestore do projeto correto. `firebase.json` aponta para `backend/firebase/firestore.rules`, mas isso não significa que as regras locais já estejam publicadas no Console.
3. Configure Firebase como provedor de terceiros no Supabase, prepare a claim `role: "authenticated"` nas contas de demonstração e execute `backend/supabase/setup_storage.sql` no projeto Supabase correto.
4. Faça ensaio manual do cadastro/verificação, publicação de atividade, upload e abertura do arquivo.

Os passos detalhados estão em [`../demonstracao/roteiro-demonstracao.md`](../demonstracao/roteiro-demonstracao.md) e [`../demonstracao/supabase_upload_demo.md`](../demonstracao/supabase_upload_demo.md). Prepare os dados de demonstração no Console ou com um utilitário administrativo revisado; não use scripts de simulação como se fossem carregadores de dados.

## Limitações conhecidas

- As configurações efetivas dos projetos Firebase e Supabase não podem ser verificadas apenas pelo código local.
- A política atual do Storage permite leitura a qualquer usuário autenticado no projeto Supabase; é uma configuração de demonstração e precisa ser restringida antes do uso com dados reais de estudantes.
- As regras Firestore permitem que membros de um grupo leiam as submissões desse grupo. Avalie se esse compartilhamento atende à política da instituição.
- As regras locais permitem que professores da mesma turma leiam avaliações da turma para montar a fila de pendências. Confirme se esse acesso entre professores é desejado antes de publicar as regras.
- Os scripts administrativos e os ensaios manuais não substituem uma suíte de testes automatizados. O estado e as pendências da revisão estão em [`AVALIACAO_PROJETO.md`](AVALIACAO_PROJETO.md).
