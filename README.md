# COMMERCIUM

Sistema web multiempresa de gestão e ponto de venda, desenvolvido com Angular, Angular Material, Firebase Authentication e Cloud Firestore.

O acesso aos dados é isolado por tenant em `business/{empresaId}`. A autenticação valida a associação do usuário ao tenant antes de liberar as rotas internas, e as regras do Firestore repetem essa autorização no servidor.

## Requisitos

- Node.js `>=22.12.0 <23`
- npm 11 ou compatível
- Projeto Firebase configurado nos arquivos de environment
- Java 21 ou superior para executar o emulador do Firestore
- Application Default Credentials somente para executar migrações administrativas

## Desenvolvimento

```powershell
npm ci
npm --prefix functions ci
npm start
```

A aplicação fica disponível em `http://localhost:4200`.

## Validação

```powershell
npm run build
npm run build:functions
npx ng test --watch=false --browsers=ChromeHeadless
npm run test:rules
npm --prefix functions test
npm run test:functions
npm audit --omit=dev
npm --prefix functions audit --omit=dev
```

## Firebase e segurança

- `firestore.rules` protege dados operacionais por tenant e papel.
- `/users` exige papel `administrador` no tenant.
- `/empresas` exige `administrador` no tenant de sistema `tecmhaicky`.
- O provisionamento de empresas ocorre na callable Function `provisionarEmpresa`, na região `southamerica-east1`.
- O cadastro, a edição e a remoção de acesso de usuários passam pelas callable Functions `provisionarUsuario`, `atualizarUsuario` e `removerAcessoUsuario`. O UID do Authentication é também o ID da associação no tenant ativo.
- A remoção retira a associação da empresa atual e preserva a conta global do Authentication, pois um mesmo usuário pode pertencer a mais de um tenant.
- Escritas diretas em `business/{empresaId}/users` são rejeitadas pelas regras; somente as Functions administrativas mantêm Authentication e Firestore sincronizados.
- A senha inicial do administrador é transitória: segue para a Function e nunca entra no documento da empresa.

Confirme primeiro o alias/projeto Firebase. Publique a Function e o novo frontend antes da migração:

```powershell
npx firebase-tools@15.28.1 deploy --only functions --project prod
npm run deploy
```

### Remoção de senhas legadas

O script administrativo opera em modo de simulação por padrão. Ele usa Application Default Credentials e não aceita arquivos de credencial versionados.

```powershell
npm run migrate:senha-admin -- --project=curso-angular-8e009
```

Após revisar os totais, a execução real exige o ID repetido como confirmação:

```powershell
npm run migrate:senha-admin -- --project=curso-angular-8e009 --apply --confirm-project=curso-angular-8e009
```

A execução remove `senhaAdmin`, substitui senhas potencialmente expostas por valores aleatórios não exibidos, revoga sessões e normaliza o papel do administrador. Os administradores afetados devem usar **Recuperar senha** no próximo acesso.

Depois da migração, publique as regras:

```powershell
npx firebase-tools@15.28.1 deploy --only firestore:rules --project prod
```

Essa ordem garante que os documentos de associação recebam o campo `acesso` antes de as regras passarem a exigi-lo.

## Deploy

```powershell
npm run deploy
```

O deploy publica `dist/simple/browser` no Firebase Hosting configurado pelo alias `prod`. Confirme o projeto de destino antes de executar o comando.

Consulte `AGENTS.md` para a arquitetura, os padrões de desenvolvimento e as lacunas conhecidas.
