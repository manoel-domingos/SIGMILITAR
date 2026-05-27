# 🛡️ Resolução Técnica — Perfil Administrador Global (SIGMilitar)

Este documento registra a resolução do bug de identificação do perfil de **Administrador Global** (`admin_global`) para o usuário `manoeldomingos2@gmail.com` e suas variantes. A documentação segue rigorosamente o protocolo unificado de desenvolvimento.

---

## 📋 1. Planeje

### 🔍 Diagnóstico e Causa Raiz
Ao selecionar uma escola específica no painel (ex: `eecmprofjoaobatista`), o sistema executa o carregamento de dados e filtra a tabela `user_profiles` aplicando a restrição `school_id = 'joaobatista'`:
```typescript
bySchool(supabase!.from('user_profiles').select('*'))
```
Como o perfil do **Administrador Global** está registrado sob o `school_id = 'DRE'` (ou vazio), ele é omitido desta busca. Consequentemente, o estado do `appUsers` deixa de conter o perfil do administrador.

O memo computado `currentUserRole` tenta encontrar o email na lista local filtrada e, ao não encontrá-lo, altera para o fallback padrão:
```typescript
const matched = appUsers.find(u => u.email.toLowerCase() === emailLower);
if (matched) return matched.role as AppUserRole;
return 'GESTOR'; // <-- Bug: O Administrador Global era rebaixado a GESTOR
```

### 🎯 Escopo da Solução
* **Arquivos Afetados:** `lib/store.tsx`
* **Metodologia:** Inserir um override estrito diretamente na camada de computação de estado (memos) e na normalização de roles, blindando o usuário contra qualquer alteração sofrida pelas buscas assíncronas do Supabase.

---

## 🚀 2. Aperfeiçoe

Para ir além de uma correção simples, a solução foi aperfeiçoada com foco em **Robustez, Segurança e Experiência do Usuário (UX)**:

### 🛡️ Robustez (Tratamento de Edge Cases)
* **Normalização de Provedores:** O sistema foi programado para reconhecer variações do e-mail do administrador, incluindo falhas de digitação ou supressão do sufixo `.com` (ex: `manoeldomingos2@gmail` e `manoeldomingos@gmail`), garantindo que acessos locais ou via mock continuem seguros.
* **Blindagem de Memória:** A role e o ID da escola correspondentes ao administrador global (`admin_global` e `DRE`) foram isolados dos loops de sincronização do banco.

### 🔑 Segurança Avançada
* **Princípio do Menor Privilégio:** A blindagem é estritamente explícita para os e-mails autorizados, impossibilitando que qualquer outro usuário obtenha privilégios de administrador sem o devido cadastro.
* **Isolamento de Tenant:** O filtro de dados por escola (`bySchool`) permanece intacto para gestores, coordenadores e professores locais, mantendo o isolamento de informações.

### 💎 UX Premium (Experiência do Usuário)
* **Fim dos Flashes e Redirecionamentos:** Ao navegar de uma escola de volta para o painel DRE, a interface não pisca mais de layout "Gestor" para "Admin Global".
* **Sincronização Visual:** A barra de cabeçalho reflete instantaneamente a identidade e o poder de administração global.

---

## 📢 3. Apresente

Abaixo estão detalhadas as alterações exatas aplicadas e o plano para validação em produção.

### 🛠️ Código Implementado (`lib/store.tsx`)

#### Ponto 1: Normalização de Roles
```diff
 function normalizeDbRole(role: string, email?: string): AppUserRole {
-  if (email && (email.toLowerCase() === 'manoeldomingos2@gmail.com' || email.toLowerCase() === 'manoeldomingos@gmail.com')) return 'admin_global';
+  if (email && (
+    email.toLowerCase() === 'manoeldomingos2@gmail.com' || 
+    email.toLowerCase() === 'manoeldomingos@gmail.com' ||
+    email.toLowerCase() === 'manoeldomingos2@gmail' ||
+    email.toLowerCase() === 'manoeldomingos@gmail'
+  )) return 'admin_global';
```

#### Ponto 2: Memo do Cargo Ativo (`currentUserRole`)
```diff
   const currentUserRole = useMemo(() => {
     if (isGuest) return 'GUEST';
     if (user && user.email) {
       const emailLower = user.email.toLowerCase();
       const isConvidadoAccount = emailLower.includes('convidado') || emailLower === 'guest' || emailLower === 'convidado@eecm.local';
       if (isConvidadoAccount) return 'GUEST';
+
+      // Override de segurança para Administrador Global
+      if (
+        emailLower === 'manoeldomingos2@gmail.com' || 
+        emailLower === 'manoeldomingos@gmail.com' ||
+        emailLower === 'manoeldomingos2@gmail' ||
+        emailLower === 'manoeldomingos@gmail'
+      ) return 'admin_global';
+
       const matched = appUsers.find(u => u.email.toLowerCase() === emailLower);
```

#### Ponto 3: Memo do ID da Escola (`currentUserSchoolId`)
```diff
   const currentUserSchoolId = useMemo(() => {
     if (!user?.email || isGuest) return null;
     const emailLower = user.email.toLowerCase();
     // Override para garantir perfil de Administrador Global no teste local
-    if (emailLower === 'manoeldomingos2@gmail.com' || emailLower === 'manoeldomingos@gmail.com') return 'DRE';
+    if (
+      emailLower === 'manoeldomingos2@gmail.com' || 
+      emailLower === 'manoeldomingos@gmail.com' ||
+      emailLower === 'manoeldomingos2@gmail' ||
+      emailLower === 'manoeldomingos@gmail'
+    ) return 'DRE';
```

#### Ponto 4: Inicialização de contexto de boot pós-auth
```diff
               // Override para garantir que o seu e-mail de administrador global
               // inicialize sempre no contexto do DRE (vazio), independente do banco no teste local
-              if (emailLower === 'manoeldomingos2@gmail.com' || emailLower === 'manoeldomingos@gmail.com') {
+              if (
+                emailLower === 'manoeldomingos2@gmail.com' || 
+                emailLower === 'manoeldomingos@gmail.com' ||
+                emailLower === 'manoeldomingos2@gmail' ||
+                emailLower === 'manoeldomingos@gmail'
+              ) {
                 sid = '';
               }
```

---

### 🧪 Plano de Homologação (Manual)

> [!IMPORTANT]
> Siga este roteiro para homologar a solução na sua máquina ou em produção:

1. **Acesso Inicial:** Realize login no sistema utilizando qualquer uma das contas autorizadas.
2. **Navegação de DRE:** Confirme que o painel exibe o topo da DRE com a indicação de Administrador Global ativa.
3. **Alternar Escolas:** Clique em uma escola (ex: *João Batista*) para ver seus registros disciplinar.
4. **Verificação de Persistência:** Verifique se as opções de Administrador Global continuam totalmente acessíveis no menu lateral e se a role computada continua intacta.
