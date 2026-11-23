# Complementação do projeto

Este registro descreve a rodada de correções feita depois da revisão estática do TCChat.

## O que foi completado

1. **Detalhes do grupo do professor:** removidos blocos de demonstração que ficavam fora da função de renderização das abas. O histórico passou a mostrar atividades publicadas e submissões recebidas, com observação, identificação de envio atrasado e link para abrir o arquivo já enviado.
2. **Biblioteca da coordenação:** os recursos agora são associados a um código de turma como `DS-3`. Esse valor é o mesmo campo `codigoSala` usado pelas telas do professor e do aluno, permitindo que os recursos sejam encontrados pelo filtro comum.
3. **Senha do aluno:** a tela agora solicita a senha atual, a nova senha e sua confirmação. O fluxo reautentica o usuário e altera a senha no Firebase Authentication.
4. **Avaliações para o aluno:** o painel da turma lista nota, feedback e professor das avaliações associadas aos grupos dos quais o aluno é membro.
5. **Entregas para o professor:** no detalhe do grupo, o histórico mostra as submissões já registradas, incluindo observação e link para o arquivo, quando houver.

## Itens mantidos para outra etapa

- As regras locais estão em `backend/firebase/firestore.rules`, apontadas por `firebase.json`. A publicação no painel Firebase e a configuração do Supabase ficaram para a etapa seguinte.
- O envio de arquivos das atividades usa Supabase Storage. O código, o SQL inicial e as instruções estão em `backend/supabase/supabase.js`, `backend/supabase/setup_storage.sql` e `docs/Arquivos .md/demonstracao/supabase_upload_demo.md`. A configuração do painel e a validação de um upload real ainda estão pendentes.
- A fila de avaliações do professor lista submissões ainda não avaliadas e vincula cada nota à entrega selecionada. A área Inspirações lê a coleção `inspiracoes`; como o app não oferece formulário de cadastro, os documentos ainda precisam ser preparados administrativamente.

> Este documento registra uma rodada anterior. Para a situação atual e as pendências da apresentação, consulte [`AVALIACAO_PROJETO.md`](AVALIACAO_PROJETO.md).
