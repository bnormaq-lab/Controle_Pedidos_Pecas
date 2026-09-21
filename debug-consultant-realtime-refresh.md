# Debug Session: consultant-realtime-refresh
- **Status**: [OPEN]
- **Issue**: O consultor so visualiza a notificacao/pedido novo apos atualizar a pagina, em vez de receber a atualizacao em tempo real.
- **Debug Server**: http://127.0.0.1:7777/event
- **Log File**: .dbg/trae-debug-log-consultant-realtime-refresh.ndjson

## Reproduction Steps
1. Logar com um usuario consultor.
2. Manter a aba aberta sem atualizar.
3. Enviar uma notificacao/pedido para esse consultor a partir do fluxo administrativo.
4. Verificar se o card/toast/lista atualiza sem F5.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | O canal realtime do consultor nao chega em `SUBSCRIBED` e o listener nao recebe eventos. | High | Low | Rejected |
| B | A sessao real do Supabase nao esta ativa no cliente do consultor durante a escuta do realtime. | High | Low | Rejected |
| C | O evento eh gravado, mas em tabela/filtro diferente do que a tela do consultor observa. | Medium | Low | Confirmed |
| D | O canal realtime esta sendo recriado por re-render do `Header`, abrindo janelas em que o evento pode ser perdido. | Medium | Medium | Confirmed |
| E | A versao publicada em producao nao contem o bundle mais novo com as correcoes de realtime. | Medium | Low | Rejected |

## Log Evidence
- `Header.tsx`: `authUserId` e `contextUserId` ficaram iguais a `20d602bd-4d3d-4026-b518-3461cbc03ce5`, sem erro de auth.
- `Header.tsx`: o canal entrou em `SUBSCRIBED` para `consultantId=20d602bd-4d3d-4026-b518-3461cbc03ce5`.
- `Header.tsx`: houve ciclos repetidos de `SUBSCRIBED -> CLOSED -> SUBSCRIBED`, indicando recriacao do listener durante o uso.
- `ArrivalTab.tsx`: o envio gravou `notified_orders` e `my_orders` com `consultantId=4afa7cf3-7272-49d0-8fcb-53b0c6cc38ab`.
- Conclusao da evidencia: o consultor logado estava ouvindo um ID diferente do ID que recebeu o pedido.

## Verification Conclusion
- Causa raiz confirmada: a lista de consultores estava permitindo selecionar um perfil legado/duplicado, e o envio foi gravado para um `consultant_id` diferente do usuario autenticado que estava testando.
- Correcao aplicada: `fetchProfiles()` agora prioriza `admin-list-users` (IDs reais do Auth) e faz deduplicacao por email/username para evitar IDs antigos na selecao.
- Correcao adicional aplicada: o `Header` agora mantem callback de navegacao estavel e nao recria o canal realtime a cada re-render do layout.
