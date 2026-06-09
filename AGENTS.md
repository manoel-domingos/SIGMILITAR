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

## Arquitetura multi-tenant (IMPORTANTE)

- **NÃO existem mais subdomínios** (`escola.sigmilitar.com.br` foi descontinuado).
  Todo acesso é por **path/slug** no domínio único: `sigmilitar.com.br/<escola>`
  (ex: `sigmilitar.com.br/eecmprofjoaobatista`). O tenant é resolvido pelo
  **primeiro segmento do path**, nunca pelo hostname.

- **Tudo vem do banco de dados (Supabase).** Nada de identidade de escola,
  cabeçalho, rodapé, logo, nome, endereço, etc. deve ficar hardcoded no código.
  "Defaults" hardcoded são apenas fallback de emergência — a fonte da verdade é
  sempre o BD (ex: tabelas `schools`, `school_settings`).

- **Só existe 1 DRE por enquanto: DRE Tangará da Serra (DRETGA).** As demais
  unidades são escolas, não DREs.

- **Deploy no Vercel sempre para produção** (não deixar apenas em preview).

- **Trabalhar SEMPRE direto no `main`.** Não criar feature branches; commitar e
  empurrar direto para `main`.

## Regra de Redirect Pós-Login (por role)

| Role | Comportamento após login |
|---|---|
| `GESTOR` / `MONITOR` | Direto ao painel cívico-militar (`/<slug>`) — sem modal |
| `admin_global` / `COORD` / `PROFESSOR` | Abre modal de escolha: **Cívico-Militar** ou **Pedagógico** |

Implementado em `app/login/page.tsx` (useEffect de redirect) e
`components/AppShell.tsx` (modal de contexto).
- GESTOR/MONITOR **nunca** vê o modal — vai direto.
- Admin/Coord/Prof **sempre** vê o modal para escolher módulo/escola.
