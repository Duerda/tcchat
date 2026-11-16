## Cadastro

O formulário público é destinado a alunos e professores. O domínio institucional define o perfil. A coordenação gera um convite aleatório ligado a uma turma e ao tipo de conta permitido; o cadastro consulta esse convite pelo identificador exato, deriva dele a turma e cria o perfil em `usuarios/{uid}` com a referência `codigoAcessoId`. As regras do Firestore verificam que o convite existe, não foi revogado nem expirou e corresponde ao tipo e à turma do perfil. O uso do convite é registrado uma vez por UID.

Convites antigos cujo valor era apenas o código da turma (por exemplo, `DS-1`) não servem para o novo fluxo. Gere e distribua novos convites pela tela da coordenação. Como o convite autoriza um cadastro, compartilhe-o somente com a pessoa a quem se destina.

Contas de coordenação não são criadas pelo formulário público. Um administrador provisiona a conta no Firebase Authentication e cria o perfil correspondente no Firestore. Isso evita conceder o papel de coordenador por meio de uma senha compartilhada incluída no JavaScript.

## Login

**Aluno:** entra pela tela de aluno. O sistema verifica se existe um perfil no Firestore, se o tipo é `aluno` e se o acesso está ativo.

**Professor:** entra pela tela compartilhada de professor e coordenação, selecionando “Professor”. O sistema verifica o perfil e exige `tipo: "professor"`.

**Coordenador:** usa a mesma tela e seleciona “Coordenador”. A seleção apenas define a área esperada; a autorização vem do perfil `usuarios/{uid}`, que deve ter `tipo: "coordenador"` e acesso ativo. Não existe código compartilhado de coordenação.

As páginas internas repetem a validação da sessão, do tipo de perfil e do status de acesso.

## Provisionamento de coordenadores

O administrador cria a conta no Firebase Authentication e, em seguida, cria `usuarios/{uid}` usando como ID do documento o UID gerado pelo Firebase. O documento precisa conter `uid`, `nome`, `email`, `tipo: "coordenador"`, `iniciais`, `escopo: "global"`, `curso: "Coordenação global"` e `acessoAtivo: true`.

O formulário público bloqueia e informa que contas de coordenação devem ser solicitadas à administração. A coordenação deve ser provisionada antes do primeiro login.

## Observação de implantação

As regras em `firestore.rules` agora permitem criar perfis de alunos e professores quando há um convite válido e permitem a consulta de um convite pelo ID exato, sem permitir que usuários comuns listem a coleção. Ainda não publique as regras sem revisar os demais fluxos do sistema e validar todas as operações existentes: as permissões para grupos, atividades, entregas e outras coleções também precisam corresponder às consultas e gravações reais do TCCHAT.
