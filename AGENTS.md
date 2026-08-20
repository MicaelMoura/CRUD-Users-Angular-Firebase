# AGENTS.md

## Escopo

Estas instruções valem para todo o repositório. Antes de alterar código, leia este arquivo, `package.json`, `angular.json`, `src/app/app.module.ts`, `src/app/app-routing.module.ts` e os arquivos diretamente relacionados à tarefa.

## Visão do produto

O projeto é o **COMMERCIUM**, um sistema web de gestão e ponto de venda multiempresa. Cada empresa funciona como um tenant. O sistema reúne autenticação, usuários, empresas, fornecedores, produtos, estoque, vendas e fluxo/abertura/fechamento de caixa.

O repositório ainda usa o nome técnico Angular `simple`; não renomeie projeto, diretórios de build ou scripts sem ajustar todas as referências em `angular.json`, `package.json`, `firebase.json` e SSR.

## Tecnologias e decisões existentes

- Angular 21 com TypeScript 5.9 em modo estrito. O projeto requer Node.js 22.12 ou superior dentro da linha 22.x.
- Arquitetura baseada em `NgModule`; componentes não são standalone.
- Angular Material para tabelas, diálogos, formulários, snackbars, datas e ícones.
- SCSS por componente e estilos globais em `src/styles.scss`.
- Reactive Forms como padrão para formulários; há uso pontual de FormsModule.
- Signals e `computed` para estado local e estado de autenticação; RxJS para streams do Firestore e eventos de formulário.
- Firebase Authentication e Cloud Firestore pela API modular do Firebase JavaScript SDK 12.
- Firebase Hosting para a SPA gerada em `dist/simple/browser`.
- Estrutura SSR/Express gerada pelo Angular presente, embora o deploy configurado seja de SPA estática.
- Karma + Jasmine para testes unitários.
- Locale de datas `pt-BR`, adapter Moment e formato `DD/MM/YYYY`.
- `ngx-mask` para máscaras de entrada e Bootstrap 5 para parte do layout.

Não reintroduza `@angular/fire/compat`, namespaces `firebase/compat` ou a antiga API encadeada `AngularFirestore`. Preserve a API modular de `firebase/auth` e `firebase/firestore`; a inicialização compartilhada e o adapter Observable ficam em `src/app/services/firebase.service.ts`.

## Organização do código

- `src/app/pages/`: páginas e diálogos específicos de cada domínio.
- `src/app/components/`: componentes compartilhados, atualmente menu e botão.
- `src/app/services/`: autenticação e acesso ao Firestore.
- `src/app/interfaces/`: contratos persistidos ou usados pela UI.
- `src/environments/`: configuração Firebase por ambiente.
- `src/constants.ts`: nome e slogan do produto e identificador da empresa administradora do sistema.
- `src/assets/`: imagens da aplicação.

Ao criar uma funcionalidade de domínio, mantenha página, template, SCSS e modais dentro da mesma pasta em `pages`. Mantenha acesso ao Firebase nos serviços; componentes devem coordenar UI, validação e mensagens, não montar caminhos do banco diretamente.

## Modelo multiempresa e Firestore

O tenant ativo é mantido em `AuthService.activeTenantId`. Nunca execute leitura ou escrita de dados de negócio sem um `empresaId` válido. Não use um ID fixo de empresa e não faça fallback silencioso para string vazia.

Estrutura atualmente usada:

```text
business/{empresaId}
  users/{userId}
  supplier/{fornecedorId}
  products/{produtoId}
  stock/{stockId}
  sales/{vendaId}
  cashflow/{movimentoId}
  caixa_fechamento/{registroId}

plataform/vOyNkQyF32YgFkc1ijyy
  units/{unitId}
  payments/{paymentId}
```

Preserve os nomes efetivamente persistidos, inclusive os nomes em inglês e `caixa_fechamento`. Uma mudança de coleção ou campo exige estratégia explícita de migração e compatibilidade com dados existentes.

Use os IDs retornados por `valueChanges({ idField: ... })` de acordo com cada interface. Há inconsistência histórica entre `id` e `firebaseId`; não amplie essa inconsistência. Ao modificar um domínio, normalize o contrato dentro daquele domínio e ajuste template, componente, serviço e testes juntos.

Datas gravadas no Firestore devem ser tratadas como `Timestamp` na leitura e convertidas para `Date` apenas na borda da UI. Valores monetários e quantidades devem permanecer numéricos; formatação brasileira pertence à apresentação.

## Funcionalidades já implementadas

- Login por empresa, e-mail e senha e recuperação de senha.
- Estado de usuário, tenant e papel por Signals no `AuthService`.
- CRUD de empresas, usuários, fornecedores e produtos.
- Cadastro, ajuste, consulta e baixa de estoque.
- PDV com busca de produtos, leitura e validação de EAN, multiplicador de quantidade, etiquetas de balança, seleção de pagamento, registro da venda, baixa do estoque, lançamento no caixa e cupom visual.
- Entradas, saídas, saldo, abertura e fechamento de caixa.
- Tabelas Material com filtro, ordenação e paginação em várias páginas.
- Build de produção e configuração de deploy no Firebase Hosting.

## Lacunas conhecidas e prioridades

Trate esta lista como dívida já existente. Atualize-a quando uma lacuna for realmente resolvida.

### Prioridade crítica

- Não há guards nas rotas internas nem autorização por papel. Ocultar o menu de empresas não protege a rota `/empresas`.
- Não há `firestore.rules` versionado nem configuração de rules em `firebase.json`. O isolamento entre tenants precisa ser garantido no servidor, não apenas pelo `empresaId` do cliente.
- `senhaAdmin` faz parte do documento/interface de empresa e é enviada ao Firestore. Senhas não podem ser persistidas, exibidas, registradas ou atualizadas como dado de negócio.
- O logout do menu limpa `sessionStorage`, mas não chama `AuthService.logout()`; a sessão Firebase pode continuar autenticada.
- O tenant é definido antes do login e o carregamento do papel depende de `userUid`; o callback posterior de autenticação não recarrega automaticamente o papel. Revisar a sequência de login/restauração de sessão.
- Finalização da venda, baixa de estoque e lançamento no caixa são operações separadas. Falhas parciais podem deixar os dados inconsistentes; implementar transação, batch ou backend idempotente antes de considerar o fluxo confiável.

### Prioridade alta

- Validar estoque disponível e impedir quantidade negativa antes de concluir venda.
- `getQuantidadeEmEstoque` assume que a consulta sempre retorna documento.
- A abertura/fechamento de caixa usa registros na coleção `caixa_fechamento`; revisar o período usado no fechamento e impedir mais de um caixa aberto por empresa/operador.
- A emissão de NFC-e é somente um stub com URL de exemplo e está desativada no fluxo de venda.
- Dados exibidos no cupom e identificação do operador/empresa ainda contêm placeholders.
- A criação de empresa cria uma conta no Firebase Auth usando a sessão do cliente, o que pode trocar o usuário autenticado. Mover provisionamento administrativo para ambiente confiável.

### Qualidade e manutenção

- Os testes atuais são majoritariamente smoke tests gerados e não cobrem regras de negócio.
- Na linha de base de 20/08/2026, a suíte headless executa 11 testes com sucesso. A cobertura ainda é predominantemente de smoke tests e deve crescer junto das regras de negócio.
- Há subscriptions sem estratégia uniforme de descarte, uso frequente de `any`, logs de depuração e mensagens com `alert`/`confirm` misturadas a snackbars.
- Não há lint configurado no `package.json`.
- O README ainda não documenta instalação, Firebase, arquitetura nem operação.
- O build alerta sobre o orçamento do bundle inicial, o orçamento de `sales.component.scss` e o uso CommonJS de Moment.
- A auditoria de dependências de produção está zerada. A auditoria completa ainda aponta alertas transitivos exclusivos do toolchain Angular 21 (`less/image-size` e `webpack-dev-server/sockjs/uuid`) sem correção compatível publicada. Não execute correção forçada: ela propõe Angular 22, que exige uma versão de Node mais nova e ainda requer uma migração principal separada.

## Padrões para alterações

- Preserve `strict`, `strictTemplates`, `noImplicitReturns` e os demais checks do `tsconfig.json`; não enfraqueça o compilador para contornar erros.
- Prefira tipos explícitos e interfaces do domínio. Evite novos `any`, non-null assertions e casts de `Timestamp` espalhados.
- Use Reactive Forms com validators e bloqueie persistência quando o formulário estiver inválido.
- Normalize nomes de métodos em português conforme o domínio atual, mas mantenha nomes de coleções/campos persistidos compatíveis.
- Em operações assíncronas, apresente estado de carregamento, trate erro para o usuário e preserve a causa técnica no log sem expor credenciais ou dados pessoais.
- Não deixe `subscribe` aninhado. Prefira composição RxJS, `async` pipe ou descarte com `takeUntilDestroyed`; subscriptions mantidas pelo componente devem ser encerradas.
- Para diálogos, tipar `MAT_DIALOG_DATA` e `MatDialogRef`, retornar um resultado explícito e recarregar dados somente quando houver alteração confirmada.
- Para tabelas, use `MatTableDataSource<T>` em vez de `any` e conecte paginator/sort após a view estar pronta.
- Não faça mutações silenciosas no objeto recebido pelo componente antes de persistir; monte payloads tipados.
- Regras críticas de estoque, caixa, autorização e fiscalidade precisam de testes unitários. Fluxos que atravessam múltiplas coleções também precisam de teste de integração com Firebase Emulator ou backend equivalente.
- Não registre senhas, tokens, configuração sensível, dados pessoais ou payloads completos no console, em fixtures ou documentação.

## Comandos de trabalho

Use a versão travada no `package-lock.json`:

```powershell
npm ci
npm start
npm run build
npx ng test --watch=false --browsers=ChromeHeadless
npm audit --omit=dev
npm run deploy
```

`npm run deploy` altera o ambiente Firebase remoto. Execute somente quando o usuário pedir explicitamente e após confirmar o projeto/alias de destino. Não use `npm audit fix --force` sem autorização e uma tarefa dedicada de atualização.

## Validação obrigatória

Para qualquer alteração de código:

1. Execute `npm run build`.
2. Execute os testes relevantes e, quando possível, a suíte headless completa.
3. Compare falhas com a linha de base descrita acima e informe claramente falhas preexistentes.
4. Para mudanças de UI, verifique a página afetada em largura desktop e móvel, estados vazio/carregando/erro e abertura/fechamento de diálogos.
5. Para mudanças Firebase, valide tenant, caminho, ID do documento, conversão de datas e comportamento em erro/resultado vazio.
6. Para venda, estoque ou caixa, valide falha parcial e consistência entre coleções.

Não afirme que uma alteração está concluída sem relatar os comandos executados e seus resultados. Não corrija dívidas fora do escopo silenciosamente; se uma dívida bloquear a tarefa, explique o bloqueio e proponha uma mudança separada.

## Arquivos gerados e configuração

- Não edite `dist/` nem `node_modules/`.
- Não versione artefatos locais, logs ou resultados de teste.
- Preserve os dois arquivos de environment e o file replacement de desenvolvimento.
- Antes de tocar em configuração Firebase, confirme se o valor pode ser público. Nunca introduza credenciais administrativas, service-account JSON, tokens ou chaves privadas no frontend.
- O deploy atual usa o alias Firebase `prod`; confirme o destino antes de qualquer publicação.

## Checklist de entrega

- A mudança respeita o isolamento por `empresaId`.
- Nenhum segredo ou senha foi persistido/logado.
- Interfaces, serviço, componente e template continuam coerentes.
- Estados de sucesso, vazio, carregamento e erro foram considerados.
- Build e testes relevantes foram executados.
- Pendências conhecidas não foram apresentadas como funcionalidade pronta.
- README e esta lista de lacunas foram atualizados quando a arquitetura ou o estado do produto mudou.
