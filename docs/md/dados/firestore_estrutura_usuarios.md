# Estrutura do Banco de Dados Firestore — TCChat

Este documento descreve as coleções e a estrutura dos documentos no Firebase Firestore para o funcionamento completo do sistema TCChat.

---

## 1. Coleção: `usuarios`
Armazena as informações de perfil e permissões de todos os usuários.

| Campo | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `uid` | string | ID único do Firebase Auth | `"u8X...1l2"` |
| `nome` | string | Nome completo do usuário | `"Eduarda Silva"` |
| `email` | string | E-mail institucional | `"eduarda@aluno.cps.sp.gov.br"` |
| `tipo` | string | "aluno", "professor" ou "coordenador" | `"aluno"` |
| `iniciais` | string | Duas letras geradas do e-mail | `"ES"` |
| `codigoSala` | string | Código da turma vinculada | `"DS-3"` |
| `curso` | string | Nome do curso | `"Desenvolvimento de Sistemas"` |
| `ano` | string | Ano letivo (apenas alunos) | `"3º Ano"` |
| `dataCadastro` | string ISO | Data e hora do cadastro | `"2026-06-24T12:00:00Z"` |
| `configuracoes` | objeto | { tema, tamanhoFonte, tipoFonte } | `{ tema: "dark" }` |

---

## 2. Coleção: `grupos`
Armazena os grupos de TCC criados em cada sala.

| Campo | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `id` | string | ID do documento | `"grp_001"` |
| `numero` | number | Número identificador do grupo | `1` |
| `nomeProjeto` | string | Título do projeto de TCC | `"TCChat"` |
| `descricao` | string | Resumo ou objetivo do projeto | `"Sistema de gestão..."` |
| `codigoSala` | string | Código da turma vinculada | `"DS-3"` |
| `liderUid` | string | UID do aluno líder do grupo | `"u8X...1l2"` |
| `membros` | array (string) | Lista de UIDs dos alunos no grupo | `["uid1", "uid2"]` |
| `nomesMembros` | array (string) | Lista de nomes dos alunos no grupo | `["Eduarda", "João"]` |

---

## 3. Coleção: `avisos`
Comunicados postados por professores ou coordenadores.

| Campo | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `titulo` | string | Título da postagem | `"Entrega Fase 1"` |
| `conteudo` | string | Texto completo da mensagem | `"Lembrem-se da data..."` |
| `autor` | string | Nome de quem postou | `"Ricardo Santos"` |
| `tipoAutor` | string | "professor" ou "coordenador" | `"professor"` |
| `data` | timestamp | Data e hora da postagem | `June 26, 2026...` |
| `codigoSala` | string | Turma destinatária do aviso | `"DS-3"` |

---

## 4. Coleção: `biblioteca`
Repositório de links e arquivos para consulta.

| Campo | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `nome` | string | Nome descritivo do recurso | `"Manual ABNT"` |
| `url` | string | Link para o arquivo ou site | `"https://..."` |
| `tipo` | string | "link" ou "arquivo" | `"arquivo"` |
| `icone` | string | URL ou nome do ícone representativo | `"pdf-icon"` |
| `codigoSala` | string | Turma vinculada ao recurso | `"DS-3"` |
| `enviadoPor` | string | UID do autor da postagem | `"uid_coord_789"` |

---

## 5. Coleção: `avaliacoes`
Registro de notas e feedbacks dados aos grupos.

| Campo | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `grupoId` | string | ID do grupo avaliado | `"grp_001"` |
| `professorUid` | string | UID do professor que avaliou | `"uid_prof_456"` |
| `nota` | number | Valor numérico da avaliação | `9.5` |
| `feedback` | string | Comentários e observações | `"Ótimo trabalho!"` |
| `data` | timestamp | Data da avaliação | `June 26, 2026...` |

---

## 6. Coleção: `duvidas`
Espaço para perguntas dos alunos e respostas dos docentes.

| Campo | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `pergunta` | string | Texto da dúvida do aluno | `"Como usar o Git?"` |
| `alunoUid` | string | UID do aluno que perguntou | `"uid_aluno_123"` |
| `alunoNome` | string | Nome do aluno que perguntou | `"Eduarda Silva"` |
| `resposta` | string | Texto da resposta fornecida | `"Veja o tutorial..."` |
| `respondidoPor` | string | Nome de quem respondeu | `"Ricardo Santos"` |
| `status` | string | "pendente" ou "respondido" | `"respondido"` |
| `codigoSala` | string | Sala do aluno | `"DS-3"` |
| `data` | timestamp | Data de criação da dúvida | `June 26, 2026...` |
