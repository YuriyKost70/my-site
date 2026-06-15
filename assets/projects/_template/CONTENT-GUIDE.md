# Заполнение проекта

Основной пользовательский файл проекта — `project-description.txt`. Его нужно
сохранять в UTF-8. Скрипт преобразует его в служебный `project-content.txt`,
который вручную редактировать не следует.

## Общий раздел

```text
[PROJECT]

ID:

STATUS:
draft

DIRECTION:
interior

SEGMENT:
residential

STYLE:

FEATURED:
no

ORDER:
1
```

- `ID` можно оставить пустым: скрипт возьмёт имя папки проекта.
- `STATUS`: `draft` или `published`.
- `DIRECTION`: `interior` или `exterior`.
- `SEGMENT`: `residential` или `commercial`.
- `STYLE` необязателен: `modern`, `classic`, `mixed` или пустое поле.
- `FEATURED`: `yes` показывает карточку на главной, `no` — только в каталоге.
- `ORDER` задаёт порядок карточки положительным целым числом.

Стиль сохраняется в данных проекта для будущего использования, но сейчас не
создаёт отдельные кнопки фильтрации.

## Статус

- `draft` — скрипт проверяет и подготавливает текст, но не создаёт страницы и
  не добавляет карточки на сайт;
- `published` — создаются страницы проекта и обновляются карточки.

Пока проект не проверен визуально, следует оставлять `STATUS: draft`.

## Украинская версия

```text
[UA]

TITLE:
Сучасна квартира

SUBTITLE:
Функціональне оновлення планування

LOCATION:
Суми, Україна

OBJECT_TYPE:
Квартира

AREA:
93,18 м²

AUTHOR:
Юрій Костюченко

PROJECT_TYPE:
Комерційний проєкт

DESCRIPTION:
Перший абзац повного опису проєкту.

Другий абзац повного опису проєкту.
```

Пустая строка внутри `DESCRIPTION` начинает новый абзац.
Поля `LOCATION_LABEL`, `OBJECT_TYPE_LABEL`, `AREA_LABEL`, `AUTHOR_LABEL` и
`PROJECT_TYPE_LABEL` обычно можно оставить пустыми: тогда используются
стандартные локализованные подписи.

## Английская версия

Раздел `[EN]` имеет такую же структуру. Его можно временно оставить пустым.
Украинская версия при этом продолжит работать, а английский текст можно
добавить позднее без изменения структуры проекта.

## Необязательные поля

```text
HERO_LEFT:

HERO_RIGHT:

ABOUT_LABEL:

ABOUT_TITLE:

CARD_LABEL:

CARD_TOPLINE_LEFT:

CARD_TOPLINE_RIGHT:

CARD_TITLE:

CARD_DESCRIPTION:

BADGES:

SEO_TITLE:

SEO_DESCRIPTION:

IMAGE_ALT:
```

Если поля пустые, скрипт сформирует их из названия, подзаголовка и первого
абзаца описания.

- `HERO_LEFT` и `HERO_RIGHT` допускают максимум две непустые строки.
- Каждая строка в `BADGES` создаёт отдельный бейдж карточки.
- `CARD_DESCRIPTION` желательно держать коротким: примерно 160–220 символов.

## Команды

Проверить исходный файл без записи:

```powershell
node scripts/prepare-project-content.js --project project-folder --check
```

Создать или обновить только `project-content.txt`:

```powershell
node scripts/prepare-project-content.js --project project-folder
```

Подготовить контент и запустить генератор страниц:

```powershell
node scripts/generate-project-page.js --project project-folder
```

Подготовить контент без генерации страниц:

```powershell
node scripts/generate-project-page.js --project project-folder --prepare-only
```

## Рекомендуемый процесс

1. Скопировать папку `_template`.
2. Переименовать её по стандарту проекта.
3. Заполнить `project-description.txt`.
4. Добавить обложку, планировки и галереи.
5. Проверить проект в статусе `draft`.
6. Вместе проверить тексты, мобильную и десктопную версии.
7. Изменить статус на `published`.
8. Запустить генератор и только после проверки отправить изменения на GitHub.
