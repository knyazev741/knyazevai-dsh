# KnyazevAI DSH Provider

Плагин-провайдер для [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) и совместимых DSH Desktop-клиентов.

- **KnyazevAI API** — сам API-сервис, кабинет и ключи на [knyazevai.work](https://knyazevai.work).
- **KnyazevAI DSH Provider** — этот плагин, который добавляет KnyazevAI API и его модели в DSH.
- npm-пакет: **`@knyazevai/dsh-provider`**.

Плагин не устанавливает полный форк Harness и не заменяет системные пакеты DSH. Он добавляет маршрут `knyazev-ai`, модель по умолчанию и настройки компактинга для больших контекстов.

## Установка

### DSH Desktop

После появления плагина в каталоге:

1. Открой **Settings → Plugin Market**.
2. Найди **KnyazevAI DSH Provider**.
3. Нажми **Install** и перезапусти Desktop, если он попросит.
4. Открой **Settings → Models → KnyazevAI API** и вставь ключ `kn_live_…`.

### Обычный DSH Web

```sh
npx @deepseek-ai/dsh plugin --profile web add @knyazevai/dsh-provider
npx @deepseek-ai/dsh web
```

Для другого профиля замени `web` на его имя, например `headless`.

## После установки

Новые сессии по умолчанию используют:

```text
Provider: knyazev-ai
Model:    deepseek-v4-flash
```

Ключ в npm-пакет не входит. Он хранится в credentials DSH под ссылкой `KNYAZEV_AI_API_KEY`. В интерфейсе достаточно открыть **Models → KnyazevAI API** и вставить ключ из кабинета.

Не копируй provider YAML вручную и не дублируй его в `settings.yaml`: bundle уже добавляет маршрут в composition. Пользовательские настройки DSH по-прежнему имеют приоритет над дефолтами плагина.

## Модели

| Модель | Контекст | Максимальный ответ | Effort |
|---|---:|---:|---|
| `deepseek-v4-flash` | 400 000 | 40 000 | `off`, `high`, `max` |
| `glm-5.3-flash` | 400 000 | 40 000 | `low`, `high`, `max` |
| `minimax-2.7` | 204 800 | 40 000 | выключен |

DeepSeek и GLM передают выбранный уровень через OpenAI-style `reasoning_effort`; API сам нормализует DeepSeek под его upstream thinking wire. MiniMax явно объявлен как модель без reasoning, поэтому не наследует effort, ранее выбранный для другой модели. Kimi 2.6 удалён из каталога, потому что живой KnyazevAI API больше его не публикует.

Сабагенты `subagent` и `subagent_fork` по умолчанию используют тот же маршрут `knyazev-ai/deepseek-v4-flash`.

## Миграция со старого имени

Версии `@knyazevai/dsh` до `0.1.4` были ранними версиями этого provider-плагина. Начиная с `0.1.5`, имя `@knyazevai/dsh` принадлежит полной сборке KnyazevAI DSH, поэтому provider переехал в отдельный пакет.

```sh
npx @deepseek-ai/dsh plugin --profile web remove @knyazevai/dsh
npx @deepseek-ai/dsh plugin --profile web add @knyazevai/dsh-provider
```

Если в `~/.dsh/settings.yaml` осталась строка `reasoning: high` или `reasoning: max` внутри `providers.knyazev-ai`, удали её. Старый общий effort мог ошибочно применяться к MiniMax; новая версия хранит reasoning только на уровне поддерживающих его моделей.

## Обновление и удаление

```sh
npx @deepseek-ai/dsh plugin --profile web update @knyazevai/dsh-provider
npx @deepseek-ai/dsh plugin --profile web remove @knyazevai/dsh-provider
```

## Что находится в пакете

- `package.json` с `dsh.bundle.patch`;
- `cordis.patch.yml` с маршрутом KnyazevAI API и дефолтной моделью;
- `lib/provider.js` с каталогом моделей и опциональной политикой компактинга;
- тест, который не даёт каталогу и patch-файлу разойтись.

Пакет совместим с официальным DSH начиная с `0.1.5-rc.2`. Для новых возможностей компактинга используется feature detection: на старой сборке провайдер продолжит работать, а неподдерживаемая политика просто не зарегистрируется.

## Разработка

```sh
npm test
npm pack --dry-run
```

Релиз публикуется из GitHub Actions по тегу вида:

```sh
dsh-provider-v0.1.1
```

Версия тега должна совпадать с `package.json`.

## Документация API

https://knyazevai.work/docs
