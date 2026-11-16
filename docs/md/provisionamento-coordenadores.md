# Provisionar uma conta de coordenação

As contas de coordenação são criadas por um administrador do projeto Firebase. Não use códigos compartilhados no site: qualquer segredo enviado ao navegador pode ser inspecionado.

## Criar a conta

1. No Firebase Console, abra **Authentication > Users** e adicione o e-mail institucional do coordenador com uma senha inicial.
2. Copie o UID gerado para essa conta.
3. No Firestore, abra a coleção `usuarios` e crie um documento cujo ID seja exatamente esse UID.
4. Adicione estes campos:

| Campo | Tipo | Valor |
| --- | --- | --- |
| `uid` | string | UID copiado do Firebase Authentication |
| `nome` | string | Nome completo |
| `email` | string | Mesmo e-mail da conta de autenticação |
| `tipo` | string | `coordenador` |
| `iniciais` | string | Iniciais do nome |
| `escopo` | string | `global` |
| `curso` | string | `Coordenação global` |
| `acessoAtivo` | boolean | `true` |

5. Entregue a senha inicial ao titular por um canal seguro. A conta precisa existir no Authentication e no Firestore antes do primeiro login.

## Contas existentes

Não recrie os usuários já existentes. Confirme que cada conta de coordenação tem um documento `usuarios/{uid}` com `tipo: "coordenador"` e que `acessoAtivo` não está definido como `false`. Depois da remoção do código compartilhado, o login será autorizado pelo perfil.

## Segurança

Somente administradores confiáveis devem criar ou alterar perfis de coordenação. As regras Firestore do projeto negam a criação de perfis pelo cliente; essa ação deve ocorrer no Firebase Console ou por uma ferramenta administrativa protegida.
