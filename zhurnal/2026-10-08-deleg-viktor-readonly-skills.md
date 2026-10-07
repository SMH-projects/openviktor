# Viktor owner-task: read-only skills scope

Карты: `../svyaz/deleg-viktor/karta-owner-a2a-20261008.md`, `../svyaz/kanal/karta-viktor-a2a-owner-20261008.md`.

Санкционированный case `viktor-workspace-skills-read` просит перечислить навыки и прочесть один, а legacy owner-task gateway разрешал только `read_learnings`. Инструменты `list_skills` и `read_skill` уже выполняют scoped `prisma.skill` запросы с `where.workspaceId=ctx.workspaceId` в `packages/tools/src/tools/skills.ts`, `write_skill` не допускается. Меняется только read-only allowlist существующего runner; owner grant, внешний ingress и A2A сервер остаются недоступными до отдельного gate.

RED: `bun test apps/bot/src/tool-gateway/agent-task.test.ts` → 5 passed, 1 failed (missing `list_skills`, `read_skill`). GREEN: `bun test apps/bot/src/tool-gateway/agent-task.test.ts apps/bot/src/tool-gateway/agent-task-runtime.test.ts apps/bot/src/tool-gateway/viktor-a2a.test.ts` → 19 passed, 0 failed. Owner live/terminal Task не проверены.

Один read-only аудит exact SHA `08c89bb19b85f14c53a3633e3f6b8b862f3c5c75` нашёл MAJOR: gateway расширен, но `agent-task-runtime.ts` и `index.ts` по-прежнему разрешали лишь `read_learnings`. RED после тестов на runtime и scoped token: runtime 3/4, scoped token не разрешал чтение. Исправлено общей `OWNER_READ_TOOLS` для gateway/runtime/tool-token; писать `write_skill` всё ещё запрещено. GREEN `vitest run` из `apps/bot` по четырём точным файлам: 24 passed; `bun test packages/tools/src/__tests__/skills.test.ts`: 12 passed; `git diff --check` exit0. Повторный аудит не запускается (правило одного раунда).

При подготовке guest readback добавлено точное утверждение SQL workspace-фильтра в существующий тест `list_skills`: `where.workspaceId=ws_test`, имена/описания/версии без содержимого других пространств. `bun test ./packages/tools/src/__tests__/skills.test.ts`: 12 passed, 21 assertions.
