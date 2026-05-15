const express = require('express');//importação do express
const app = express(); //criação do servidor 

app.use(express.json()); //permite que o servidor recebe e entenda dados JSON

//Rotas
app.get('/', (req, res) => {
    res.json({mensagem: "Rota Principal Funcionando"})
})
app.get('/projetos', (req, res) => {
    res.json({mensagem: "Rota de Projetos Funcionando"})
});

app.listen(3000, () => console.log('Servidor rodando','\nhttp://localhost:3000')) //Servidor rodando