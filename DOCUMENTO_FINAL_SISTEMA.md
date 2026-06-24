# TCChat - Documentação Final do Sistema (Backend & Firebase)

Este documento resume todas as implementações realizadas para transformar o TCChat em um sistema de gestão de projetos profissional, acessível e sincronizado em tempo real.

## 1. Arquitetura de Dados (Firebase)

O sistema utiliza o **Firebase** como motor principal, eliminando a necessidade de servidores caros e complexos.

### Autenticação (Firebase Auth)
- **Login/Cadastro**: Realizado via E-mail Institucional (@aluno.cps.sp.gov.br ou @professor.cps.sp.gov.br).
- **UID Único**: Cada usuário possui um identificador único que vincula seus dados e arquivos.

### Banco de Dados (Firestore)
- **Coleção `usuarios`**: Armazena perfil, cargo (Aluno/Professor), código da sala e **preferências de acessibilidade**.
- **Coleção `grupos`**: Armazena os dados dos 6 grupos de cada sala, incluindo líder, membros e progresso.
- **Sincronização Real-time**: O sistema usa `onSnapshot`, o que significa que qualquer alteração no banco reflete no site instantaneamente sem recarregar a página.

## 2. Funcionalidades Implementadas

### Gestão de Salas Dinâmicas
- O aluno entra em uma sala baseada no seu código de cadastro (Ex: `DS-3`).
- O sistema carrega dinamicamente os grupos e o curso correspondente.

### Acessibilidade e Personalização
- **Persistência**: Tema (Claro/Escuro), fontes e tamanhos são salvos na nuvem. O usuário nunca perde suas configurações.
- **Inclusão**: Preparado para suportar diferentes necessidades visuais, conforme o planejamento pedagógico da ETEC.

### Hierarquia e Colaboração
- **Líder do Grupo**: Possui permissões especiais para gerenciar o nome do projeto e os integrantes.
- **Destaque Visual**: Identificação clara de quem é o líder e em qual grupo o usuário logado está inserido ("Meu Grupo").

## 3. Como Testar o Sistema

1. **Acesse o link de teste** fornecido.
2. **Cadastre-se** usando um código válido (Ex: `DS-3`, `ADM-1`, `INF-2`).
3. **Verifique a Sala**: Você verá seu nome e curso carregados automaticamente na barra lateral.
4. **Teste o Real-time**: Se você alterar os dados no painel do Firebase, verá a mudança na tela na mesma hora.

## 4. Estrutura SQL (Referência)
Para fins de documentação futura ou migração para servidores próprios, o arquivo `tcchat_schema_postgresql.sql` contém toda a estrutura relacional equivalente ao que foi implementado no Firebase.

---
**Desenvolvido por Manus AI para o Projeto TCChat.**

## 5. Regras de Segurança Recomendadas (Firestore)

Para garantir a integridade dos dados com a nova hierarquia de três níveis, as seguintes regras devem ser aplicadas no Console do Firebase:

```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Regras para a coleção de usuários
    match /usuarios/{userId} {
      // Coordenador: Acesso total
      allow read, write: if get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'coordenador';
      
      // Professor: Lê todos da sala, escreve apenas no próprio perfil
      allow read: if get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'professor';
      allow write: if request.auth.uid == userId;
      
      // Aluno: Lê e escreve apenas no próprio documento
      allow read, write: if request.auth.uid == userId;
    }
    
    // Regras para a coleção de grupos
    match /grupos/{grupoId} {
      allow read: if request.auth != null;
      // Apenas Coordenadores e o Líder do Grupo podem editar o grupo
      allow write: if get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'coordenador' ||
                   resource.data.liderUid == request.auth.uid;
    }
  }
}
```
