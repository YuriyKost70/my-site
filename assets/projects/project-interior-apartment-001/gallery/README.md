# Current Gallery Structure

This project currently uses a legacy flat gallery:

```text
gallery/001.jpg
gallery/002.jpg
...
gallery/069.jpg
```

The future universal structure is described in `../project.json`.

When we migrate the images, the structure should become:

```text
gallery/
  01-entrance-area/
    preview/
    full/
  02-living-dining/
    preview/
    full/
```

For now, do not move the existing numbered images because the current HTML page still uses them.
