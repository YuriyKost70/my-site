# Project Folder Template

Скопируй папку `_template`, переименуй ее по правилу:

```text
project-[direction]-[object_type]-[id]
```

Примеры:

```text
project-interior-apartment-001
project-interior-office-002
project-interior-public-003
project-exterior-house-004
project-exterior-commercial-005
```

## Обязательные Файлы

```text
project.txt
cover.jpg
gallery/01.jpg
```

## Дополнительные Файлы

```text
plan.jpg
gallery/02.jpg
gallery/03.jpg
gallery/04.jpg
```

Фото в `gallery/` сортируются по номеру файла: `01.jpg`, `02.jpg`, `03.jpg`.

## Допустимые Значения

`direction`:

```text
interior
exterior
```

`object_type`:

```text
apartment
house
office
public
commercial
horeca
showroom
```

`categories` можно указывать через запятую:

```text
interior,residential
exterior,commercial
interior,commercial
```

Основные категории фильтра:

```text
interior
exterior
residential
commercial
```

## Статус

`status: draft` - проект не должен публиковаться.

`status: published` - проект можно показывать на сайте.

## Медиа

`cover.jpg` используется как обложка карточки и главное фото страницы проекта.

`plan.jpg` используется для блока планировки. Если файла нет, блок можно не показывать.

`gallery/` используется для галереи на детальной странице проекта.
