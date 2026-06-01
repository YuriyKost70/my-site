# YVK Design Site

Стартовая структура сайта для работы в VS Code.

## Как открыть

1. Открой папку `yvk-design-site` в VS Code.
2. Установи расширение Live Server.
3. Нажми правой кнопкой по `index.html`.
4. Выбери `Open with Live Server`.

## Структура

```text
yvk-design-site/
  index.html
  css/
    style.css
  js/
    main.js
  assets/
    images/
    logo/
    icons/
```

## Что заменить

В папке `assets/images/` сейчас лежат временные изображения-заглушки:

```text
hero-interior.jpg
about-interior.jpg
project-01.jpg
project-02.jpg
project-03.jpg
project-04.jpg
```

Их нужно заменить на реальные изображения проектов с теми же именами файлов.

В папке `assets/logo/` лежит временный SVG-логотип. Его можно заменить на настоящий логотип.

## Важное

Форма заявки пока не отправляет сообщения. Для реального сайта нужно подключить обработчик формы: PHP, Formspree, Netlify Forms, WordPress-плагин или другой вариант.
