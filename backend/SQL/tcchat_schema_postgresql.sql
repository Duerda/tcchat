-- Script SQL para PostgreSQL (baseado no DER do TCChat)

-- Módulo de Autenticação e Acesso

CREATE TABLE tipo_usuario (
    id_tipo_usuario SERIAL PRIMARY KEY,
    nome_tipo VARCHAR(50) UNIQUE NOT NULL -- Ex: 'aluno', 'professor', 'coordenador'
);

CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL, 
    id_tipo_usuario INT NOT NULL,
    CONSTRAINT fk_usuario_tipo FOREIGN KEY (id_tipo_usuario) REFERENCES tipo_usuario(id_tipo_usuario)
);

CREATE TABLE codigoDeAcesso (
    id_codigo SERIAL PRIMARY KEY,
    codigo VARCHAR(100) UNIQUE NOT NULL,
    codigo_usado BOOLEAN DEFAULT FALSE,
    codigo_validade TIMESTAMP NOT NULL,
    id_tipo_usuario INT NOT NULL,
    id_usuario INT,
    CONSTRAINT fk_codigo_tipo FOREIGN KEY (id_tipo_usuario) REFERENCES tipo_usuario(id_tipo_usuario),
    CONSTRAINT fk_codigo_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Módulo de Grupos e Atividades

CREATE TABLE grupo (
    id_grupo SERIAL PRIMARY KEY,
    nome_grupo VARCHAR(255) NOT NULL,
    descricao_grupo TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_curso INT, 
    id_usuario INT NOT NULL,
    CONSTRAINT fk_grupo_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE membroDoGrupo (
    id_membro SERIAL PRIMARY KEY,
    data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_grupo INT NOT NULL,
    id_usuario INT NOT NULL,
    CONSTRAINT fk_membro_grupo FOREIGN KEY (id_grupo) REFERENCES grupo(id_grupo),
    CONSTRAINT fk_membro_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    UNIQUE (id_grupo, id_usuario)
);

CREATE TABLE chat (
    id_chat SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL, 
    id_grupo INT, 
    id_usuario INT NOT NULL,
    CONSTRAINT fk_chat_grupo FOREIGN KEY (id_grupo) REFERENCES grupo(id_grupo),
    CONSTRAINT fk_chat_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE mensagens (
    id_mensagem SERIAL PRIMARY KEY,
    texto TEXT NOT NULL,
    data_mensagem TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_chat INT NOT NULL,
    id_usuario INT NOT NULL,
    CONSTRAINT fk_mensagens_chat FOREIGN KEY (id_chat) REFERENCES chat(id_chat),
    CONSTRAINT fk_mensagens_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE anexos (
    id_anexo SERIAL PRIMARY KEY,
    nome_anexo VARCHAR(255) NOT NULL,
    tipo_arquivo VARCHAR(100),
    tamanho_anexo BIGINT, -- Em bytes
    data_anexo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,
    CONSTRAINT fk_anexos_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE biblioteca (
    id_biblioteca SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    escopo VARCHAR(50) NOT NULL, 
    id_grupo INT, 
    id_anexo INT NOT NULL,
    id_usuario INT NOT NULL,
    CONSTRAINT fk_biblioteca_grupo FOREIGN KEY (id_grupo) REFERENCES grupo(id_grupo),
    CONSTRAINT fk_biblioteca_anexo FOREIGN KEY (id_anexo) REFERENCES anexos(id_anexo),
    CONSTRAINT fk_biblioteca_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE atividades (
    id_atividade SERIAL PRIMARY KEY,
    titulo_atividade VARCHAR(255) NOT NULL,
    descricao_atividade TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_entrega TIMESTAMP,
    nota_max DECIMAL(5,2),
    rota VARCHAR(255), 
    tipo_responsavel VARCHAR(50) NOT NULL, 
    id_grupo INT NOT NULL,
    CONSTRAINT fk_atividades_grupo FOREIGN KEY (id_grupo) REFERENCES grupo(id_grupo)
);

CREATE TABLE entregaDeAtividades (
    id_entrega SERIAL PRIMARY KEY,
    data_entrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    arquivo_entrega VARCHAR(255), 
    status_entrega VARCHAR(50) NOT NULL, 
    tipo_aluno VARCHAR(50), 
    id_atividade INT NOT NULL,
    id_usuario INT NOT NULL,
    CONSTRAINT fk_entrega_atividade FOREIGN KEY (id_atividade) REFERENCES atividades(id_atividade),
    CONSTRAINT fk_entrega_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    UNIQUE (id_atividade, id_usuario)
);

CREATE TABLE avaliacao (
    id_avaliacao SERIAL PRIMARY KEY,
    nota_avaliacao DECIMAL(5,2),
    feedback TEXT,
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_atividade INT NOT NULL,
    id_usuario INT NOT NULL, 
    id_entrega INT NOT NULL,
    CONSTRAINT fk_avaliacao_atividade FOREIGN KEY (id_atividade) REFERENCES atividades(id_atividade),
    CONSTRAINT fk_avaliacao_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_avaliacao_entrega FOREIGN KEY (id_entrega) REFERENCES entregaDeAtividades(id_entrega),
    UNIQUE (id_entrega)
);

-- Módulo Administrativo

CREATE TABLE cursos (
    id_curso SERIAL PRIMARY KEY,
    nome_curso VARCHAR(255) NOT NULL,
    semestre VARCHAR(50),
    id_usuario INT NOT NULL,
    CONSTRAINT fk_cursos_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Adicionar FK para 'cursos' na tabela 'grupo'
ALTER TABLE grupo
ADD CONSTRAINT fk_grupo_curso
FOREIGN KEY (id_curso) REFERENCES cursos(id_curso);

CREATE TABLE relatorios (
    id_relatorio SERIAL PRIMARY KEY,
    tipo_relatorio VARCHAR(100) NOT NULL,
    qntd_relatorio INT, 
    conteudo_relatorio TEXT, 
    data_geracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,
    CONSTRAINT fk_relatorios_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE sistema (
    id_sistema SERIAL PRIMARY KEY,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    versao_sistema VARCHAR(50),
    configuracoes_gerais JSONB -- JSONB é mais eficiente no PostgreSQL
);

-- Módulo de Conteúdo e Comunicação

CREATE TABLE configuracoes (
    id_usuario INT PRIMARY KEY,
    corDestaque VARCHAR(7), 
    fonteDestaque VARCHAR(100),
    tamanhoDoTexto INT,
    fonte_personalizada VARCHAR(255),
    CONSTRAINT fk_configuracoes_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE forum (
    id_forum SERIAL PRIMARY KEY,
    forum_nome VARCHAR(255) NOT NULL,
    tipo_forum VARCHAR(50) NOT NULL 
);

CREATE TABLE postagens (
    id_postagem SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    conteudo TEXT NOT NULL,
    data_postagem TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tag_urgente BOOLEAN DEFAULT FALSE,
    id_forum INT NOT NULL,
    id_usuario INT NOT NULL,
    CONSTRAINT fk_postagens_forum FOREIGN KEY (id_forum) REFERENCES forum(id_forum),
    CONSTRAINT fk_postagens_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE inspiracoes (
    id_projeto SERIAL PRIMARY KEY,
    titulo_projeto VARCHAR(255) NOT NULL,
    descricao_projeto TEXT,
    arquivo_projeto VARCHAR(255), 
    data_publicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    categoria VARCHAR(100), 
    turma_semestre VARCHAR(100),
    status_aprovacao VARCHAR(50), 
    id_usuario INT NOT NULL, 
    id_curso INT NOT NULL, 
    CONSTRAINT fk_inspiracoes_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_inspiracoes_curso FOREIGN KEY (id_curso) REFERENCES cursos(id_curso)
);
