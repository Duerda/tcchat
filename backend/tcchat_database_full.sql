-- ==========================================================
-- SCRIPT DE BANCO DE DADOS - PROJETO TCCHAT
-- TIPO: SQL RELACIONAL (POSTGRESQL / MYSQL)
-- OBJETIVO: DOCUMENTAÇÃO TÉCNICA PARA TCC
-- ==========================================================

-- 1. CRIAÇÃO DAS TABELAS (DDL - CREATE)

-- Tabela de Salas/Turmas
CREATE TABLE salas (
    id_sala SERIAL PRIMARY KEY,
    codigo_sala VARCHAR(10) UNIQUE NOT NULL, -- Ex: DS-3, ADM-1
    curso VARCHAR(100) NOT NULL,
    ano VARCHAR(20) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Usuários
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    uid_firebase VARCHAR(128) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('aluno', 'professor', 'coordenador')),
    iniciais VARCHAR(5),
    id_sala INTEGER,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Grupos de TCC
CREATE TABLE grupos (
    id_grupo SERIAL PRIMARY KEY,
    numero_grupo INTEGER NOT NULL,
    nome_projeto VARCHAR(150),
    descricao TEXT,
    id_sala INTEGER,
    lider_uid VARCHAR(128),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Avisos (Fórum)
CREATE TABLE avisos (
    id_aviso SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    conteudo TEXT NOT NULL,
    autor_uid VARCHAR(128),
    id_sala INTEGER,
    data_postagem TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Biblioteca (Recursos)
CREATE TABLE biblioteca (
    id_item SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    url_recurso TEXT NOT NULL,
    tipo_recurso VARCHAR(20) CHECK (tipo_recurso IN ('link', 'arquivo')),
    id_sala INTEGER,
    enviado_por VARCHAR(128)
);

-- Tabela de Avaliações
CREATE TABLE avaliacoes (
    id_avaliacao SERIAL PRIMARY KEY,
    id_grupo INTEGER,
    professor_uid VARCHAR(128),
    nota DECIMAL(4,2),
    feedback TEXT,
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ALTERAÇÕES DE ESTRUTURA (DDL - ALTER)

-- Adicionando Chaves Estrangeiras (Foreign Keys) para garantir a integridade
ALTER TABLE usuarios ADD CONSTRAINT fk_usuario_sala FOREIGN KEY (id_sala) REFERENCES salas(id_sala);
ALTER TABLE grupos ADD CONSTRAINT fk_grupo_sala FOREIGN KEY (id_sala) REFERENCES salas(id_sala);
ALTER TABLE avisos ADD CONSTRAINT fk_aviso_sala FOREIGN KEY (id_sala) REFERENCES salas(id_sala);
ALTER TABLE biblioteca ADD CONSTRAINT fk_bib_sala FOREIGN KEY (id_sala) REFERENCES salas(id_sala);
ALTER TABLE avaliacoes ADD CONSTRAINT fk_avaliacao_grupo FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo);

-- 3. INSERÇÃO DE DADOS (DML - INSERT)

-- Inserindo Salas
INSERT INTO salas (codigo_sala, curso, ano) VALUES ('DS-3', 'Desenvolvimento de Sistemas', '3º Ano');
INSERT INTO salas (codigo_sala, curso, ano) VALUES ('ADM-1', 'Administração', '1º Ano');

-- Inserindo Usuários
INSERT INTO usuarios (uid_firebase, nome, email, tipo, iniciais, id_sala) 
VALUES ('u8X123', 'Eduarda Silva', 'eduarda@aluno.cps.sp.gov.br', 'aluno', 'ES', 1);

INSERT INTO usuarios (uid_firebase, nome, email, tipo, iniciais, id_sala) 
VALUES ('p9Y456', 'Ricardo Prof', 'ricardo@professor.cps.sp.gov.br', 'professor', 'RP', 1);

-- Inserindo Grupos
INSERT INTO grupos (numero_grupo, nome_projeto, descricao, id_sala, lider_uid) 
VALUES (1, 'TCChat Platform', 'Sistema de gestão de TCC', 1, 'u8X123');

-- 4. ATUALIZAÇÃO DE DADOS (DML - UPDATE)

-- Atualizar o nome de um projeto
UPDATE grupos SET nome_projeto = 'TCChat - Gestão Real-time' WHERE id_grupo = 1;

-- Atualizar a nota de um grupo (se a tabela de avaliações já tivesse dados)
-- UPDATE avaliacoes SET nota = 10.0 WHERE id_grupo = 1;

-- 5. CONSULTAS DE DADOS (DQL - SELECT)

-- Listar todos os usuários de uma sala com o nome do curso (JOIN)
SELECT u.nome, u.email, s.curso 
FROM usuarios u
JOIN salas s ON u.id_sala = s.id_sala
WHERE s.codigo_sala = 'DS-3';

-- 6. REMOÇÃO DE DADOS (DML - DELETE)

-- Remover um aviso antigo (Exemplo)
-- DELETE FROM avisos WHERE data_postagem < '2026-01-01';

-- ==========================================================
-- FIM DO SCRIPT
-- ==========================================================
