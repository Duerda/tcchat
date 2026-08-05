-- ==========================================================
-- SCRIPT DE BANCO DE DADOS - PROJETO TCCHAT
-- Equivalente Relacional para Documentação (SQL)
-- Estrutura adaptada do Firebase Firestore (NoSQL)
-- ==========================================================

-- SEÇÃO 1 - CREATE TABLE
-- Criação das tabelas fundamentais do sistema

-- Tabela de Salas (Turmas)
CREATE TABLE salas (
    id_sala SERIAL PRIMARY KEY,
    codigo_sala VARCHAR(20) UNIQUE NOT NULL, -- Ex: DS-3, ADM-1
    curso VARCHAR(100) NOT NULL,
    ano VARCHAR(20),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Usuários
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    uid_firebase VARCHAR(128) UNIQUE NOT NULL, -- ID do Firebase Auth
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('aluno', 'professor', 'coordenador')),
    iniciais VARCHAR(5),
    id_sala INTEGER, -- Chave Estrangeira para salas
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Grupos de TCC
CREATE TABLE grupos (
    id_grupo SERIAL PRIMARY KEY,
    numero_grupo INTEGER NOT NULL,
    nome_projeto VARCHAR(255) NOT NULL,
    descricao TEXT,
    id_sala INTEGER NOT NULL,
    lider_uid VARCHAR(128) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Relacionamento N:N entre Grupos e Usuários (Membros)
CREATE TABLE membros_grupo (
    id_grupo INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    PRIMARY KEY (id_grupo, id_usuario)
);

-- Tabela de Avisos (Fórum)
CREATE TABLE avisos (
    id_aviso SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    conteudo TEXT NOT NULL,
    autor_uid VARCHAR(128) NOT NULL,
    id_sala INTEGER NOT NULL,
    data_postagem TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Biblioteca (Recursos)
CREATE TABLE biblioteca (
    id_item SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    url_recurso TEXT NOT NULL,
    tipo_recurso VARCHAR(20) NOT NULL CHECK (tipo_recurso IN ('link', 'arquivo')),
    icone_url TEXT,
    id_sala INTEGER NOT NULL,
    enviado_por VARCHAR(128) NOT NULL
);

-- Tabela de Avaliações
CREATE TABLE avaliacoes (
    id_avaliacao SERIAL PRIMARY KEY,
    id_grupo INTEGER NOT NULL,
    professor_uid VARCHAR(128) NOT NULL,
    nota DECIMAL(4,2) NOT NULL,
    feedback TEXT,
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Dúvidas
CREATE TABLE duvidas (
    id_duvida SERIAL PRIMARY KEY,
    pergunta TEXT NOT NULL,
    aluno_uid VARCHAR(128) NOT NULL,
    aluno_nome VARCHAR(150) NOT NULL,
    resposta TEXT,
    respondido_por VARCHAR(150),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pendente', 'respondido')),
    id_sala INTEGER NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------

-- SEÇÃO 2 - ALTER TABLE
-- Adição das Chaves Estrangeiras (Foreign Keys)

-- Relacionamento Usuário -> Sala
ALTER TABLE usuarios ADD CONSTRAINT fk_usuario_sala 
FOREIGN KEY (id_sala) REFERENCES salas(id_sala);

-- Relacionamento Grupo -> Sala
ALTER TABLE grupos ADD CONSTRAINT fk_grupo_sala 
FOREIGN KEY (id_sala) REFERENCES salas(id_sala);

-- Relacionamento Membros -> Grupo
ALTER TABLE membros_grupo ADD CONSTRAINT fk_membros_grupo 
FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo);

-- Relacionamento Membros -> Usuário
ALTER TABLE membros_grupo ADD CONSTRAINT fk_membros_usuario 
FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);

-- Relacionamento Aviso -> Sala
ALTER TABLE avisos ADD CONSTRAINT fk_aviso_sala 
FOREIGN KEY (id_sala) REFERENCES salas(id_sala);

-- Relacionamento Biblioteca -> Sala
ALTER TABLE biblioteca ADD CONSTRAINT fk_biblioteca_sala 
FOREIGN KEY (id_sala) REFERENCES salas(id_sala);

-- Relacionamento Avaliação -> Grupo
ALTER TABLE avaliacoes ADD CONSTRAINT fk_avaliacao_grupo 
FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo);

-- Relacionamento Dúvida -> Sala
ALTER TABLE duvidas ADD CONSTRAINT fk_duvida_sala 
FOREIGN KEY (id_sala) REFERENCES salas(id_sala);

-- ----------------------------------------------------------

-- SEÇÃO 3 - INSERT
-- Inserção de dados fictícios para teste e demonstração

-- Inserindo Salas
INSERT INTO salas (codigo_sala, curso, ano) VALUES ('DS-3', 'Desenvolvimento de Sistemas', '3º Ano');
INSERT INTO salas (codigo_sala, curso, ano) VALUES ('ADM-1', 'Administração', '1º Ano');

-- Inserindo Usuários
INSERT INTO usuarios (uid_firebase, nome, email, tipo, iniciais, id_sala) 
VALUES ('uid_aluno_123', 'Eduarda Silva', 'eduarda@aluno.cps.sp.gov.br', 'aluno', 'ES', 1);

INSERT INTO usuarios (uid_firebase, nome, email, tipo, iniciais) 
VALUES ('uid_prof_456', 'Ricardo Santos', 'ricardo.santos@professor.cps.sp.gov.br', 'professor', 'RS');

INSERT INTO usuarios (uid_firebase, nome, email, tipo, iniciais) 
VALUES ('uid_coord_789', 'Ana Oliveira', 'ana.oliveira@cps.sp.gov.br', 'coordenador', 'AO');

-- Inserindo Grupo
INSERT INTO grupos (numero_grupo, nome_projeto, descricao, id_sala, lider_uid) 
VALUES (1, 'TCChat - Gestão de TCC', 'Sistema de gerenciamento de projetos escolares', 1, 'uid_aluno_123');

-- Inserindo Membro no Grupo
INSERT INTO membros_grupo (id_grupo, id_usuario) VALUES (1, 1);

-- Inserindo Aviso
INSERT INTO avisos (titulo, conteudo, autor_uid, id_sala) 
VALUES ('Entrega da 1ª Fase', 'Lembrem-se que a documentação deve ser entregue até sexta.', 'uid_prof_456', 1);

-- Inserindo Item na Biblioteca
INSERT INTO biblioteca (nome, url_recurso, tipo_recurso, id_sala, enviado_por) 
VALUES ('Manual ABNT 2026', 'https://exemplo.com/abnt.pdf', 'arquivo', 1, 'uid_coord_789');

-- Inserindo Avaliação
INSERT INTO avaliacoes (id_grupo, professor_uid, nota, feedback) 
VALUES (1, 'uid_prof_456', 9.5, 'Excelente estrutura inicial do banco de dados.');

-- Inserindo Dúvida
INSERT INTO duvidas (pergunta, aluno_uid, aluno_nome, status, id_sala) 
VALUES ('Como integrar o Firebase?', 'uid_aluno_123', 'Eduarda Silva', 'pendente', 1);

-- ----------------------------------------------------------

-- SEÇÃO 4 - UPDATE
-- Exemplos de atualização de registros

-- Atualizar nome do projeto de um grupo
UPDATE grupos SET nome_projeto = 'TCChat - Plataforma de Gestão' WHERE id_grupo = 1;

-- Atualizar nota de uma avaliação
UPDATE avaliacoes SET nota = 10.0 WHERE id_avaliacao = 1;

-- Atualizar status de uma dúvida para "respondido"
UPDATE duvidas 
SET status = 'respondido', 
    resposta = 'Você deve utilizar o SDK do Firebase no seu arquivo JS.', 
    respondido_por = 'Ricardo Santos' 
WHERE id_duvida = 1;

-- ----------------------------------------------------------

-- SEÇÃO 5 - SELECT
-- Consultas complexas com JOIN para relatórios

-- Listar todos os alunos de uma sala específica com o nome do curso
SELECT u.nome, u.email, s.curso, s.codigo_sala 
FROM usuarios u 
JOIN salas s ON u.id_sala = s.id_sala 
WHERE s.codigo_sala = 'DS-3' AND u.tipo = 'aluno';

-- Buscar membros de um grupo específico com o nome do projeto
SELECT u.nome, g.nome_projeto 
FROM usuarios u 
JOIN membros_grupo mg ON u.id_usuario = mg.id_usuario 
JOIN grupos g ON mg.id_grupo = g.id_grupo 
WHERE g.id_grupo = 1;

-- Listar avisos de uma sala ordenados por data (mais recentes primeiro)
SELECT a.titulo, a.conteudo, a.data_postagem 
FROM avisos a 
JOIN salas s ON a.id_sala = s.id_sala 
WHERE s.codigo_sala = 'DS-3' 
ORDER BY a.data_postagem DESC;

-- ----------------------------------------------------------

-- SEÇÃO 6 - DELETE
-- Exemplos de remoção (comentados por segurança)

-- Remover um aviso antigo
-- DELETE FROM avisos WHERE id_aviso = 1;

-- Remover um item da biblioteca
-- DELETE FROM biblioteca WHERE id_item = 1;
