export default function handler(req, res) {
  if (req.method === 'POST') {
    const { nome, email, senha, codigo } = req.body;

    // Simulação de validação e salvamento
    if (!nome || !email || !senha || !codigo) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    // Aqui conectaria com um banco de dados real
    console.log('Usuário cadastrado:', { nome, email, codigo });

    return res.status(200).json({ 
      message: 'Cadastro realizado com sucesso!',
      user: { nome, email, codigo }
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
