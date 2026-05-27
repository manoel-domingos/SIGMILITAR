# Análise de Produto e Proposta de Novas Funcionalidades

## 1. Visão Geral da Aplicação

O sistema da **Escola Estadual Cívico-Militar (EECM) Prof. João Batista** é uma aplicação web institucional focada na gestão disciplinar, pedagógica e administrativa escolar. O objetivo central (*North Star*) do projeto é centralizar e otimizar a gestão operacional, substituindo planilhas e processos manuais em papel por fluxos digitais, ágeis e auditáveis para monitores, professores e a direção escolar.

A aplicação conta com uma base técnica moderna e robusta:
* **Framework:** Next.js 15 (App Router) e React 19.
* **Estilização e Componentes:** Tailwind CSS v4 e Shadcn/UI.
* **Banco de Dados e Autenticação:** Supabase (PostgreSQL) com isolamento multi-tenant (RLS) por `school_id`.
* **Inteligência Artificial:** Integração nativa com o modelo DeepSeek para auxílio na redação de atas, análises de padrões e sugestão de enquadramento de regras.

---

## 2. Análise dos Domínios Funcionais Atuais

A tabela abaixo resume os módulos e domínios já mapeados e implementados (ou em andamento) na aplicação:

| Domínio Funcional | Status Atual | Descrição Operacional |
| :--- | :--- | :--- |
| **Alunos** | Concluído / Operacional | Cadastro de alunos, importação inteligente de planilhas via IA, ficha disciplinar consolidada, arquivamento e módulo **Xerife** (controle de rondas/alertas). |
| **Disciplina** | Operacional (Fase 1) | Registro de ocorrências, faltas disciplinares, termos de conduta, convocação de pais e gestão de documentos. |
| **Comportamento** | Parcial (Fase 5) | Sistema de comportamento e rankings de alunos, registro de elogios/bonificações e controle de acidentes. |
| **Inteligência Artificial** | Operacional (Fase 2) | Assistente DeepSeek integrado para auxílio na escrita de atas, análise comportamental e sugestão de medidas. |
| **Relatórios & Auditoria** | Em andamento (Fase 1/4) | Painel de KPIs, logs de auditoria detalhados por usuário e geração de relatórios. |
| **Multi-Tenant (DRE)** | Estruturado | Suporte a múltiplas escolas e visão consolidada para a Diretoria Regional de Ensino (DRE). |

---

## 3. Propostas de Funcionalidades para Agregar Valor

Considerando o público-alvo principal (monitores civis-militares, direção, professores e a Diretoria Regional de Ensino), as propostas foram divididas em quatro pilares estratégicos: **Operação em Campo (Monitores)**, **Engajamento Familiar (Pais/Responsáveis)**, **Inteligência e Prevenção (Direção/DRE)** e **Gamificação Pedagógica (Alunos)**.

### Pilar 1: Operação em Campo e Mobilidade (Foco nos Monitores)

Monitores passam a maior parte do tempo em ronda física pelos corredores e pátios da escola. Otimizar a experiência móvel (*Mobile-First*) gera ganho imediato de produtividade.

* **Registro Rápido por Voz (Speech-to-Text):**
  * *O que é:* Integração de um botão de microfone na tela de registro de ocorrência móvel. O monitor dita o ocorrido ("Aluno João da turma 9A correndo no pátio e empurrando colegas") e a IA transcreve, formata e sugere automaticamente a regra violada (ex: Regra de conduta nº 14 - Desordem).
  * *Valor:* Reduz o tempo de digitação no celular durante as rondas, permitindo que o monitor mantenha a atenção no ambiente.

* **Modo Offline com Sincronização Posterior (Offline-First):**
  * *O que é:* Uso de Service Workers ou persistência temporária local (IndexedDB) para permitir que os monitores registrem ocorrências em áreas da escola sem cobertura de Wi-Fi ou sinal de rede celular.
  * *Valor:* Garante que nenhuma ocorrência seja perdida por falta de conectividade, sincronizando os dados automaticamente assim que o dispositivo recuperar o sinal.

---

### Pilar 2: Comunicação e Transparência (Foco nos Pais e Responsáveis)

A presença da família é um pilar essencial em escolas cívico-militaras. Atualmente, a comunicação com os pais está fora do escopo inicial, mas integrá-la de forma passiva ou ativa eleva drasticamente o valor social da aplicação.

* **Disparo Automatizado de Alertas via WhatsApp/SMS:**
  * *O que é:* Integração com APIs de mensageria (como Twilio ou Z-API) para enviar uma notificação instantânea aos pais quando uma ocorrência grave for registrada ou quando uma "Convocação de Pais" for gerada.
  * *Exemplo de mensagem:* *"Prezado responsável, informamos que uma ocorrência disciplinar foi registrada para o aluno [Nome] em [Data]. Solicitamos seu comparecimento à escola conforme convocação enviada. Acesse os detalhes em: [Link]"*
  * *Valor:* Reduz o tempo de secretaria ligando para os pais e aumenta o engajamento da família na correção do comportamento do aluno em tempo hábil.

* **Portal do Responsável (Acesso Simplificado via Link Mágico):**
  * *O que é:* Uma página externa e restrita onde os pais podem visualizar a ficha disciplinar do filho, o saldo de pontos de comportamento e assinar digitalmente termos de conduta ou convocações. Para evitar que os pais precisem criar senhas, o acesso pode ser feito via "Link Mágico" enviado por WhatsApp/E-mail.
  * *Valor:* Transparência absoluta. Os pais acompanham a evolução do aluno sem precisar ir fisicamente à escola apenas para consultar o histórico.

---

### Pilar 3: Inteligência de Dados e Prevenção (Foco na Direção e DRE)

A gestão escolar precisa de dados consolidados para agir preventivamente antes que pequenos problemas disciplinares se tornem evasão ou violência escolar.

* **Módulo de Alerta de Vulnerabilidade / Evasão Escolar:**
  * *O que é:* Um algoritmo simples (ou assistido por IA) que analisa a frequência de ocorrências negativas acumuladas de um aluno em um curto período (ex: 3 ocorrências na mesma semana) e gera um alerta de "Risco de Vulnerabilidade" para a equipe pedagógica.
  * *Valor:* Permite que a coordenação pedagógica intervenha preventivamente com psicólogos ou assistentes sociais antes que o aluno seja suspenso ou abandone a escola.

* **Mapa de Calor Disciplinar (Hotspots de Ocorrências):**
  * *O que é:* Um gráfico ou mapa visual no dashboard que correlaciona as ocorrências com variáveis como **Horário** (ex: troca de período, intervalo), **Local** (pátio, sala de aula, banheiros) e **Turma**.
  * *Valor:* Permite à direção realocar monitores de forma inteligente para os locais e horários mais críticos, otimizando o efetivo de ronda.

---

### Pilar 4: Valorização do Aluno (Foco no Corpo Discente e Pedagógico)

O sistema não deve ser visto apenas como um "punitivo", mas sim como uma ferramenta de desenvolvimento cidadão. Fortalecer o pilar de **Elogios** transforma a cultura escolar.

* **Painel de Destaques e Evolução Comportamental:**
  * *O que é:* Um ranking positivo (focado em evolução, não apenas em notas) que destaca os alunos que mais recuperaram pontos ou que receberam elogios por atitudes de liderança, empatia e organização.
  * *Valor:* Estimula a meritocracia positiva. Os alunos passam a ver o sistema como um meio de reconhecimento, e não apenas de punição, melhorando o clima organizacional da escola.

---

## 4. Matriz de Priorização (Esforço vs. Impacto)

Para ajudar na tomada de decisão de qual funcionalidade desenvolver a seguir, organizamos as sugestões em uma matriz baseada em **Impacto para o Usuário** e **Esforço de Implementação**:

| Funcionalidade | Impacto | Esforço | Classificação Estratégica |
| :--- | :--- | :--- | :--- |
| **Registro Rápido por Voz (Speech-to-Text)** | Alto | Baixo/Médio | **Quick Win** (Ganho Rápido) |
| **Alerta de Vulnerabilidade (IA/Regras)** | Alto | Baixo | **Quick Win** (Ganho Rápido) |
| **Disparo via WhatsApp (Mensageria)** | Altíssimo | Médio | **Alto Valor / Foco Principal** |
| **Mapa de Calor Disciplinar (Dashboard)** | Médio | Baixo/Médio | **Melhoria Incremental** |
| **Portal do Responsável (Link Mágico)** | Altíssimo | Alto | **Projeto Estratégico** |
| **Modo Offline (Offline-First)** | Médio | Alto | **Longo Prazo / Infraestrutura** |

---

## 5. Próximos Passos Sugeridos

Como a aplicação já está estruturada com Supabase e Next.js, recomendamos iniciar pelas funcionalidades de **baixo esforço e alto impacto**:

1. **Implementar o Alerta de Vulnerabilidade:** Pode ser feito diretamente no backend ou no contexto do React, monitorando quando um aluno ultrapassa um limite de ocorrências no mês e enviando um alerta visual para a coordenação.
2. **Integrar Speech-to-Text no Registro Disciplinar:** Utilizando a API nativa do navegador (`Web Speech API`) ou integrando com o próprio DeepSeek/Whisper via API para transcrição direta no celular dos monitores.
3. **Estruturar o Disparo de WhatsApp:** Iniciar com um fluxo simples de geração de link de WhatsApp (usando `wa.me` com mensagem pré-formatada) que o próprio monitor ou secretário clica para enviar, evoluindo posteriormente para uma API automatizada.
