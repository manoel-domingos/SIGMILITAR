# Estrutura Arquitetural, Fluxos de Telas e Modelo de Precificação

Para transformar a aplicação em uma plataforma SaaS de alta robustez, confiabilidade e escalabilidade, é necessário estabelecer uma arquitetura corporativa que suporte múltiplos inquilinos (**multi-tenancy**) em vários níveis hierárquicos. O sistema deve atender com precisão e agilidade tanto às Diretorias Regionais de Ensino (DREs) quanto às escolas individuais, garantindo isolamento completo de dados e alta performance de atualização de interface para cada perfil de usuário.

---

## 1. Estratégia de Arquitetura Multi-Tenant e RBAC

A base para a robustez do sistema reside no isolamento lógico de dados no banco de dados e no controle de acesso baseado em perfis (Role-Based Access Control - RBAC). 

### Modelagem Hierárquica de Tenancy
Para suportar múltiplos estados, regiões e escolas, a modelagem de banco de dados no Supabase deve seguir uma estrutura de árvore lógica:
* **Tenant Master (Global):** Administra toda a infraestrutura, faturamento e provisionamento.
* **Tenant DRE (Diretoria Regional de Ensino):** Agrupa e supervisiona um conjunto geográfico de escolas. Uma DRE tem acesso de leitura e relatórios consolidados de todas as escolas sob sua jurisdição.
* **Tenant Escola:** Representa a unidade operacional básica. Os dados de alunos, ocorrências, elogios e regras pertencem a este nível.

A coluna `school_id` e a coluna `dre_id` devem ser adicionadas a todas as tabelas operacionais. O isolamento físico e lógico é garantido por meio de políticas de segurança no nível de linha (Row-Level Security - RLS) do PostgreSQL no Supabase, impedindo que uma escola acesse dados de outra.

### Perfis de Usuário e Permissões (RBAC)
O controle de acesso é mapeado conforme a tabela de permissões abaixo:

| Perfil | Escopo de Acesso | Permissões Principais |
| :--- | :--- | :--- |
| **Admin Global (Master)** | Toda a rede (Todas as DREs e Escolas) | Gestão de DREs, provisionamento de novas escolas, auditoria global do sistema e configurações de faturamento. |
| **Gestor DRE** | Todas as escolas sob sua DRE | Visualização de dashboards analíticos consolidados, comparação de índices disciplinares e auditoria de ações regionais. |
| **Gestor Escolar (Diretor)** | Apenas a sua própria escola | Gestão de usuários locais (monitores/professores), fechamento de ano, configuração de turmas e relatórios da unidade. |
| **Coordenador Pedagógico** | Apenas a sua própria escola | Cadastro de alunos, termos de conduta, convocação de pais e análise de vulnerabilidade. |
| **Monitor Disciplinar** | Apenas a sua própria escola | Registro de ocorrências em campo, controle de rondas (módulo Xerife) e registro de acidentes. |
| **Professor** | Apenas as suas turmas na escola | Consulta à lista de alunos e registro de ocorrências de sala de aula. |

---

## 2. Fluxo de Telas e Interface Master

Para garantir agilidade e precisão na atualização de telas para cada tipo de usuário, a interface deve ser dinâmica e renderizada com base nas claims do token JWT do usuário autenticado.

### Fluxo de Login e Cadastro
1. **Identificação do Tenant por Domínio (Runtime):** O sistema detecta o contexto do usuário antes mesmo do login através do subdomínio acessado (ex: `dre-sul.sigmilitar.com.br` ou `joaobatista.sigmilitar.com.br`) [1].
2. **Tela de Login Unificada:** O usuário insere suas credenciais. O backend autentica via Supabase Auth e retorna os metadados do perfil (`role`, `school_id`, `dre_id`).
3. **Carregamento de Perfil Dinâmico:** O cliente Next.js lê o perfil e redireciona o usuário para o seu dashboard correspondente de forma instantânea.
4. **Cadastro de Escolas e DREs:** O cadastro de novos usuários operacionais é restrito e controlado pelos gestores escolares ou administradores globais para manter a segurança do sistema.

### Tela Master de Administração (Admin Global)
Esta tela é o painel de controle de todo o SaaS. Ela deve conter três módulos principais:
* **Painel de Provisionamento:** Permite criar uma nova DRE ou uma nova escola em segundos, gerando automaticamente o subdomínio e aplicando as configurações padrão do sistema.
* **Módulo de Faturamento e Licenciamento:** Controle de assinaturas ativas, bloqueio automático de escolas inadimplentes e relatórios de receita recorrente (MRR).
* **Painel de Controle de Versão e Implantação:** Permite enviar atualizações de código ou novas regras disciplinares para todas as escolas simultaneamente, garantindo agilidade no desenvolvimento.

---

## 3. Padrões de Desenvolvimento para Qualidade e Agilidade

Para manter a aplicação rápida e livre de bugs à medida que escala, o time de desenvolvimento deve seguir padrões rígidos de arquitetura de software:

### Isolamento de Acesso a Dados (Repository Pattern)
Nenhum componente React deve realizar chamadas diretas ao banco de dados Supabase sem passar por um repositório escopo pelo tenant do usuário [1]. Isso impede vazamento de dados entre escolas por erro de programação.
```typescript
class EscolaRepository {
  constructor(private schoolId: string) {}

  async obterAlunos() {
    return supabase
      .from('students')
      .select('*')
      .eq('school_id', this.schoolId);
  }
}
```

### Otimização de Interface (State Management & Caching)
* **React Context & SWR/React Query:** Utilizar bibliotecas de busca de dados com cache inteligente para evitar requisições repetidas ao Supabase, garantindo que a interface atualize instantaneamente ao alternar entre telas.
* **Optimistic Updates:** Ao registrar uma ocorrência ou elogio, a interface deve refletir a alteração imediatamente no cliente antes mesmo de receber a confirmação do banco de dados, aumentando a percepção de agilidade do usuário.

---

## 4. Modelo de Precificação Estratégico (Pricing)

O modelo de preços para softwares de gestão escolar de grande escala deve ser simples de entender, previsível para as secretarias de educação e escalável conforme o uso do sistema [2].

### Estratégia de Cobrança: Modelo por Aluno Ativo (Per-Student)
A estratégia mais justa e amplamente adotada no mercado de tecnologia educacional é a cobrança baseada no número de alunos ativos matriculados na escola [2]. Isso permite que escolas menores paguem valores acessíveis, enquanto grandes colégios financiam a infraestrutura necessária para seu volume de dados.

### Sugestão de Tabela de Preços (Valores em Reais)

| Faixa de Alunos | Valor Mensal | Valor Anual (Faturamento Único) | Custo Equivalente por Aluno/Ano |
| :--- | :--- | :--- | :--- |
| **Até 100 alunos** | R$ 149,00 | R$ 1.490,00 | R$ 14,90 / aluno |
| **101 a 250 alunos** | R$ 299,00 | R$ 2.990,00 | R$ 11,96 / aluno |
| **251 a 500 alunos** | R$ 499,00 | R$ 4.990,00 | R$ 9,98 / aluno |
| **501 a 1.000 alunos** | R$ 799,00 | R$ 7.990,00 | R$ 7,99 / aluno |
| **Acima de 1.000 alunos** | Sob Consulta | Contrato Customizado | Negociação de Volume |

### Benefícios Comerciais Inclusos
* **Sem Taxa de Setup:** Facilita a entrada de novas escolas na plataforma [2].
* **Desconto de 16% no Plano Anual:** Incentiva o pagamento antecipado, melhorando o fluxo de caixa do SaaS [2].
* **Acesso Ilimitado de Usuários:** Monitores, professores, diretores e pais não pagam licenças individuais, estimulando o uso coletivo do sistema.
* **Acesso Gratuito para a DRE:** A Diretoria Regional de Ensino não paga pelo painel de controle regional, pois o custo já está embutido nas licenças das escolas individuais, facilitando a venda governamental ou em lote.

---

## References
[1] [The developer’s guide to SaaS multi-tenant architecture](https://workos.com/blog/developers-guide-saas-multi-tenant-architecture)  
[2] [The Ultimate Guide to School Management Software Pricing Models](https://blog.thinkwave.com/blog/the-ultimate-guide-to-school-management-software-pricing-models/)
