# Avaliação geral do TCCHAT

**Data:** 17/11/2026  
**Método:** revisão estática do repositório e da documentação. Não foi feito login no Firebase/Supabase, não foram publicados recursos nos painéis e não foi executada uma apresentação completa no navegador.

## Síntese

O TCCHAT está em estágio de **protótipo funcional para demonstração acadêmica**, desde que os serviços externos sejam configurados e o ensaio manual seja concluído. Há fluxos de autenticação por papel, grupos, chat, atividades, submissões, avaliações, fórum, biblioteca e área de coordenação. A confirmação do e-mail está implementada no Firebase; o envio dos arquivos de atividade foi ligado ao Supabase Storage.

O projeto **ainda não está comprovado como pronto para uso real**. A principal lacuna imediata é operacional: as configurações do Firebase e Supabase não podem ser confirmadas pelo código local. Também faltam testes de ponta a ponta dos fluxos na interface e há regras de leitura temporariamente amplas no Storage.

## Estado das funções principais

| Área | Estado observado no repositório | O que falta confirmar |
| --- | --- | --- |
| Login e perfis | Firebase Authentication com perfis aluno, professor e coordenador | Provedores ativos, contas e perfis preparados no projeto real |
| Confirmação de e-mail | Cadastro envia link; login reenvia para conta não confirmada e bloqueia o painel | Recebimento e abertura do link em uma caixa real, inclusive Outlook |
| Autorização Firestore | Regras locais verificam e-mail confirmado, papel, turma e acesso ativo; arquivo de regras e configuração de deploy existem | Se a versão atual de `firestore.rules` foi publicada no projeto Firebase e se os fluxos de produção continuam compatíveis |
| Grupos e comunicação | Código de gestão de grupos e chat presente | Ensaio no navegador com contas de papéis e turmas diferentes |
| Atividades e entregas | Professor publica atividades; aluno envia observação e arquivo; tela do professor gera link assinado Supabase | Bucket, provedor Firebase, claim JWT e políticas configurados; upload e download reais |
| Avaliações | Professor publica nota/feedback e aluno consulta avaliações direcionadas ao grupo | Fluxo completo com dados reais; telas de correção de submissões ainda não formam uma fila de avaliação |
| Gestão e conteúdo | Há telas de coordenação, fórum e bibliotecas | Conferência funcional por papel e tratamento consistente de erros |
| Verificação automatizada | `npm test` faz checagem estática; há oito testes de regras do Firestore no Emulator | Os testes de regras são optativos e não substituem ensaios de interface, e-mail, Storage ou implantação |

## O que precisa ser configurado para a demonstração

### Firebase

1. Em **Authentication > Sign-in method**, habilitar **Email/Password**.
2. Em **Authentication > Settings > Authorized domains**, incluir o domínio onde o site será apresentado. Se for rodar localmente, conferir se `localhost` está autorizado; em projetos novos ele pode não estar incluído por padrão.
3. Em **Authentication > Templates**, revisar o modelo **Email address verification** (idioma, remetente e texto) e fazer um envio real. O Firebase envia o link; a pessoa pode abri-lo no Outlook sem login Microsoft.
4. Em **Authentication > Users**, preparar as contas de demonstração. Para o cadastro comum, também é preciso convite válido e perfil/grupo coerentes no Firestore; para coordenação, seguir [`provisionamento-coordenadores.md`](provisionamento-coordenadores.md).
5. Em **Firestore Database > Rules**, publicar as regras do arquivo local `firestore.rules` somente após conferir que o projeto selecionado é `tcchat-13e85`. Não presumir que o arquivo local já está ativo no Console. O `firebase.json` aponta para esse arquivo; a publicação também pode ser feita pelo Firebase CLI.
6. Preparar uma turma, grupo, membros e atividade de demonstração. As regras do projeto exigem esses vínculos para ler e enviar submissões.

### Supabase

1. Em **Authentication > Third-Party Auth**, conectar o projeto Firebase de ID `tcchat-13e85`.
2. Atribuir a claim `role: "authenticated"` às contas que usarão Storage. O repositório inclui `npm run demo:supabase-role -- email@exemplo.com`; por padrão é simulação. Para gravar, é necessário executar com `--apply` e credenciais seguras de uma conta de serviço Firebase. Depois, cada conta deve sair e entrar novamente.
3. No **SQL Editor**, executar `supabase/setup_storage.sql`. Isso cria o bucket privado `tcchat-arquivos`, limita o tamanho a 25 MB e os tipos de arquivo aceitos, além de criar políticas de upload e leitura.
4. Fazer upload de um PDF de ensaio, verificar o objeto no bucket e abrir o link assinado pela conta de professor.

As instruções com comandos estão em [`supabase_upload_demo.md`](supabase_upload_demo.md), e o roteiro de ensaio está em [`roteiro-demonstracao.md`](roteiro-demonstracao.md).

## Pendências por prioridade

### Antes da apresentação

1. Configurar os dois painéis e preparar as contas de aluno e professor.
2. Publicar e conferir as regras Firestore que serão usadas na apresentação.
3. Executar o ensaio manual de confirmação de e-mail, publicação de atividade, upload e abertura do arquivo.
4. Preparar dados de contingência para a apresentação e não depender de um cadastro novo ou da chegada de e-mail ao vivo.

### Para evoluir o protótipo

1. Tornar a leitura dos arquivos Supabase restrita a professores da turma e alunos autorizados; a política atual de demonstração permite leitura a todo usuário autenticado do projeto.
2. Restringir leitura de submissões no Firestore ao aluno dono e aos professores/coordenadores autorizados. Atualmente, `canReadGroup()` permite que membros do mesmo grupo leiam documentos de submissão uns dos outros.
3. Criar o fluxo do professor para revisar cada entrega e registrar nota/feedback vinculados à submissão.
4. Automatizar a claim do Supabase para novos usuários ou documentar um processo administrativo repetível.
5. Criar testes de interface para login confirmado/não confirmado, envio de arquivo, erro de permissão e abertura de link; manter os testes do Emulator como apoio às regras.
6. Atualizar documentação operacional e de implantação à medida que os painéis forem configurados.

## Parecer

Para um TCC de 20 minutos, o escopo atual é apresentável como demonstração de um protótipo se os itens de configuração e ensaio forem concluídos antes. A prioridade adequada agora é comprovar os dois caminhos demonstrados — confirmação de e-mail e entrega de arquivo — e verificar a publicação das regras mínimas necessárias. Uma auditoria de segurança abrangente e uma suíte extensa de testes podem ficar para depois da apresentação, mas as políticas temporárias de leitura devem ser tratadas como limitações explícitas do protótipo.
