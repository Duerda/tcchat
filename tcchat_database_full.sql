-- SCRIPT DE BANCO DE DADOS TCCHAT
-- Compatível com PostgreSQL / MySQL
-- Este script representa a modelagem relacional equivalente à estrutura NoSQL do Firebase

-- 1. CRIAÇÃO DAS TABELAS (DDL)

-- Tabela de Salas/Turmas
CREATE TABLE salas (
    id_sala SERIAL PRIMARY KEY,
    codigo_sala VARCHAR(10) UNIQUE NOT NULL, -- Ex: DS-3, ADM-1
    curso VARCHAR(100) NOT NULL,
    ano VARCHAR(20) NOT NULL
);

-- Tabela de Usuários
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    uid_firebase VARCHAR(128) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('aluno', 'professor', 'coordenador')),
    iniciais VARCHAR(5),
    id_sala INTEGER REFERENCES salas(id_sala),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Grupos de TCC
CREATE TABLE grupos (
    id_grupo SERIAL PRIMARY KEY,
    numero_grupo INTEGER NOT NULL,
    nome_projeto VARCHAR(150),
    descricao TEXT,
    id_sala INTEGER REFERENCES salas(id_sala),
    lider_uid VARCHAR(128) REFERENCES usuarios(uid_firebase),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Membros do Grupo (Relacionamento N:N)
CREATE TABLE membros_grupo (
    id_grupo INTEGER REFERENCES grupos(id_grupo),
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    PRIMARY KEY (id_grupo, id_usuario)
);

-- Tabela de Avisos (Fórum)
CREATE TABLE avisos (
    id_aviso SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    conteudo TEXT NOT NULL,
    autor_uid VARCHAR(128) REFERENCES usuarios(uid_firebase),
    id_sala INTEGER REFERENCES salas(id_sala),
    data_postagem TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Biblioteca (Links e Modelos)
CREATE TABLE biblioteca (
    id_item SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    url_recurso TEXT NOT NULL,
    tipo_recurso VARCHAR(20) CHECK (tipo_recurso IN ('link', 'arquivo')),
    icone_url TEXT,
    id_sala INTEGER REFERENCES salas(id_sala),
    enviado_por VARCHAR(128) REFERENCES usuarios(uid_firebase)
);

-- Tabela de Avaliações
CREATE TABLE avaliacoes (
    id_avaliacao SERIAL PRIMARY KEY,
    id_grupo INTEGER REFERENCES grupos(id_grupo),
    professor_uid VARCHAR(128) REFERENCES usuarios(uid_firebase),
    nota DECIMAL(4,2),
    feedback TEXT,
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. INSERÇÃO DE DADOS DE EXEMPLO (DML)

INSERT INTO salas (codigo_sala, curso, ano) VALUES 
('DS-3', 'Desenvolvimento de Sistemas', '3º Ano'),
('ADM-1', 'Administração', '1º Ano');

INSERT INTO usuarios (uid_firebase, nome, email, tipo, iniciais, id_sala) VALUES 
('u8X123', 'Eduarda Silva', 'eduarda@aluno.cps.sp.gov.br', 'aluno', 'ES', 1),
('p9Y456', 'Ricardo Professor', 'ricardo@professor.cps.sp.gov.br', 'professor', 'RP', 1);

INSERT INTO grupos (numero_grupo, nome_projeto, descricao, id_sala, lider_uid) VALUES 
(1, 'TCChat Platform', 'Sistema de gestão de TCC', 1, 'u8X123');

INSERT INTO avisos (titulo, conteudo, autor_uid, id_sala) VALUES 
('Entrega da 1ª Prévia', 'Lembrem-se de enviar o arquivo até sexta-feira.', 'p9Y456', 1);

-- 3. EXEMPLOS DE CONSULTAS (DQL)

-- Buscar todos os alunos de uma sala específica
SELECT nome, email FROM usuarios WHERE id_sala = (SELECT id_sala FROM salas WHERE codigo_sala = 'DS-3');

-- Buscar o projeto e os membros de um grupo
SELECT g.nome_projeto, u.nome as membro 
FROM grupos g
JOIN membros_grupo mg ON g.id_grupo = mg.id_grupo
JOIN usuarios u ON mg.id_usuario = u.id_usuario
WHERE g.id_grupo = 1;

-- Atualizar a nota de um grupo
UPDATE avaliacoes SET nota = 9.5, feedback = 'Excelente evolução!' WHERE id_grupo = 1;
