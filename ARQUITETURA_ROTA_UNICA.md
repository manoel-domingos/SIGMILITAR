# Arquitetura de Domínio Único e Rotas de Contexto para o SIGMILITAR

A transição para um modelo de **domínio único** com rotas bem definidas simplifica a infraestrutura de rede, elimina a complexidade de gerenciar subdomínios dinâmicos e melhora significativamente a segurança e a consistência das sessões de usuário [1]. A estratégia centraliza todas as operações sob o domínio principal `www.sigmilitar.com.br`, utilizando sub-rotas para segmentar as experiências de cada perfil.

---

## 1. Mapeamento de Rotas e Responsabilidades

A tabela abaixo descreve a nova estrutura de rotas do sistema, seus públicos-alvo e os requisitos de acesso para cada uma delas:

| Rota | Descrição Funcional | Público-Alvo | Requisito de Acesso |
| :--- | :--- | :--- | :--- |
| `/` | **Landing Page Comercial** | Visitantes, Clientes em Prospecção | Público (Livre) |
| `/login` | **Autenticação Unificada** | Todos os usuários cadastrados | Público (Redireciona se já logado) |
| `/cadastro` | **Adesão e Onboarding** | Novas DREs, Escolas e Administradores | Público (Controlado por chave de convite) |
| `/dre` | **Painel de Controle Regional** | Gestores de DRE e Admin Global | Autenticado (`role` in `admin_global`, `GESTOR_DRE`) |
| `/escola` | **Painel de Controle Escolar** | Diretores, Coordenadores, Monitores | Autenticado (`role` in `GESTOR`, `COORD`, `MONITOR`) |
| `/escola/professor` | **Portal do Docente** | Professores da Unidade | Autenticado (`role` = `PROFESSOR`) |

---

## 2. Fluxo de Autenticação e Resolução de Contexto

Sem a detecção automática por subdomínio, o sistema precisa determinar dinamicamente qual contexto carregar no momento em que o usuário se autentica. O fluxo operacional é estruturado em três etapas principais:

### Passo 1: Login Centralizado e Claims no JWT
Quando o usuário realiza o login na rota `/login`, o Supabase Auth valida as credenciais. Os metadados do perfil do usuário, salvos na tabela `profiles` ou `app_users`, contêm as seguintes claims essenciais:
* `role`: Define o nível de permissão (ex: `admin_global`, `GESTOR_DRE`, `GESTOR`, `MONITOR`).
* `dre_id`: Vincula o usuário a uma Diretoria Regional específica (nulo para Admin Global).
* `school_id`: Vincula o usuário a uma escola específica (nulo para Admin Global e Gestores de DRE).

### Passo 2: Redirecionamento Baseado em Claims (Router Guard)
Após a validação do token, o Next.js Middleware ou o estado global do React (`store.tsx`) intercepta a sessão e realiza o redirecionamento imediato para a rota correspondente ao perfil [1]:
* Se `role` for `admin_global` ou `GESTOR_DRE`, redireciona para `/dre`.
* Se `role` for `GESTOR`, `COORD` ou `MONITOR`, redireciona para `/escola`.
* Se `role` for `PROFESSOR`, redireciona para `/escola/professor`.

### Passo 3: Carregamento do Contexto Dinâmico
Ao acessar a rota `/escola` ou `/dre`, o sistema inicializa o contexto correspondente:
* **Na rota `/escola`:** O componente lê o `school_id` do perfil do usuário logado e faz a busca de dados filtrando exclusivamente por este ID. O cabeçalho, as cores e a logo da escola são carregados dinamicamente a partir das configurações da escola associada.
* **Na rota `/dre`:** O componente carrega o `dre_id` do usuário. Se o usuário for um `admin_global`, um seletor de DRE é exibido para permitir a navegação entre diferentes regiões.

---

## 3. Mecanismo de Cadastro e Onboarding Seguro (`/cadastro`)

Para evitar cadastros falsos ou invasão de dados, a rota `/cadastro` deve ser estritamente controlada:

### Cadastro de Novas DREs e Escolas (Fluxo Comercial)
O auto-cadastro público é desabilitado por padrão. Quando uma nova DRE ou Escola contrata o sistema, o administrador global gera um **Token de Convite Único** através da tela master de administração.
* O link de cadastro enviado ao cliente segue o formato: `www.sigmilitar.com.br/cadastro?token=TOKEN_GERADO`.
* A página `/cadastro` valida o token no Supabase. Se for válido, ela libera o formulário para cadastrar a instituição (DRE ou Escola) e o primeiro usuário administrador daquela unidade.

### Cadastro de Usuários Operacionais (Monitores e Professores)
Monitores e professores não se cadastram sozinhos no site. Eles são cadastrados diretamente pelo **Gestor Escolar** ou **Coordenador** de sua respectiva escola através do painel interno `/escola/configuracoes`.
* O gestor insere o nome, e-mail e perfil (Monitor ou Professor).
* O sistema envia um e-mail automático de boas-vindas com um link para o usuário definir sua senha pessoal de acesso.

---

## 4. Proteção de Rotas e Segurança com Middleware

Para garantir que um usuário não acesse dados de outro contexto (ex: um monitor tentando acessar o painel `/dre`), o Next.js utiliza um arquivo `middleware.ts` na raiz do projeto [1]. Este arquivo intercepta todas as requisições antes de renderizar a página no navegador.

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // 1. Se não houver sessão e tentar acessar rotas protegidas, manda para o login
  if (!session && (pathname.startsWith('/escola') || pathname.startsWith('/dre'))) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. Se houver sessão, valida o perfil do usuário
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      // Impede monitores e professores de acessarem o painel DRE
      if (pathname.startsWith('/dre') && !['admin_global', 'GESTOR_DRE'].includes(profile.role)) {
        url.pathname = '/escola';
        return NextResponse.redirect(url);
      }

      // Impede gestores de DRE de acessarem o painel de escola sem contexto definido
      if (pathname.startsWith('/escola') && ['GESTOR_DRE'].includes(profile.role)) {
        url.pathname = '/dre';
        return NextResponse.redirect(url);
      }
    }
  }

  return res;
}
```

---

## 5. Vantagens Estratégicas desta Abordagem

Adotar a estrutura de domínio único traz benefícios claros para o crescimento do SIGMILITAR:
* **Redução de Custos de Infraestrutura:** Não há necessidade de configurar registros DNS curinga (*wildcard*) ou gerenciar múltiplos certificados SSL para cada nova escola que entra no sistema.
* **Consistência de Sessão:** O navegador mantém os cookies de autenticação do Supabase centralizados em um único domínio, evitando problemas comuns de deslogar o usuário ao navegar entre telas.
* **Facilidade de Atualização:** Qualquer alteração de design, correção de bug ou nova funcionalidade é implantada em um único local e entra em vigor instantaneamente para toda a rede de usuários.

---

## References
[1] [The developer’s guide to SaaS multi-tenant architecture](https://workos.com/blog/developers-guide-saas-multi-tenant-architecture)
