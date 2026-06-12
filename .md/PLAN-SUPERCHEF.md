# Plano de Implementação — Automação Suparchef no VPS (Sessões Persistentes)

Melhoria na arquitetura de automação do projeto **Suparchef** (`/pedagogico/suparchef`) focando em **Persistência de Sessões (Cookies/Storage State)** para evitar bloqueios do Google, simplificar o clique no CSS e rodar de forma extremamente robusta no VPS.

---

## O Problema do Login Automatizado do Google
Google possui detecções de segurança agressivas contra logins automatizados via Selenium/Playwright (erro *"Este navegador ou app pode não ser seguro"*). Tentar automatizar o preenchimento de e-mail/senha a cada voto resulta em bloqueios frequentes, CAPTCHAs e falhas de 2FA.

## A Solução Proposta: Reutilização de Estado (Cookies)
Em vez de logar toda vez, o Playwright usará o recurso de **`storageState`** (cookies, localStorage e sessões salvas):

1. **Autenticação Única (Setup):** O usuário autentica a conta Google **uma única vez** através de um comando no terminal (modo headed/visível) que abre o navegador. Ele resolve o login, captcha e 2FA manualmente. O script salva os cookies em `sessions/<email>.json`.
2. **Execução Headless (Voto rápido):** Nas execuções automáticas, o robô inicia o navegador injetando diretamente o arquivo de sessão do e-mail correspondente. O site alvo já carrega **autenticado**. O robô apenas navega para a URL alvo, aguarda o botão CSS de voto e clica.
3. **Vantagens:**
   - **Bypass de segurança do Google:** O fluxo de login do Google não é executado nas votações automáticas.
   - **Velocidade:** Cada voto é computado em 3-5 segundos (sem tempo de digitação ou redirects lentos do Google).
   - **Estabilidade:** Imune a alterações de layout das telas de login do Google.

---

## FASE 1 — Análise e Planejamento

### Arquivos afetados
* **`scripts/suparchef-bot.js`** (Modificação)
* **`scripts/suparchef-daemon.js`** (Novo script)
* **`app/api/pedagogico/suparchef/dispatch/route.ts`** (Modificação)
* **`.gitignore`** (Modificação para não subir cookies das contas)
* **`.md/PLAN-SUPERCHEF.md`** (Este plano)

---

## Proposta de Alterações

### 1. Atualização do Script Bot (`suparchef-bot.js`)

#### [MODIFY] [suparchef-bot.js](file:///c:/Users/USER-PC/Documents/eecmprofjoaobatista/scripts/suparchef-bot.js)
* **Adicionar comando de Autenticação (`--auth <email>`)**:
  - Abre o Chromium em modo visível (`headless: false`).
  - Navega para `https://accounts.google.com` (ou diretamente para a URL de login do site alvo).
  - Aguarda o usuário fazer o login completo.
  - Ao detectar sucesso (ou quando o usuário pressionar Enter no terminal), salva o estado em `sessions/<email>.json`.
* **Fluxo de Votação com Cookies**:
  - Verifica se o arquivo `sessions/<email>.json` existe.
  - Se sim, inicia o context com `storageState: 'sessions/<email>.json'`.
  - Navega diretamente para `job.target_url`.
  - Aguarda o seletor `job.vote_selector` estar visível.
  - Clica no botão de voto, aguarda 2 segundos e fecha o browser.
  - Se o login expirou (ex: seletor de voto não visível e botão "Entrar" reapareceu), atualiza o status informando que a sessão precisa de re-autenticação.

---

### 2. Criação do Daemon de Segundo Plano (`suparchef-daemon.js`)

#### [NEW] [suparchef-daemon.js](file:///c:/Users/USER-PC/Documents/eecmprofjoaobatista/scripts/suparchef-daemon.js)
* Monitora continuamente a tabela `suparchef_jobs` no Supabase.
* Ao capturar uma tarefa em `'idle'`, altera o status para `'running'` e executa `suparchef-bot.js` usando as sessões já salvas na VPS.

---

### 3. Proteção dos Dados de Sessão no Git

#### [MODIFY] [.gitignore](file:///c:/Users/USER-PC/Documents/eecmprofjoaobatista/.gitignore)
* Adicionar a linha `/sessions/` para garantir que os arquivos contendo os cookies e dados privados de login das contas nunca sejam expostos no repositório GitHub.

---

### 4. Ajuste na API de Disparo

#### [MODIFY] [route.ts](file:///c:/Users/USER-PC/Documents/eecmprofjoaobatista/app/api/pedagogico/suparchef/dispatch/route.ts)
* Modificar para que, quando `process.env.GITHUB_PAT` não estiver configurado, defina o status do job como `'idle'`, deixando a execução a cargo do daemon da VPS.

---

## Manual de Configuração na VPS (Passo a Passo)

> [!IMPORTANT]
> **Como inicializar as sessões na VPS:**
> 1. Conecte na VPS e garanta que o diretório `sessions` foi criado.
> 2. Execute a autenticação para cada conta cadastrada no Suparchef:
>    ```bash
>    node scripts/suparchef-bot.js --auth seu-email@gmail.com
>    ```
>    *Nota:* Como a VPS é Linux Server (headless), para abrir a janela guiada do Chromium o administrador pode rodar o comando localmente em sua própria máquina de desenvolvimento, gerar os arquivos de sessão na pasta `sessions/` local, e depois copiá-los para a pasta `sessions/` da VPS via SCP ou SFTP.
