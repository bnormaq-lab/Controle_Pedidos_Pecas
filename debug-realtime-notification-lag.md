# Debug Session: realtime-notification-lag
- **Status**: OPEN
- **Issue**: notificações de pedidos não chegam em tempo real no painel do consultor; o ícone só atualiza após sair e entrar novamente.
- **Debug Server**: http://127.0.0.1:7777/event
- **Log File**: .dbg/trae-debug-log-realtime-notification-lag.ndjson

## Reproduction Steps
1. Entrar no painel com um consultor.
2. Enviar um pedido para esse consultor em `Chegada de Peças` ou `Pedidos`.
3. Verificar se o sino, a aba `Seu Pedido Aqui` e o toast atualizam em tempo real.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | O canal realtime não atinge status `SUBSCRIBED` para o consultor. | High | Low | Pending |
| B | O evento chega no canal, mas é descartado por filtro/chave local. | High | Low | Pending |
| C | O evento chega, mas as queries e o contador não são recarregados como esperado. | Medium | Low | Pending |
| D | O usuário em contexto e a sessão auth real do Supabase divergem até o relogin. | High | Low | Pending |
| E | O insert em `notified_orders`/`my_orders` está ok no envio, mas o receptor não vê o evento em tempo real. | Medium | Low | Pending |

## Log Evidence
- Confirmado anteriormente: `Header.tsx` registrou `Auth session missing!` com `currentUser` presente na interface.
- Confirmado após correção local: `authUserId` passou a bater com `contextUserId`.
- Confirmado no envio: `ArrivalTab.tsx` registrou `arrival notified_orders insert succeeded` e `arrival my_orders sync succeeded`.
- Confirmado o desvio do sino: o contador estava baseado em `notified_orders`, enquanto a aba `Seu Pedido Aqui` mostra `my_orders`; isso explica `2 no sino` e `1` item na lista para reenvios do mesmo pedido.

## Working Conclusion
- Correção local aplicada para sincronizar a sessão real do Supabase no `AuthContext`.
- Correção local aplicada para alinhar o contador do sino com `my_orders`.
- O teste do usuário foi realizado na URL publicada da Netlify; enquanto o frontend publicado não receber essas mudanças, o comportamento em produção pode continuar divergente do código local.
