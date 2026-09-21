# AGENTS.md — @knyazevai/dsh-provider

Плагин DeepSeek Harness с продуктовым именем **KnyazevAI DSH Provider**. Он подключает сервис **KnyazevAI API** как provider `knyazev-ai` и распространяется отдельным npm-пакетом `@knyazevai/dsh-provider`.

Не возвращай пакет к имени `@knyazevai/dsh`: начиная с версии `0.1.5` это имя принадлежит полной сборке KnyazevAI DSH, а не provider-плагину.

## Источники правды

- **`README.md`** — пользовательская установка, миграция, модели и релиз.
- **`package.json`** — npm identity и `dsh.bundle.patch → ./cordis.patch.yml`.
- **`cordis.patch.yml`** — маршрут `knyazev-ai`, дефолтная модель, сабагенты и загрузка deployment-плагина компактинга.
- **`lib/provider.js`** — каталог provider/model metadata и опциональная политика компактинга.
- **`test/provider.test.js`** — контрактный гейт между package manifest, каталогом и patch-файлом.

Ключ в пакет не входит. Конфигурация содержит только credential-ссылку `KNYAZEV_AI_API_KEY`; значение пользователь вводит в Models.

## Имена продукта

- API-сервис и provider в Models: **KnyazevAI API**.
- Плагин в npm и Plugin Market: **KnyazevAI DSH Provider**.
- npm package: `@knyazevai/dsh-provider`.
- Cordis provider id: `knyazev-ai`.

## Согласованность каталога

Любое изменение provider или модели вноси одновременно в `lib/provider.js` и `cordis.patch.yml`. Тест должен проверять не только наличие модели, но и её wire-specific reasoning metadata.

Текущая логика:

- DeepSeek V4 Flash и Kimi 2.6: `off / high / max`, Qwen-style thinking.
- GLM 5.3 Flash: `low / high / max`, `thinkingFormat: openai`, `supportsReasoningEffort: true`.
- MiniMax 2.7: `reasoningEfforts: false`.
- Provider-wide `reasoning` запрещён: effort принадлежит модели, иначе выбор Flash может сломать MiniMax.

## Компактинг

Deployment-плагин через feature detection регистрирует полную группу compaction только в preset-ах `standard`, `code`, `cordis`. `minimal` не меняется.

- `maxSummarizationInputTokens: 0` остаётся глобальным fallback.
- Для моделей `knyazev-ai` действует bounded policy до `131072` входных токенов на summary.
- DeepSeek V4 Flash и GLM 5.3 Flash начинают compaction при `thresholdRatio: 0.5`.
- `compactionRetries: 2`, `maxOverflowRetries: 2`.
- Старые Harness-сборки без contributor face продолжают загружать provider; policy просто не регистрируется.

## Разработка

```sh
npm test
npm pack --dry-run
```

Для интеграционной проверки упакуй tarball и установи его в чистый официальный профиль `@deepseek-ai/dsh`, затем проверь `--dump-config` и реальный boot без API-вызова.

## Релиз

Публикация идёт только по тегам `dsh-provider-v*`. Версия тега обязана совпадать с `package.json`.

```sh
npm test
npm pack --dry-run
git tag dsh-provider-v0.1.1
git push github main
git push github dsh-provider-v0.1.1
```

GitHub Actions публикует `@knyazevai/dsh-provider` с `publishConfig.access: public`. Для workflow нужен `NPM_TOKEN` с правом публикации в scope `@knyazevai`.

После первого релиза старые provider-версии следует пометить:

```sh
npm deprecate '@knyazevai/dsh@<=0.1.4' 'Provider moved to @knyazevai/dsh-provider'
```

Не затрагивай `@knyazevai/dsh@>=0.1.5`: это полная сборка DSH.

## Проверка перед завершением

- `npm test` зелёный.
- `npm pack --dry-run` содержит только ожидаемые файлы.
- Инсталляция tarball в чистый официальный DSH-профиль проходит, bundle активен, Host стартует.
- `package.json` валиден, package name свободен или принадлежит пользователю, версия не опубликована.
- Изменения закоммичены; push и публикация выполняются только в рамках явно поручённого релиза.
