# COMMERCIUM

Sistema web multiempresa de gestão e ponto de venda, desenvolvido com Angular, Angular Material, Firebase Authentication e Cloud Firestore.

## Requisitos

- Node.js `>=22.12.0 <23`
- npm 11 ou compatível
- Projeto Firebase configurado nos arquivos de environment

## Desenvolvimento

```powershell
npm ci
npm start
```

A aplicação fica disponível em `http://localhost:4200`.

## Validação

```powershell
npm run build
npx ng test --watch=false --browsers=ChromeHeadless
npm audit --omit=dev
```

## Deploy

```powershell
npm run deploy
```

O deploy publica `dist/simple/browser` no Firebase Hosting configurado pelo alias `prod`. Confirme o projeto de destino antes de executar o comando.

Consulte `AGENTS.md` para a arquitetura, os padrões de desenvolvimento e as lacunas conhecidas.
