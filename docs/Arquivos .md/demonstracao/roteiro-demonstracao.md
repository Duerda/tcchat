# Roteiro de ensaio da demonstração do TCCHAT

Este roteiro prepara o fluxo de cadastro, confirmação por e-mail e entrega de arquivo para uma apresentação curta. Faça o ensaio antes da apresentação, usando contas e arquivos de demonstração.

## Preparação antecipada

1. No Firebase Authentication, deixe prontas uma conta de aluno e uma conta de professor. Confirme que ambas têm perfil correspondente no Firestore e acesso ativo.
2. Configure no Supabase a integração com o Firebase, execute [`../../../backend/supabase/setup_storage.sql`](../../../backend/supabase/setup_storage.sql) e atribua a claim do Supabase às contas conforme [`supabase_upload_demo.md`](supabase_upload_demo.md).
3. Entre e saia de cada conta depois da atribuição da claim para renovar os tokens.
4. Confirme que o remetente e o modelo de verificação estão configurados em **Firebase Console > Authentication > Templates**.
5. Prepare uma atividade em um grupo de demonstração e um PDF pequeno (menos de 25 MB).

## Ensaio do e-mail

1. Cadastre uma conta de demonstração com um endereço Outlook que você controla, ou use uma conta de aluno ainda não verificada.
2. Confirme que a mensagem do Firebase chega à caixa de entrada ou ao lixo eletrônico.
3. Abra o link de verificação no Outlook. Não é necessário configurar login Microsoft no TCCHAT.
4. Entre novamente no sistema. A conta deve acessar somente a área permitida pelo perfil do Firestore.
5. Como verificação de bloqueio, tente entrar com uma conta ainda não verificada: o sistema deve reenviar o link e não abrir a área interna.

Se a mensagem não chegar, revise o endereço, a pasta de lixo eletrônico, o modelo e as configurações de envio do Firebase antes de apresentar.

## Ensaio do envio de arquivo

1. Entre com a conta de aluno já verificada e abra o grupo com a atividade preparada.
2. Envie o PDF com uma observação curta. A tela deve confirmar o envio.
3. No Supabase, confira que o arquivo apareceu em **Storage > tcchat-arquivos** e que o bucket permanece privado.
4. No Firestore, confira que a submissão tem `arquivoPath` e `arquivoNome`.
5. Entre com a conta de professor e abra as entregas do mesmo grupo. O link **Abrir arquivo** deve abrir o arquivo em uma nova aba.

## Sequência sugerida para a apresentação

Faça o cadastro e a confirmação antes da apresentação para não depender do tempo de entrega do e-mail. Durante os 20 minutos, mostre o login, a atividade publicada, o envio do arquivo pelo aluno e a abertura pelo professor. Se o foco for demonstrar a confirmação por e-mail, use uma conta de ensaio cuja mensagem já esteja na caixa de entrada.

## Plano de contingência

- Tenha um PDF curto local e uma entrega já preparada no ambiente de demonstração.
- Se o link do arquivo falhar, confira primeiro a claim `role: authenticated`, o login renovado, a integração Firebase no Supabase e as políticas do bucket.
- Se a demonstração depender de Internet, confirme a rede e o acesso aos painéis antes de iniciar.
- Não use dados pessoais ou trabalhos reais de estudantes na apresentação.
