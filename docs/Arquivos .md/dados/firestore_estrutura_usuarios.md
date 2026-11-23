# Estrutura atual do Firestore — TCChat

Este documento resume os documentos e caminhos que o código atual do TCCHAT consulta ou grava. O Firestore é NoSQL: os campos são definidos pelas operações da aplicação e pelas regras em `backend/firebase/firestore.rules`, não por um esquema SQL único. Os campos opcionais e os registros legados podem variar.

## Coleções de nível superior

### `usuarios/{uid}`

O ID do documento é o UID do Firebase Authentication. Perfis de aluno e professor criados pelo formulário incluem `uid`, `nome`, `email`, `tipo`, `iniciais`, `dataCadastro`; `codigoAcessoId`; e, conforme o papel, `codigoSala`, `curso` e `ano` (aluno). Preferências podem ser gravadas em `configuracoes`; o próprio usuário pode alterar nome/iniciais e preferências. O provisionamento administrativo de coordenadores usa também `escopo`, `curso` e `acessoAtivo`.

Os papéis são `aluno`, `professor` e `coordenador`. Alunos e professores recebem turma por convite. Coordenadores são provisionados administrativamente e têm escopo global. Os campos de perfil aceitos pelo cadastro e as permissões de leitura/alteração constam em `backend/firebase/firestore.rules`.

### `codigosAcesso/{id}`

Convites de cadastro. O fluxo consulta o documento pelo ID digitado e valida `codigo`, `codigoSala`, `tipo` (`aluno`, `professor` ou `ambos`), `revogado` e `expiraEm`. O uso atualiza `usos`, `usadosPor` e `ultimoUso`; a coordenação pode revogar o convite.

### `grupos/{grupoId}`

Os registros usam principalmente `codigoSala`, `nome`, `descricao`, `membros` (UIDs) e campos de criação/gestão. As telas também podem usar `integrantes` ou `nomesMembros` (nomes exibidos), `tema`, `orientador` e `status`. Não há garantia de que todos os grupos legados tenham todos esses campos.

Subcoleções usadas pelo sistema:

| Caminho | Uso e campos observados |
| --- | --- |
| `grupos/{grupoId}/mensagens/{id}` | Chat; inclui `uid`, `autor`, `chatTipo`, `texto` e `criadoEm` quando gravado pelo aluno. |
| `grupos/{grupoId}/entregas/{atividadeId}` | Atividades publicadas; inclui `uid`, `tipo: "atividade"`, `titulo` e, conforme a tela, `descricao` e `dataLimite`. |
| `grupos/{grupoId}/submissoes/{id}` | Entregas de alunos; inclui `atividadeId`, `alunoUid`, `alunoNome`, `observacao`, `arquivoNome`, `arquivoPath`, `enviadoAtrasado` e `enviadoEm`. |
| `grupos/{grupoId}/arquivos/{id}` | Arquivos/links associados ao grupo; inclui `uid`, `nome` e `url`. |
| `grupos/{grupoId}/anotacoes/{id}` | Anotações de professores, com `uid`, `autor` e `texto`. |

O binário das submissões novas fica no bucket privado Supabase `tcchat-arquivos`; o Firestore guarda o caminho e metadados. O guia de configuração está em [`supabase_upload_demo.md`](../demonstracao/supabase_upload_demo.md).

### `avisos/{id}`

Comunicados por turma. O código grava `titulo`, `conteudo`, `autor`, `autorUid`, `tipoAutor`, `codigoSala` e `data` (timestamp do servidor).

### `duvidas/{id}`

Perguntas e respostas por turma. O formato atual usa `titulo`, `conteudo`, `autorUid`, `codigoSala`; as respostas podem preencher `resposta`, `respondidoPor`, `respondidoPorUid`, `status` e `respondidoEm`. Registros antigos podem ter nomes de campo diferentes.

### `biblioteca/{id}`

Links e recursos associados a uma turma. O código grava `nome`, `url`, `tipo` (`link` ou `arquivo`), `enviadoPor`, `autorNome`, `codigoSala` e `criadoEm`; `icone` pode existir em registros antigos.

### `avaliacoes/{id}`

Avaliações publicadas por professores. O código e as regras usam `grupoId`, `grupoNome`, `professorUid`, `codigoSala`, `membros` (UIDs dos integrantes no momento da publicação), `nota`, `feedback` e data. O campo `membros` é necessário para que alunos consultem somente avaliações destinadas a eles. Avaliações antigas podem precisar da migração descrita em [`firestore_migracao_avaliacoes.md`](firestore_migracao_avaliacoes.md).

As avaliações novas também guardam `submissionId` e `atividadeId`, vinculando a nota à entrega específica que o professor revisou.

### `inspiracoes/{projectId}`

Vitrine de projetos anteriores. A tela lê documentos desta coleção e aceita campos como `titulo`/`nomeProjeto`/`nome`, `descricao`/`resumo`, `categoria`/`tema`/`tipo`, `turmaSemestre`/`ano`/`semestre`, `origemIdeia`/`inspiracao`, `integrantes`/`nomesMembros` e `statusAprovacao`/`status`. Não há formulário no app para cadastrar projetos; os documentos precisam ser preparados por um processo administrativo ou no Console.

## Acesso e limites desta referência

As regras exigem e-mail confirmado e perfil ativo para autorizar os papéis. A maioria das consultas precisa incluir filtros por turma ou grupo compatíveis com `backend/firebase/firestore.rules`; ter uma coleção listada aqui não implica acesso irrestrito. Consulte o arquivo de regras antes de alterar o formato dos documentos.

Este resumo foi conferido com o código local e não confirma quais regras ou dados estão publicados no projeto Firebase externo.
