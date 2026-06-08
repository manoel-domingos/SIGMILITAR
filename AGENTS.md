sempre acione a skill /caveman

## Arquitetura multi-tenant (IMPORTANTE)

- **NÃO existem mais subdomínios** (`escola.sigmilitar.com.br` foi descontinuado).
  Todo acesso é por **path/slug** no domínio único: `sigmilitar.com.br/<escola>`
  (ex: `sigmilitar.com.br/eecmheliodoro`, `/eecmprofjoaobatista`, `/eecmtangara`).
  O tenant é resolvido pelo **primeiro segmento do path**, nunca pelo hostname.

- **Tudo vem do banco de dados (Supabase).** Nada de identidade de escola,
  cabeçalho, rodapé, logo, nome, endereço, etc. deve ficar hardcoded no código.
  Quaisquer "defaults" hardcoded são apenas fallback de emergência — a fonte da
  verdade é sempre o BD (ex: tabelas `schools`, `school_settings`).
