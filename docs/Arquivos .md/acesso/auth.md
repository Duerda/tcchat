## Cadastro

O formulário público é destinado a alunos e professores, aceita e-mails de qualquer domínio válido e deixa a pessoa escolher o tipo de conta. A coordenação gera o convite de acesso. Convites de aluno valem para uma turma; convites novos de professor podem autorizar de uma a oito turmas. O professor recebe um único código para todas as turmas escolhidas; os novos convites de professor podem ser usados por uma conta.

No cadastro, o sistema consulta o convite pelo identificador exato e cria o perfil em `usuarios/{uid}` com `codigoAcessoId`, `codigoAcessoIds` e as turmas autorizadas em `codigoSala`/`codigoSalas`. O perfil e o registro de uso do convite são gravados na mesma operação do Firestore para evitar deixar apenas uma dessas alterações concluída. As regras conferem o tipo, a validade, o estado de revogação e a lista de turmas permitidas. Convites antigos de professor com apenas `codigoSala` continuam valendo para uma turma.

O perfil fica pendente até a confirmação: as regras de dados exigem a claim `email_verified` do Firebase Authentication para reconhecer qualquer papel. O Firebase envia um link de verificação ao endereço informado. A pessoa pode abrir a mensagem no Outlook ou em outro serviço de e-mail; não é necessário login Microsoft. Depois de confirmar, entra novamente no TCCHAT. Se tentar entrar antes, o login envia outro link e não libera o painel.

Convites antigos cujo valor era apenas o código da turma (por exemplo, `DS-1`) não servem para o fluxo atual. Gere e distribua novos convites pela tela da coordenação. Convites novos de professor são de uso único e devem ser compartilhados somente com a pessoa a quem se destinam; convites antigos de professor podem continuar reutilizáveis. Convites de aluno continuam ligados a uma turma e podem ser usados por vários alunos, conforme a distribuição da coordenação.

Contas de coordenação não são criadas pelo formulário público. Um administrador provisiona a conta no Firebase Authentication e cria o perfil correspondente no Firestore. Isso evita conceder o papel de coordenador por meio de uma senha compartilhada incluída no JavaScript.

## Login

**Aluno:** entra pela tela de aluno. O sistema verifica se existe um perfil no Firestore, se o tipo é `aluno` e se o acesso está ativo.

**Professor:** entra pela tela compartilhada de professor e coordenação, selecionando “Professor”. O sistema verifica o perfil e exige `tipo: "professor"`.

**Coordenador:** usa a mesma tela e seleciona “Coordenador”. Pode entrar com qualquer endereço de e-mail que esteja cadastrado e acessível; a seleção apenas define a área esperada. A autorização vem do perfil `usuarios/{uid}`, que deve ter `tipo: "coordenador"` e acesso ativo. Não existe código compartilhado de coordenação, e o cadastro público continua bloqueado para esse papel.

As páginas internas repetem a validação da sessão, do tipo de perfil e do status de acesso.

## Provisionamento de coordenadores

O administrador cria a conta no Firebase Authentication e, em seguida, cria `usuarios/{uid}` usando como ID do documento o UID gerado pelo Firebase. O documento precisa conter `uid`, `nome`, `email`, `tipo: "coordenador"`, `iniciais`, `escopo: "global"`, `curso: "Coordenação global"` e `acessoAtivo: true`. No primeiro login, o Firebase envia um link de verificação ao coordenador; o painel só fica acessível depois da confirmação.

O formulário público bloqueia e informa que contas de coordenação devem ser solicitadas à administração. A coordenação deve ser provisionada antes do primeiro login.

## Observação de implantação

As regras locais em `backend/firebase/firestore.rules` permitem criar perfis de alunos e professores quando há um convite válido e consultar um convite pelo ID exato, sem permitir que usuários comuns listem a coleção. Antes de publicar, revise os demais fluxos e valide que as permissões de grupos, atividades, entregas e outras coleções correspondem às consultas e gravações reais do TCCHAT.

As avaliações agora registram os UIDs dos integrantes do grupo no momento em que são publicadas. A tela do aluno consulta avaliações destinadas ao seu grupo, e as regras impedem a leitura de avaliações de outros grupos. Avaliações antigas sem o campo `membros` não serão exibidas para alunos sob essas regras; antes da implantação, será necessário preencher esse campo nos documentos antigos a partir do grupo referenciado, usando uma migração administrativa confiável.
