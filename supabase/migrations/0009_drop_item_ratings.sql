-- Remove a tabela dos ratings do Duelo. O Duelo foi substituído pelo AHP
-- (#0551), por decisão do agente Financeiro em 17/11/2026; os ratings Glicko-2
-- não têm conversão para os julgamentos do AHP, então não há o que migrar.
--
-- Só o schema `wishlist`: o `public.item_ratings` da migration 0004 vivia no
-- antigo projeto próprio da wishlist; no projeto compartilhado o `public` é
-- do app-produtividade e não é mexido aqui.
drop table if exists wishlist.item_ratings;
