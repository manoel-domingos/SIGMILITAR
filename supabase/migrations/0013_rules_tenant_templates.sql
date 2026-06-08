-- Isola regras disciplinares por tenant e mantém catálogo padrão para provisionamento.

begin;

alter table public.rules
  add column if not exists school_id text not null default 'joaobatista';

alter table public.rules
  alter column school_id set not null;

-- Ocorrências guardam school_id próprio; regra passa a ser identificada por (school_id, code).
alter table public.occurrences drop constraint if exists occurrences_rule_code_fkey;

-- Remove chave/unique global legado em code antes de permitir mesmo artigo por escola.
do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'rules'
      and c.contype in ('p', 'u')
      and (
        select array_agg(a.attname::text order by k.ord)
        from unnest(c.conkey) with ordinality as k(attnum, ord)
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
      ) = array['code']
  loop
    execute format('alter table public.rules drop constraint %I', constraint_record.conname);
  end loop;
end $$;

-- Deduplica pares legados, caso algum tenant já tenha recebido seed duplicado.
delete from public.rules r
using public.rules newer
where r.ctid < newer.ctid
  and r.school_id = newer.school_id
  and r.code = newer.code;

alter table public.rules drop constraint if exists rules_school_code_unique;

alter table public.rules
  add constraint rules_school_code_unique unique (school_id, code);

create index if not exists rules_school_id_code_idx
  on public.rules (school_id, code);

create table if not exists public.discipline_rule_templates (
  code integer primary key,
  description text not null,
  severity public.severity_level not null,
  points numeric not null,
  measure text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.discipline_rule_templates (code, description, severity, points, measure)
values
  (1, 'Apresentar-se com uniforme diferente do estabelecido: (Trajar-se, exibir-se)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (2, 'Apresentar-se com barba ou bigode sem fazer: (Cútis descuidada, rosto por fazer)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (3, 'Comparecer à EECM com cabelo em desalinho: (Despenteado, desarrumado)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (4, 'Chegar atrasado a EECM: (Retardar-se, demorar-se)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (5, 'Comparecer a EECM sem levar o material necessário: (Ausência, falta)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (6, 'Adentrar ou permanecer em dependência sem autorização: (Ingressar, ficar)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (7, 'Consumir alimentos ou mascar chicletes sem autorização: (Ingerir, mastigar)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (8, 'Conversar ou se mexer quando estiver em forma: (Dialogar, movimentar-se)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (9, 'Deixar de entregar objeto que não lhe pertença: (Omitir, abdicar)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (10, 'Deixar de retribuir cumprimentos ou sinais de respeito: (Ignorar, negligenciar)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (11, 'Deixar material em locais inapropriados: (Abandonar, esquecer)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (12, 'Descartar papéis ou restos de comida no chão: (Jogar, atirar)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (13, 'Dobrar peça de uniforme para desfigurar originalidade: (Pregar, vincar)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (14, 'Debruçar-se sobre a carteira e/ou dormir: (Apoiar-se, repousar)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (15, 'Executar movimentos de forma displicente: (Relapsa, desatenta)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (16, 'Fazer ou provocar excessivo barulho: (Ruído, algazarra)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (17, 'Não levar ao conhecimento irregularidade que presenciar: (Omitir, calar-se)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (18, 'Perturbar o estudo do colega: (Atrapalhar, incomodar)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (19, 'Utilizar publicação estranha à atividade escolar: (Empregar, manusear)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (20, 'Retardar ou contribuir para o atraso de atividade: (Dificultar, protelar)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (21, 'Sentar-se no chão, atentando contra a postura: (Acomodar-se, prostrar-se)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (22, 'Utilizar qualquer tipo de jogo ou brinquedo: (Brincar, manusear)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (23, 'Usar (aluna) piercing ou brinco fora do padrão: (Portar, ostentar)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (24, 'Usar (aluno) piercings ou brinco fora do padrão: (Portar, ostentar)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (25, 'Usar boné, capuz ou outros adornos: (Utilizar, vestir)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (26, 'Ficar na sala durante intervalos e formaturas: (Permanecer, deter-se)', 'Leve'::public.severity_level, -0.10, 'Advertência Oral'),
  (27, 'Atrasar ou deixar de atender ao chamado: (Demorar, ignorar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (28, 'Deixar de comparecer a atividade extraclasse: (Faltar, ausentar-se)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (29, 'Deixar de comparecer às atividades escolares: (Faltar, ausentar-se)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (30, 'Esquivar-se de medidas disciplinares: (Fugir, evitar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (31, 'Deixar de devolver documentos assinados no prazo: (Reter, atrasar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (32, 'Deixar de devolver livros ou materiais no prazo: (Reter, atrasar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (33, 'Deixar de entregar documento ao responsável: (Reter, omitir)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (34, 'Deixar de executar tarefas atribuídas: (Descumprir, negligenciar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (35, 'Deixar de zelar por sua apresentação pessoal: (Descuidar, desleixar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (36, 'Dirigir memoriais ou petições inadequadamente: (Encaminhar, enviar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (37, 'Entrar ou sair da EECM por locais não permitidos: (Acessar, evadir-se)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (38, 'Espalhar boatos ou notícias tendenciosas: (Difundir, boatar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (39, 'Tocar a sirene sem ordem: (Acionar, soar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (40, 'Fumar dentro ou nas imediações da EECM: (Pitar, tabagismo)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (41, 'Trocar de roupa (trajes civis) dentro da EECM: (Mudar, substituir)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (42, 'Ler ou distribuir publicações contra a disciplina: (Circular, disseminar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (43, 'Manter contato físico de cunho amoroso: (Namorar, cariciar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (44, 'Não zelar pelo nome da Instituição: (Desonrar, desprestigiar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (45, 'Negar-se a colaborar em eventos ou desfiles: (Recusar-se, abster-se)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (46, 'Ofender colegas por atos, gestos ou palavras: (Insultar, afrontar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (47, 'Portar-se de forma inconveniente em sala: (Comportar-se, agir)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (48, 'Portar-se de maneira desrespeitosa em eventos: (Comportar-se, agir)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (49, 'Proferir palavras de baixo calão: (Xingar, blasfemar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (50, 'Propor ou aceitar transação pecuniária: (Negociar, comercializar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (51, 'Provocar ou disseminar a discórdia: (Instigar, semear)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (52, 'Publicar mensagens ou fotos que exponham outrem: (Postar, divulgar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (53, 'Retirar objeto sem ordem do responsável: (Remover, subtrair)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (54, 'Sair de forma sem autorização: (Retirar-se, ausentar-se)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (55, 'Sair, entrar ou permanecer na sala sem permissão: (Circular, ficar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (56, 'Ser retirado por mau comportamento: (Expulso, removido)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (57, 'Simular doenças para esquivar-se de obrigações: (Fingir, aparentar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (58, 'Tomar parte em jogos de azar ou apostas: (Participar, jogar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (59, 'Usar instalações esportivas sem autorização: (Utilizar, aproveitar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (60, 'Usar o uniforme em ambiente inapropriado: (Trajar, vestir)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (61, 'Utilizar celulares durante as atividades: (Manusear, operar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (62, 'Usar indevidamente distintivos ou insígnias: (Ostentar, portar)', 'Media'::public.severity_level, -0.30, 'Advertência Escrita'),
  (63, 'Assinar pelo responsável: (Falsificar, forjar)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (64, 'Causar danos ao patrimônio: (Depredar, avariar)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (65, 'Causar ou contribuir para acidentes: (Provocar, gerar)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (66, 'Comunicar-se ou usar meio não permitido em provas: (Colar, fraudar)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (67, 'Denegrir o nome da EECM: (Difamar, manchar)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (68, 'Desrespeitar, desobedecer ou desafiar autoridade: (Afrontar, insubordinar-se)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (69, 'Divulgar matéria de apologia às drogas ou violência: (Propagar, promover)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (70, 'Entrar ou ausentar-se da unidade sem autorização: (Acessar, evadir-se)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (71, 'Extraviar documentos sob sua responsabilidade: (Perder, sumir)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (72, 'Faltar com a verdade ou usar anonimato: (Mentir, ludibriar)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (73, 'Fazer uso ou portar bebidas e entorpecentes: (Consumir, ingerir)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (74, 'Hastear ou arriar bandeiras sem autorização: (Içar, baixar)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (75, 'Instigar colegas a cometer faltas: (Incite, induzir)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (76, 'Contato físico com denotação libidinosa: (Lascivo, erótico)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (77, 'Obter publicação difamatória contra membros: (Conseguir, produzir)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (78, 'Ofender com a prática de Bullying: (Assediar, acossar)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (79, 'Pichar ou causar poluição visual/sonora: (Grafitar, sujar)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (80, 'Portar objetos que ameacem a segurança: (Carregar, deter)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (81, 'Praticar atos contrários aos símbolos nacionais: (Desrespeitar, ultrajar)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (82, 'Promover ou tomar parte em manifestação coletiva: (Organizar, integrar)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (83, 'Promover trotes de qualquer natureza: (Realizar, praticar)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (84, 'Promover, incitar ou envolver-se em rixa: (Brigar, lutar)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (85, 'Tomar parte em manifestações políticas: (Participar, envolver-se)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (86, 'Rasurar, violar ou alterar documentos: (Adulterar, modificar)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (87, 'Representar a EECM sem estar autorizado: (Personificar, atuar)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (88, 'Ter em seu poder publicações contra a moral: (Possuir, deter)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (89, 'Utilizar ou subtrair objetos alheios: (Furtar, apossar-se)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (90, 'Utilizar processos fraudulentos em trabalhos: (Trapacear, burlar)', 'Grave'::public.severity_level, -0.50, 'Suspensão'),
  (91, 'Causar destruição do patrimônio da EECM: (Arruinar, depredar)', 'Grave'::public.severity_level, -0.50, 'Suspensão')
on conflict (code) do update set
  description = excluded.description,
  severity = excluded.severity,
  points = excluded.points,
  measure = excluded.measure,
  updated_at = now();

create or replace function public.backfill_default_rules_for_school(target_school_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  if target_school_id is null or btrim(target_school_id) = '' or target_school_id = 'DRE' then
    return 0;
  end if;

  insert into public.rules (school_id, code, description, severity, points, measure)
  select target_school_id, t.code, t.description, t.severity, t.points, t.measure
  from public.discipline_rule_templates t
  on conflict (school_id, code) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

-- Backfill: toda escola já existente recebe cópia própria das regras/medidas padrão ausentes.
do $$
declare
  school_record record;
begin
  if to_regclass('public.schools') is not null then
    for school_record in execute 'select id from public.schools where id is not null and id <> ''DRE'''
    loop
      perform public.backfill_default_rules_for_school(school_record.id);
    end loop;
  end if;
end $$;

grant select on public.discipline_rule_templates to authenticated, service_role;
grant execute on function public.backfill_default_rules_for_school(text) to authenticated, service_role;

commit;
