# AGENTS.md — @knyazevai/dsh

Плагин DeepSeek Harness: бандл, добавляющий провайдер **Knyazev AI** (`knyazev-ai`) с моделями Flash / Kimi / MiniMax и thinking/effort `off / high / max`. Устанавливается **по имени** из npm как `@knyazevai/dsh`.

Этот файл — опорная точка для агента/разработчика: где лежит инструкция и как плагин добавлять и поддерживать дальше.

## Где инструкция

- **`README.md` (корень)** — источник правды для пользователей: установка, использование, релиз. Обновление пользовательских инструкций идёт только там.
- **`package.json`** — манифест бандла: `dsh.bundle.patch → ./cordis.patch.yml`, `publishConfig.access: public`, `files`.
- **`cordis.patch.yml`** — конфиг-слой: переопределяет строку `llm-pi-ai` по `id` и задаёт маршрут `knyazev-ai` (baseURL, модели, effort). Применяется после `dsh-base` / `dsh-web-app`.
- **`lib/provider.js`** — каталог провайдера (константы `PROVIDER`, `MODELS`, `REASONING_EFFORTS`...).
- **`test/provider.test.js`** — гейт: проверяет, что `cordis.patch.yml` и `lib/provider.js` **синхронны** между собой и с бандл-манифестом.

Ключ в пакете не хранится: только credential-ссылка `apiKeyEnv: KNYAZEV_AI_API_KEY`, значение пользователь вставляет в Models.

## Правило согласованности каталога и патча

Любое изменение моделей/провайдера вносится **в оба места сразу** — `lib/provider.js` и `cordis.patch.yml` должны описывать один и тот же набор. Тест `test/provider.test.js` падает при рассинхроне; гоняется сам перед публикацией (`prepublishOnly`).

## Как добавить / изменить модель

1. В `lib/provider.js` — поправь/добавь объект в `MODELS`.
2. В `cordis.patch.yml` — продублируй то же самое (`id`, `name`, `contextWindow`, `maxTokens`, `reasoningEfforts` при наличии).
3. `npm test` — докажи, что патч и каталог синхронны.

Обновление пользовательской части (когда и как ставить, что за модели) — в `README.md`, не в коде.

## Компактинг (policy в бандле)

Бандл несёт не только провайдера: `cordis.patch.yml` также переопределяет строку `compaction-basic`, чтобы огромные контексты Knyazev (400k) компактились по кусочкам, а не одним огромным prefill, который на медленном шлюзе умирает по `pi-ai stream idle timeout`.

- Глобальный бюджет `maxSummarizationInputTokens: 0` (старое поведение «переиграть всю область») — не-Knyazev провайдеры не затрагиваются.
- Только `knyazev-ai` × {`deepseek-v4-flash`, `kimi-2.6`, `minimax-2.7`} получают `maxSummarizationInputTokens: 131072` через `modelPolicies` (точное совпадение `provider + model`).
- `compactionRetries: 2`, `maxOverflowRetries: 2` — больше попыток для медленного шлюза.
- **Зависимость от харнесса:** сам ключ `maxSummarizationInputTokens` реализован в `dsh-compaction-basic` (харнесс-коммит `078d3db591`) и работает только в сборке харнесса, которая его содержит. Конфиг в плагине безвреден на старых сборках (ключ просто игнорируется), но bounded-компактинг включается только когда фикс опубликован в `@deepseek-ai/dsh`. Код фикса **нельзя** переносить в плагин — он часть харнесса.

## Как выпустить версию и опубликовать по имени

Публикация идёт в npm как `@knyazevai/dsh`; `dsh plugin add @knyazevai/dsh` ставит его в профиль по имени.

**Авто через CI (рекомендуется):** GitHub Actions (`.github/workflows/publish.yml`) гоняет `npm test` и публикует при пуше тега `v*`. Нужен секрет `NPM_TOKEN` в GitHub-репо (Automation-уровень).

```sh
npm test                  # гейт
npm version patch         # patch | minor | major — поднимает версию
git push github main
git push github v0.1.1    # пуш тега запускает тесты + публикацию
```

**Локально вручную:** токен лежит в `~/.npmrc` (`//registry.npmjs.org/:_authToken=...`), `npm run prepublishOnly` прогоняет тесты:

```sh
npm publish --access public
```

## Локальный профиль разработки

`~/.dsh/profiles/web` держит зависимость — обычно `"@knyazevai/dsh": "^0.1.0"` (реестровый пакет). Для разработки можно временно вернуть `link:/Users/knyaz/knyazevai-dsh`; при переключении делай `pnpm install` в каталоге профиля. После публикации новой версии верни `^<версия>`.

## Проверка перед завершением работы

- `npm test` — зелёный.
- `package.json` валиден; версия не совпадает с уже опубликованной.
- Изменения закоммичены и (если это релиз/CI-воркфлоу) запушены в `github`.
