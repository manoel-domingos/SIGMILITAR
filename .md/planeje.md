# 📋 Planejamento Técnico — Integração de Atas com a ARI

Este documento detalha o plano para reorganizar os botões auxiliares de escrita da ATA na criação de ocorrências e integrar o botão "Sugestão do Regimento" para acionar automaticamente a abertura da **ARI** e gerar respostas contextuais com base nas diretrizes cívico-militares.

---

## 📋 1. Planeje

### 🔍 Diagnóstico e Causa Raiz
Atualmente, as sugestões baseadas no regimento disciplinar de infrações escolares são geradas e renderizadas em um pequeno card de visualização inline dentro do próprio formulário da ocorrência:
```typescript
{showSuggestions && (
  <div className="mt-2 rounded-xl border border-violet-200 bg-violet-50 ...">
    {suggestions}
  </div>
)}
```
Essa interface inline sobrecarrega o formulário principal e reduz a usabilidade do painel. A melhor abordagem em termos de UX é direcionar essa consulta complexa para a **ARI** (Assistente Regimental Inteligente) na barra lateral, permitindo que o gestor interaja e tire dúvidas adicionais sobre a recomendação.

### 🎯 Objetivos de Implementação
1. **Reorganização de Botões da ATA:**
   * **Gerar Ata Automática** (Mantido como principal gerador estrutural de relatos).
   * **Aprimorar com IA** (Substituto refinado de "Melhorar com IA").
   * **Sugestão do Regimento** (Substituto de "Sugestões do Regimento").
2. **Integração ARI (Event-Driven):**
   * Configurar o botão "Sugestão do Regimento" para disparar um evento customizado no navegador (`trigger-ari`).
   * O componente da `AIAssistant.tsx` escutará esse evento, abrirá a barra lateral se estiver fechada, selecionará a aba de "Chat" e disparará a pergunta rica à inteligência artificial em tempo real.
   * Remover a caixa colapsável inline obsoleta para limpar o layout do formulário.

### 🎯 Arquivos para Alteração
* [page.tsx](file:///c:/Users/USER-PC/Documents/eecmprofjoaobatista/app/[escola]/registro-disciplinar/page.tsx) — Ajustes dos botões, remoção do card inline e envio de prompt customizado.

---

## 🚀 2. Aperfeiçoe

Vamos refinar a integração para criar uma experiência **Premium** e **Segura**:

### 💎 UX de Alta Fidelidade
* **Transição Fluida:** Ao clicar em "Sugestão do Regimento", a ARI se abrirá suavemente pelo canto direito com o chat selecionado. O usuário verá a sua solicitação ser enviada automaticamente e a resposta da IA começar a ser gerada via streaming na própria barra lateral.
* **Prompt Enriquecido:** O prompt que enviamos à ARI será extremamente detalhado, contendo:
  * Nome do aluno e turma.
  * Artigo disciplinar violado e descrição da infração.
  * Gravidade/Natureza da ocorrência.
  * Status de reincidência do aluno calculado dinamicamente em tempo real.
  * Medidas administrativas padrão recomendadas.

### 🔒 Segurança e Privacidade de Dados
* Os dados pessoais de outros alunos ou de outras escolas não serão trafegados, mantendo o isolamento de tenants e respeitando os privilégios de acesso do gestor.

---

## 📢 3. Apresente

Abaixo estão detalhados os blocos de código que serão aplicados.

### 🛠️ Código Proposto para `app/[escola]/registro-disciplinar/page.tsx`

#### Alteração 1: Redefinição do `handleGetSuggestions`
Substituímos o fetch assíncrono interno pelo envio de evento DOM direto para a ARI:
```typescript
  const handleGetSuggestions = () => {
    if (!selectedRules.length || !selectedStudents.length) return;

    const student = students.find(s => s.id === selectedStudents[0]);
    const rule = rules.find(ru => ru.code === parseInt(selectedRules[0], 10));
    const escalation = getEscalationStatus(selectedStudents[0], parseInt(selectedRules[0], 10), editingOccurrence ?? undefined);

    const reincidenciaStr = escalation.isEscalated
      ? `Sim (já possui infração anterior da mesma natureza: ${escalation.reason})`
      : 'Não';

    const promptText = `Olá ARI! Preciso de uma **Sugestão do Regimento** para esta ocorrência na escola ${schoolName}:
- **Aluno**: ${student?.name || 'Não informado'} (Turma: ${student?.class || 'N/A'})
- **Infração**: Art. ${rule?.code} — ${rule?.description}
- **Natureza/Gravidade**: ${rule?.severity}
- **Reincidente nesta infração?**: ${reincidenciaStr}
- **Medida recomendada padrão**: ${escalation.measure}

Com base no Manual de Conduta e Regimento Interno das Escolas Cívico-Militares brasileiras, sugira de forma direta e em tópicos estruturados quais os procedimentos administrativos e medidas que o gestor deve adotar passo a passo (atenuantes, agravantes e encaminhamentos).`;

    const event = new CustomEvent('trigger-ari', {
      detail: { text: promptText }
    });
    window.dispatchEvent(event);
  };
```

#### Alteração 2: Renomeação e Layout dos Botões de ATA
Substituímos a barra de ferramentas das atas para seguir os novos nomes de forma limpa:
```tsx
                      <button
                        type="button"
                        onClick={handleImproveObservations}
                        disabled={isImproving || (!observations.trim() && selectedRules.length === 0)}
                        className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-all disabled:opacity-50"
                      >
                        <Sparkles size={10} className={isImproving ? "animate-spin" : ""} />
                        {isImproving ? "Aprimorando..." : "Aprimorar com IA"}
                      </button>
                      <button
                        type="button"
                        onClick={handleGetSuggestions}
                        disabled={!selectedRules.length || !selectedStudents.length}
                        className="flex items-center gap-1 text-[10px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full hover:bg-violet-100 transition-all disabled:opacity-50 border border-violet-200"
                      >
                        <Sparkles size={10} />
                        Sugestão do Regimento
                      </button>
```

#### Alteração 3: Remoção do Card de Sugestões Inline Obsoleto
O bloco `{showSuggestions && ( ... )}` será completamente removido do DOM para simplificar a criação de ocorrências.

---

### 🧪 Plano de Homologação (Manual)

1. **Seleção de Aluno e Artigo:** Abra a tela de "Nova Ocorrência", selecione um aluno e uma infração.
2. **Teste "Aprimorar com IA":** Digite um relato simples na ATA e clique em "Aprimorar com IA" para verificar se a formatação está correta.
3. **Acionar a ARI:** Clique em **"Sugestão do Regimento"**.
4. **Verificação Visual:** Confirme se a barra lateral da ARI se abre instantaneamente com o chat ativo e inicia a resposta do Gemini em tempo real, fornecendo o roteiro militar/disciplinar para a infração.
