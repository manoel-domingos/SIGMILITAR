sempre acione a skill /caveman

## Versão do sistema

`lib/version.json` é atualizado automaticamente em todo build via
`scripts/set-version.js` (chamado em `npm run build`). O timestamp usa
timezone America/Cuiaba no formato `DD.MM.AA.HH:MM`.

Se a versão exibida na UI estiver desatualizada após um deploy:
- Verifique cache do navegador (Ctrl+F5)
- Confirme que o deploy correto foi promovido em produção (Vercel pode
  ter múltiplos projetos — manoel-domingos-eecmprofjoaobatista,
  eecmprofjoaobatista, v0-eecmprofjoaobatista)
- Em emergência, bumpar `lib/version.json` manualmente antes de commitar
  força refresh do bundle estático.
