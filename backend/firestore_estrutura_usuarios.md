# Estrutura do Banco de Dados Firestore — TCChat

Este documento descreve as coleções e a estrutura dos documentos esperados no Firebase Firestore para o funcionamento completo do sistema TCChat.

## 1. Coleção: `usuarios`
Armazena as informações de perfil e permissões de todos os usuários.

| Campo | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `uid` | string | ID único gerado pelo Firebase Auth | `"u8X...1l2"` |
| `nome` | string | Nome completo do usuário | `"Eduarda Silva"` |
| `email` | string | E-mail institucional (@aluno.cps, @professor.cps, @cps) | `"eduarda@aluno.cps.sp.gov.br"` |
| `tipo` | string | Nível de acesso: `aluno`, `professor` ou `coordenador` | `"aluno"` |
| `iniciais` | string | Duas letras geradas a partir do e-mail | `"ES"` |
| `dataCadastro` | string (ISO) | Data e hora do registro | `"2026-06-24T12:00:00Z"` |
| `codigoSala` | string | (Apenas Alunos) Código da turma | `"DS-3"` |
| `curso` | string | (Apenas Alunos) Nome do curso | `"Desenvolvimento de Sistemas"` |
| `ano` | string | (Apenas Alunos) Ano letivo | `"3º Ano"` |
| `configuracoes` | objeto | (Opcional) Preferências de acessibilidade | `{ tema: "dark-mode" }` |

---

## 2. Coleção: `grupos`
Armazena os grupos de TCC criados em cada sala.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | string | ID do documento |
| `numero` | number | Número do grupo (Ex: 1, 2, 3) |
| `nomeProjeto` | string | Título do TCC |
| `descricao` | string | Breve resumo do projeto |
| `codigoSala` | string | Vinculação com a turma (Ex: "DS-3") |
| `liderUid` | string | UID do aluno líder do grupo |
| `membros` | array (string) | Lista de UIDs dos alunos no grupo |
| `nomesMembros` | array (string) | Lista de nomes dos alunos (para exibição rápida) |

---

## 3. Coleção: `avisos`
Mensagens e comunicados enviados por professores ou coordenadores.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `titulo` | string | Título do aviso |
| `conteudo` | string | Texto da mensagem |
| `autor` | string | Nome de quem postou |
| `tipoAutor` | string | `professor` ou `coordenador` |
| `data` | timestamp | Data da postagem |
| `codigoSala` | string | Turma que receberá o aviso (ou "geral") |

---

## 4. Coleção: `avaliacoes`
Notas e feedbacks dos projetos.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `grupoId` | string | ID do grupo avaliado |
| `professorUid` | string | UID do professor que avaliou |
| `nota` | number | Valor da avaliação |
| `feedback` | string | Comentários do professor |
| `data` | timestamp | Data da avaliação |

---

## 5. Coleção: `biblioteca`
Links e arquivos de inspiração ou modelos de documentos.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `nome` | string | Nome do recurso |
| `url` | string | Link para o arquivo/site |
| `categoria` | string | Ex: "Modelo ABNT", "Exemplo TCC" |
| `enviadoPor` | string | UID do autor |

---

## 6. Coleção: `duvidas`
Perguntas enviadas por alunos para professores e coordenadores.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `pergunta` | string | Texto da dúvida |
| `alunoUid` | string | UID do aluno que perguntou |
| `alunoNome` | string | Nome do aluno |
| `resposta` | string | Texto da resposta (se houver) |
| `respondidoPor` | string | Nome do professor/coordenador |
| `status` | string | `pendente` ou `respondido` |
| `codigoSala` | string | Sala do aluno |
| `data` | timestamp | Data da criação |
