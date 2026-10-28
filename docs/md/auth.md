## Cadastro

O formulário pede nome, e-mail, senha, confirmação da senha e código. A senha precisa ter pelo menos 8 caracteres. O código deve ter formato de turma, como `DS-1` ou `ADM-3`; isso vale para todos os perfis, inclusive coordenação ([Cad-back.js](/home/e/codigos/tcchat/pages/auth/Cadastro/Cad-back.js:21), [validation.js](/home/e/codigos/tcchat/backend/auth/validation.js:24)).

O domínio do e-mail define o perfil:

- `@aluno.cps.sp.gov.br` → aluno
- `@professor.cps.sp.gov.br` → professor
- `@cps.sp.gov.br` → coordenador ([validation.js](/home/e/codigos/tcchat/backend/auth/validation.js:12))

Para **alunos e professores**, o código de turma também precisa existir em `codigosAcesso`, ter o tipo correspondente — ou `ambos` — e não estar revogado nem vencido. A coordenação cria esses códigos no painel; o sistema registra quando são usados ([Cad-back.js](/home/e/codigos/tcchat/pages/auth/Cadastro/Cad-back.js:70), [Coord-script.js](/home/e/codigos/tcchat/pages/Coordenador/Coord-script.js:217)).

Depois, o sistema cria a conta no Firebase Authentication e grava o perfil em `usuarios/{uid}` no Firestore. Se o perfil for salvo, redireciona a pessoa para a área correspondente. Se a conta de autenticação já tiver sido criada numa tentativa anterior, mas faltar o perfil, o cadastro tenta concluir esse perfil com o mesmo e-mail e senha ([Cad-back.js](/home/e/codigos/tcchat/pages/auth/Cadastro/Cad-back.js:90), [Cad-back.js](/home/e/codigos/tcchat/pages/auth/Cadastro/Cad-back.js:142)).

## Login

**Aluno:** informa e-mail e senha. O sistema verifica se existe perfil no Firestore, se o tipo é `aluno` e se o acesso não foi revogado. Então atualiza o último acesso e abre a área do aluno ([Log-aluno.js](/home/e/codigos/tcchat/pages/auth/Login/Log-aluno.js:34)).

**Professor:** informa e-mail e senha na tela compartilhada com coordenação. O perfil precisa ser `professor`, estar ativo e existir no Firestore. Se tudo estiver correto, abre a área do professor ([Log-prof.js](/home/e/codigos/tcchat/pages/auth/Login/Log-prof.js:107)).

**Coordenador:** na mesma tela, abre a opção “Coordenador” e informa e-mail, senha e o código fixo `C00RD`. Depois do login, o perfil no Firestore também precisa estar marcado como `coordenador` e ativo. A tela então abre o painel da coordenação ([Log-prof.js](/home/e/codigos/tcchat/pages/auth/Login/Log-prof.js:6), [Log-prof.js](/home/e/codigos/tcchat/pages/auth/Login/Log-prof.js:81)).

As páginas internas repetem a conferência de sessão, tipo de perfil e status do acesso quando são abertas ([professor.js](/home/e/codigos/tcchat/backend/firebase/professor.js:30)).

## A coordenação precisa de outro coordenador?

Para aluno e professor, **sim: precisam receber da coordenação um código de acesso válido antes de se cadastrar**.

Para criar uma conta de coordenador, o código de acesso da coleção `codigosAcesso` **não é exigido**. O cadastro classifica como coordenador pelo domínio `@cps.sp.gov.br`, embora ainda exija um código de turma válido, como `DS-1`. Depois, para entrar, a pessoa precisa informar `C00RD` na opção de coordenador.

Portanto, no fluxo atual, `C00RD` é um código fixo usado no login; não é um código de cadastro emitido por outro coordenador. Também é diferente do código de turma informado no formulário.