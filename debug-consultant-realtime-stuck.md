[OPEN] consultant-realtime-stuck

## Sintoma
- O consultor so visualiza o pedido depois de atualizar a pagina.
- Nao toca som, nao sobe toast e nao aparece notificacao em tempo real.
- O push-subscriptions retorna 500, mas isso parece ser um problema paralelo.

## Hipoteses
1. As tabelas `public.notified_orders` e `public.my_orders` nao estao publicadas em `supabase_realtime`.
2. O consultor logado esta ouvindo um `consultant_id` diferente do `consultant_id` gravado no envio.
3. O bundle publicado na Netlify ainda nao contem todas as correcoes mais recentes.
4. O canal realtime conecta, mas o frontend perde a inscricao antes do evento chegar.

## Evidencias Coletadas
- Nao existe migracao no repositorio adicionando `notified_orders` ou `my_orders` ao `supabase_realtime`.
- O sintoma observado e compativel com insert persistido em banco e ausencia de evento websocket.
- O screenshot do navegador mostra erro 500 em `push-subscriptions`, mas esse erro nao explica sozinho a ausencia de atualizacao em tempo real da lista.

## Proximo Passo
- Publicar explicitamente `public.notified_orders` e `public.my_orders` no `supabase_realtime`.
- Publicar nova build do frontend com as correcoes pendentes de debug gating.
