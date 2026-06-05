# Universal Project Template

Скопируй папку `_template-universal` и переименуй ее под конкретный проект.

## Название Папки Проекта

Используем универсальную схему:

```text
project-[type]-[segment]-[object]-[number]
```

Примеры:

```text
project-interior-private-apartment-001
project-interior-commercial-restaurant-002
project-exterior-private-house-003
project-exterior-commercial-cafe-004
```

`type`: `interior` или `exterior`

`segment`: `private` или `commercial`

`object`: `apartment`, `house`, `office`, `restaurant`, `cafe`, `public-space`, `showroom`, `facade`, `landscape`

## Структура

```text
project-name/
  project.json
  cover.jpg
  planning/
    plan-before.jpg
    plan-after.jpg
  gallery/
    01-block-name/
      preview/
        001.jpg
        002.jpg
      full/
        001.jpg
        002.jpg
    02-block-name/
      preview/
      full/
```

`preview/` — уменьшенные изображения без логотипа для отображения на странице.

`full/` — полноразмерные изображения с логотипом для открытия по клику.

Имена файлов внутри `preview/` и `full/` должны совпадать:

```text
preview/001.jpg
full/001.jpg
```

## Названия Визуальных Блоков

По умолчанию название блока берется из названия папки.

Примеры:

```text
01-entrance-area       -> ENTRANCE AREA
02-living-dining       -> LIVING DINING
03-facade-night-view   -> FACADE NIGHT VIEW
04-materials-details   -> MATERIALS DETAILS
```

Если нужно точное название с символами, укажи его в `project.json`:

```json
{
  "folder": "02-living-dining",
  "title": "LIVING & DINING",
  "layout": "auto"
}
```

Если `title` пустой, сайт или генератор берет название из папки.

## Динамическая Сетка

`layout: "auto"` означает, что сетка выбирается по количеству изображений в блоке:

```text
1-3 изображения   -> крупная спокойная раскладка
4-6 изображений   -> один акцент + малые карточки
7-10 изображений  -> мозаика
11+ изображений   -> повторяемый мозаичный ритм
```

Позже для отдельного блока можно будет задать конкретный layout:

```text
mosaic-a
mosaic-b
symmetric
wide-first
compact
```

## Важное Правило

В коде карточки проекта не должно быть жестко прописанных названий вроде `BEDROOM` или `BATHROOM`.

Карточка должна брать блоки из `project.json` и папок внутри `gallery/`.
