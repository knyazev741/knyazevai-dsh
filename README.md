# @knyazevai/dsh

Плагин [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): провайдер **Knyazev AI**, модели Flash / Kimi / MiniMax, thinking и effort `off / high / max` сразу.

Ключ в пакет не входит. Его нужно вставить в Models после установки.

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

1. Открой Harness → Models → **Knyazev AI**.
2. Вставь ключ `kn_live_…` из [кабинета](https://knyazevai.work).
3. Выбери `deepseek-v4-flash`. Effort по умолчанию — `high`. Пикер: Off / High / Max.

Не копируй YAML руками и не дублируй провайдер в `settings.yaml`. Пакет кладёт маршрут в composition; ключ живёт в credentials.

## Что ставится

| Поле | Значение |
|---|---|
| Provider | `knyazev-ai` |
| Endpoint | `https://knyazevai.work/v1` |
| Models | `deepseek-v4-flash`, `kimi-2.6`, `minimax-2.7` |
| Thinking | qwen / `enable_thinking` |
| Effort | `off`, `high`, `max` (Flash и Kimi) |

MiniMax без пикера effort: модель не отдаёт reasoning отдельным полем.

Дефолтную модель всего Harness пакет не меняет.

## Обновление / снятие

```sh
npx @deepseek-ai/dsh plugin --profile web update
npx @deepseek-ai/dsh plugin --profile web remove -w @knyazevai/dsh
```

## Docs

https://knyazevai.work/docs
