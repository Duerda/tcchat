import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "./config.js";

const inspiracoes = [
  {
    titulo: "Agenda Comunitária Online",
    descricao: "Site para unidades de saúde divulgarem palestras, vacinação e atividades locais em um só lugar.",
    categoria: "Web",
    turmaSemestre: "2025/2",
    integrantes: ["Ana Souza", "Bruno Lima", "Carla Dias"],
    origemIdeia: "Um agente comunitário percebeu que as informações chegavam atrasadas aos moradores.",
    statusAprovacao: "Aprovado",
  },
  {
    titulo: "Portal de Doações para ONGs",
    descricao: "Plataforma que conecta ONGs a voluntários e doadores, com painel de necessidades em tempo real.",
    categoria: "Web",
    turmaSemestre: "2025/1",
    integrantes: ["Diego Alves", "Elisa Martins"],
    origemIdeia: "Uma campanha de arrecadação da escola mostrou a dificuldade de organizar doações.",
    statusAprovacao: "Aprovado",
  },
  {
    titulo: "Estufa Automatizada",
    descricao: "Sistema com sensores de umidade e temperatura que aciona irrigação e ventilação automaticamente.",
    categoria: "Embarcados",
    turmaSemestre: "2025/2",
    integrantes: ["Felipe Rocha", "Gabriela Nunes", "Hugo Pires"],
    origemIdeia: "Uma horta escolar perdia plantas nos fins de semana.",
    statusAprovacao: "Aprovado",
  },
  {
    titulo: "Monitor de Qualidade do Ar",
    descricao: "Dispositivo com sensor de CO₂ e material particulado que envia alertas para o celular quando o ar fica ruim.",
    categoria: "Embarcados",
    turmaSemestre: "2025/1",
    integrantes: ["Igor Mendes", "Julia Costa"],
    origemIdeia: "Os alunos notaram o ar abafado nas salas durante as aulas.",
    statusAprovacao: "Aprovado",
  },
  {
    titulo: "Gestor de Estoque para Pequenos Comércios",
    descricao: "Software desktop que controla entradas, saídas e validade de produtos, com relatórios mensais.",
    categoria: "Software",
    turmaSemestre: "2024/2",
    integrantes: ["Lucas Ferreira", "Mariana Gomes"],
    origemIdeia: "A família de um dos integrantes perdia produtos vencidos por falta de controle.",
    statusAprovacao: "Aprovado",
  },
  {
    titulo: "Sistema de Triagem para Clínicas",
    descricao: "Aplicação que organiza a fila de atendimento e prioriza pacientes com base em sintomas informados.",
    categoria: "Software",
    turmaSemestre: "2024/1",
    integrantes: ["Nicolas Teixeira", "Paula Ribeiro", "Rafael Torres"],
    origemIdeia: "A espera longa em uma clínica local chamou a atenção do grupo.",
    statusAprovacao: "Aprovado",
  },
  {
    titulo: "Caronas Universitárias",
    descricao: "App que conecta estudantes que fazem o mesmo trajeto, com avaliação de motoristas e divisão de custos.",
    categoria: "Mobile",
    turmaSemestre: "2025/2",
    integrantes: ["Beatriz Campos", "Thiago Moura"],
    origemIdeia: "Muitos colegas gastavam muito com transporte entre campus.",
    statusAprovacao: "Aprovado",
  },
  {
    titulo: "Trilhas Acessíveis",
    descricao: "Aplicativo com roteiros de parques da cidade classificados por acessibilidade, com avaliações de usuários.",
    categoria: "Mobile",
    turmaSemestre: "2024/2",
    integrantes: ["Vitor Araújo", "Yasmin Lopes", "Caio Barros"],
    origemIdeia: "Um integrante usa cadeira de rodas e tinha dificuldade para encontrar trilhas adequadas.",
    statusAprovacao: "Aprovado",
  },
];

async function seed() {
  for (const item of inspiracoes) {
    const ref = await addDoc(collection(db, "inspiracoes"), item);
    console.log("Adicionado:", item.titulo, ref.id);
  }
  console.log("Concluído.");
}

seed().catch((error) => console.error("Erro ao adicionar inspirações:", error));