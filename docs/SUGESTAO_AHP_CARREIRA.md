# Sugestão de pesos AHP a partir dos objetivos de carreira

O assistente **Decidir (AHP)** pode oferecer uma sugestão de pesos para os
critérios, gerada fora do app por um agente (projeto "Carreira" ou
Refinamento) a partir dos objetivos de carreira de Kiê. O app não lê o vault
de carreira — ele é privado e fica em outro repositório. O agente lê o vault,
resume tudo em **pesos + uma linha de justificativa por critério** e grava
isso no Supabase. O app só mostra a sugestão.

## Como aparece no app

- Tabela `wishlist.ahp_weight_suggestions` (migration
  `supabase/migrations/0007_create_ahp_weight_suggestions.sql`). O app lê a
  linha mais recente da pessoa logada (`src/ahpSuggestionRepository.ts`).
- Nos passos **Critérios** e **Peso dos critérios** do AhpModal aparece um
  cartão com os pesos, as justificativas, a origem e a data, e com os botões
  **Aplicar sugestão** e **Ignorar**. Nada é aplicado sem clique. O cartão
  avisa antes quando a aplicação vai substituir pesos já definidos, acrescentar
  critérios ou dar peso intermediário a um critério que a sugestão não cobre.
- **Aplicar** converte os pesos numa matriz par-a-par consistente
  (`a_ij = w_i / w_j`, limitada à escala de Saaty [1/9, 9], ver
  `src/lib/ahpSuggestion.ts`) e grava essa matriz como os julgamentos entre
  critérios, no mesmo formato dos sliders. As avaliações dos itens ficam como
  estão. A lista passa a ordenar por **Ranking AHP**, que é recalculado com a
  síntese de sempre (`computeAhp`). Logo depois de aplicar, o botão
  **Desfazer** devolve o estado anterior.
- **Ignorar** guarda o id da sugestão em `localStorage` (`suggestionHandled`
  em `wishlist.ahp.v1`). Uma sugestão nova (outro id) volta a aparecer. Como
  essa marca fica no `localStorage`, ela vale por aparelho.
- Sem Supabase (modo local), ou sem a migration aplicada, nada muda.

## Como o agente gera a sugestão

1. **Ler os objetivos de carreira** no vault privado: plano de carreira,
   roadmap e MOC da pasta do plano. Considerar só a frente ativa, as frentes
   secundárias e os valores declarados. Não usar finanças, saúde, documentos
   nem dados de terceiros.
2. **Mapear para os critérios do AHP.** Os padrões do app são `Preço`,
   `Utilidade` e `Desejo`. Use esses nomes exatamente (o app compara sem
   acento nem caixa). Pode propor **um** critério novo quando os objetivos não
   cabem nos existentes, por exemplo `Alinhamento com a carreira`. O app
   acrescenta esse critério e Kiê avalia os itens nele. Use no máximo 8
   critérios no total e no máximo 30 caracteres por nome.
3. **Atribuir pesos** (> 0; o app normaliza). Prefira razões de no máximo 9:1
   entre o maior e o menor peso. Acima disso o app corta a razão e a matriz
   perde um pouco de consistência.
4. **Escrever uma justificativa por critério**, em uma linha (≤ 200
   caracteres), em termos gerais ("serve à frente principal", "resolve
   problema do dia a dia"). Nunca escrever valores, salários, dívidas, nomes de
   empresas ou pessoas, nem dados de saúde.
5. **Gravar** com a chave de serviço (SQL editor ou MCP `execute_sql`). Isso
   só pode ser feito com o OK de Kiê, porque o banco é de produção:

```sql
insert into wishlist.ahp_weight_suggestions (user_id, source, criteria)
values (
  (select distinct user_id from wishlist.items limit 1), -- app de uma pessoa só
  'objetivos de carreira',
  '[
    {"name": "Utilidade", "weight": 0.30, "justification": "..."},
    {"name": "Preço", "weight": 0.20, "justification": "..."}
  ]'::jsonb
);
```

Para conferir, rode
`select id, generated_at, criteria from wishlist.ahp_weight_suggestions order by generated_at desc limit 1;`.

Não apague as sugestões antigas: elas ficam como histórico, e o app lê só a
mais recente. Para retirar uma sugestão do app, apague essa linha. A próxima
mais antiga passa a valer.

## Quando regenerar

Regenere quando o plano ou o roadmap de carreira mudar de prioridade (por
exemplo, ao mudar a frente principal) ou na revisão trimestral do roadmap.
Grave uma linha nova a cada vez em vez de editar a anterior: o id novo faz o
cartão reaparecer.
