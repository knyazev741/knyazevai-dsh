# @knyazevai/dsh

Плагин [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): провайдер **Knyazev AI**, модели Flash / Kimi / MiniMax, thinking и effort `off / high / max`. После установки выбран **Flash max** — в Models остаётся только ключ.

## Установка

Нужны [Node.js](https://nodejs.org/) и [pnpm](https://pnpm.io/).

Профили DSH — pnpm workspace, поэтому нужен `-w`.

```sh
npx @deepseek-ai/dsh plugin --profile web add -w @knyazevai/dsh
npx @deepseek-ai/dsh web
```

Пока пакет не на npm — ставь с GitHub:

```sh
npx @deepseek-ai/dsh plugin --profile web add -w git+https://github.com/knyazev741/knyazevai-dsh.git
```

Локально из клона:

```sh
npx @deepseek-ai/dsh plugin --profile web add -w .
```

Для headless то же с `--profile headless`.

## После установки

Новые сессии сразу идут на **Knyazev AI / DeepSeek V4 Flash** с effort **max**. Kimi и MiniMax уже в пикере, сабагенты на том же маршруте.

Ключ в пакет не входит. Если `KNYAZEV_AI_API_KEY` ещё не в окружении — открой Harness → Models → **Knyazev AI** и вставь `kn_live_…` из [кабинета](https://knyazevai.work). Модели выбирать не нужно.

Не копируй YAML руками и не дублируй провайдер в `settings.yaml`. Пакет кладёт маршрут и дефолт в composition; ключ живёт в credentials. Сохранённый выбор в `settings.yaml` по-прежнему перекрывает composition.

## Полная сборка с фиксом компактинга

Обычная установка по имени использует официальный релиз DeepSeek Harness, в котором bounded-компактинг для огромных контекстов (400k) ещё не вышел. Если он нужен (большие сессии сжимаются по кусочкам, а не падают по `pi-ai stream idle timeout`) — запусти харнесс из форка с этим фиксом + плагин:

```sh
git clone https://github.com/knyazev741/deepseek-harness
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh plugin --profile web add @knyazevai/dsh
pnpm dsh web
```

Фикс `maxSummarizationInputTokens` — код харнесса, он есть только в этой сборке; плагин несёт его конфиг (только для `knyazev-ai`).

**Как форк держится свежим по upstream (автоматически, с AI-ревью).** В форке есть два воркфлоу:
- `upstream-sync.yml` — раз в час тянет официальный `deepseek-ai/deepseek-harness` master в ветку-ПР `sync/upstream-master` (конфликты решаются в пользу форка);
- `upstream-review.yml` — на каждом таком ПР гоняет sanity-гейты (typecheck + тесты) и прогоняет многоходовой headless-агент Knyazev (`knyazev-ai/deepseek-v4-flash`), который ревьюит дифф и отдаёт вердикт `{safe, summary, risks}`. Авто-мёрж ПР делается **только при вердикте safe**; risky остаётся человеку. Никогда ничего не деплоит.

Для ревью в настройках репозитория форка нужен секрет `KNYAZEV_AI_API_KEY` (тот же ключ маршрута knyazev-ai).

Для человека обновление сводится к `git pull` в клоне + `pnpm install && pnpm run build` — сами изменения upstream уже засинканы и отревьюены на стороне форка.

Пока этот фикс не в официальном релизе, обычная установка по имени compaction-фикса не даёт — только запуск из форка.

## Что ставится

| Поле | Значение |
|---|---|
| Provider | `knyazev-ai` |
| Endpoint | `https://knyazevai.work/v1` |
| Models | `deepseek-v4-flash`, `kimi-2.6`, `minimax-2.7` |
| Thinking | qwen / `enable_thinking` |
| Effort | `off`, `high`, `max` (Flash и Kimi) |

MiniMax без пикера effort: модель не отдаёт reasoning отдельным полем.

Дефолт Harness после установки: `knyazev-ai` / `deepseek-v4-flash`, effort `max`. Сабагенты (`subagent`, `subagent_fork`) на том же маршруте.

## Обновление / снятие

```sh
npx @deepseek-ai/dsh plugin --profile web update
npx @deepseek-ai/dsh plugin --profile web remove -w @knyazevai/dsh
```

## Релиз (публикация в npm)

Пакет публикуется автоматически: GitHub Actions прогоняет тесты и на пуш тега `v<версия>` выкладывает `@knyazevai/dsh` в npm.

Один раз настрой доступ:

1. В npm (Account → Access Tokens) создай токен уровня **Automation** (без двухфакторки).
2. На GitHub в репо → Settings → Secrets and variables → Actions добавь секрет `NPM_TOKEN` с этим токеном.
3. `publishConfig.access: public` уже стоит в `package.json`.

Дальше на каждый новый релиз:

```sh
npm version patch      # поднимает версию: patch | minor | major
git push origin main
git push origin v0.1.1 # пуш тега запускает тесты + публикацию
```

Тесты перед публикацией идут сами (`prepublishOnly` в `package.json`).

Установка **по имени** — сразу после публикации, на любой машине:

```sh
npx @deepseek-ai/dsh plugin --profile web add @knyazevai/dsh
npx @deepseek-ai/dsh web
```

Пока пакет не на npm — действует установка с GitHub из раздела «Установка».

## Docs

https://knyazevai.work/docs
