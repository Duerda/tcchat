# Provisionar uma conta de coordenação

As contas de coordenação são criadas por um administrador do projeto Firebase. Não use códigos compartilhados no site: qualquer segredo enviado ao navegador pode ser inspecionado.

## Criar a conta

1. Acesse o [Firebase Console](https://console.firebase.google.com/), selecione o projeto **TCCHAT** e abra **Authentication > Users**.
2. Clique em **Add user** e informe um endereço de e-mail acessível pelo coordenador e uma senha inicial temporária. Para demonstração, pode ser um e-mail pessoal; não é obrigatório usar `@cps.sp.gov.br`.
3. Copie o UID exibido na lista. O UID é o identificador interno da conta, não o e-mail.
4. Abra **Firestore Database > Data**, selecione ou crie a coleção `usuarios` e crie um documento com ID exatamente igual ao UID copiado.
5. Adicione estes campos ao documento:

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

6. Entregue a senha inicial por um canal seguro. No primeiro login pelo TCCHAT, o Firebase enviará um link de verificação ao endereço cadastrado. O coordenador deve abrir o link no próprio e-mail e depois entrar novamente. Se usar Outlook, basta abrir a mensagem no Outlook; não é necessário configurar login Microsoft.
7. Depois do primeiro acesso, oriente o coordenador a trocar a senha temporária nas configurações da conta.

A conta precisa existir no Authentication e o perfil correspondente precisa existir no Firestore antes do primeiro login. O perfil autoriza o papel de coordenador, independentemente do domínio do e-mail; a verificação confirma que a pessoa controla o endereço informado. O cadastro público continua sem criar contas de coordenação.

## Contas existentes

Não recrie os usuários já existentes. Confirme que cada conta de coordenação tem um documento `usuarios/{uid}` com `tipo: "coordenador"` e que `acessoAtivo` não está definido como `false`. Depois da remoção do código compartilhado, o login será autorizado pelo perfil.

## Segurança

Somente administradores confiáveis devem criar ou alterar perfis de coordenação. As regras Firestore do projeto negam a criação de perfis pelo cliente; essa ação deve ocorrer no Firebase Console ou por uma ferramenta administrativa protegida. O modelo do e-mail de verificação é configurado em **Authentication > Templates**.
