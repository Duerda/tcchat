# Notas iniciais do DER do TCChat

## Fonte
Arquivo analisado: `/home/ubuntu/upload/DER_TCCHAT.drawio.pdf`

## Módulo de Grupos e Atividades

### Entidades identificadas
- `mensagens`: `id_mensagem (PK)`, `texto`, `data_mensagem`, `id_usuario (FK)`.
- `chat`: `id_chat`, `tipo` (chat de grupo / chat com orientador), `id_grupo (FK)`, `id_usuario (FK)`.
- `anexos`: `id_anexo`, `nome_anexo`, `tipo_arquivo`, `tamanho_anexo`, `data_anexo`, `id_usuario (FK)`.
- `biblioteca`: `id_biblioteca`, `nome`, `escopo (grupo/geral)`, `id_anexo (FK)`, `id_usuario (FK)`.
- `membroDoGrupo`: `id_membro`, `data_entrada`, `id_grupo (FK)`, `id_usuario (FK)`.
- `grupo`: `id_grupo (PK)`, `nome_grupo`, `descricao_grupo`, `data_criacao`, `id_curso (FK)`, `id_usuario (FK)`.
- `entregaDeAtividades`: `id_entrega (PK)`, `data_entrega`, `arquivo_entrega`, `status (Concluído, Atrasado, Aguardando)`, campo de ligação com avaliação/atividade a confirmar no detalhamento visual, `tipo (aluno) (FK)`.
- `atividades`: `id_atividade`, `titulo_atividade`, `descricao_atividade`, `data_criacao`, `data_entrega`, `nota_max`, `rota`, `tipo (professor, coordenador) (FK)`.
- `avaliacao`: `id_avaliacao (PK)`, `nota_avaliacao`, `feedback`, `data_avaliacao`, `id_atividade (FK)`, `id_usuario (FK)`, `id_entrega (FK)`.

### Relações percebidas
- Um `chat` recebe várias `mensagens`.
- Um `grupo` possui vários registros em `membroDoGrupo`.
- Um `grupo` possui itens em `biblioteca`.
- Um `grupo` possui várias `atividades` por meio de `entregaDeAtividades`/ligações do diagrama.
- Uma `atividade` possui várias `avaliacoes`.
- `anexos` alimentam a `biblioteca`.

## Módulo de Autenticação e Acesso

### Entidades identificadas
- `codigoDeAcesso`: `id_codigo (PK)`, `codigo`, `codigo_usado (boolean)`, `codigo_validade`, `tipo (aluno, professor, coordenador) (FK)`.
- `usuario`: `id_usuario (PK)`, `nome`, `email`, `senha`, `tipo (aluno, professor, coordenador) (FK)`.
- `tipo_usuario`: enumeração/entidade com valores `aluno`, `professor`, `coordenador`.

### Relações percebidas
- `usuario` gera ou utiliza `codigoDeAcesso` conforme o diagrama.
- `usuario` possui um `tipo_usuario`.

## Módulo Administrativo

### Entidades identificadas
- `cursos`: `id_curso (PK)`, `nome_curso`, `semestre`, `id_usuario (FK)`.
- `relatorios`: `id_relatorio`, `tipo_relatorio`, `qntd_relatorio`, `conteudo_relatorio`, `id_usuario (FK)`.
- `sistema`: `id_sistema`, `data_atualizacao`, `versao_sistema`, `configuracoes_gerais`.

### Relações percebidas
- Usuários gerenciam `cursos`.
- Usuários geram/visualizam `relatorios`.
- Usuários supervisionam o `sistema`.
- `cursos` possuem `grupos`.

## Módulo de Conteúdo e Comunicação

### Entidades identificadas
- `configuracoes`: `id_usuario (FK/PK?)`, `corDestaque`, `fonteDestaque`, `tamanhoDoTexto`, `fonte_personalizada`.
- `forum`: `id_forum (PK)`, `forum_nome`, `tipo_forum` (avisos/dúvidas).
- `postagens`: `id_postagem (PK)`, `titulo`, `conteudo`, `data_postagem`, `tag_urgente (booleano)`, `id_forum (FK)`, `id_usuario (FK)`.
- `inspiracoes` / `projetos TCC`: `id_projeto (PK)`, `titulo_projeto`, `descricao_projeto`, `arquivo_projeto`, `data_publicacao`, `categoria` (Final, Em_Servico, Websocket, Mobile, etc.), `turma_semestre`, `status_aprovacao`, `id_usuario (FK)`, `id_curso (FK)`.

### Relações percebidas
- Usuários visualizam `configuracoes`.
- `forum` possui várias `postagens`.
- Usuários visualizam/postam em `forum`.
- Usuários visualizam/postam `inspiracoes`.

## Observações
- Alguns nomes de atributos estão parcialmente ambíguos pela resolução do PDF. Antes de fechar o SQL final, vale validar os campos mais sensíveis do módulo de atividades e projetos.
- Para a implementação com Firebase, a senha não deve ser armazenada na tabela/coleção de perfil; o ideal é delegar autenticação ao Firebase Authentication e manter apenas perfil e dados de domínio no banco.
