# Bible text

`kjv.json` is the King James Version (1769 text), which is in the public
domain in the United States and most other countries.

The data was extracted from `formats/json/KJV.json` in the
[scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases)
project, which compiles and publishes it under the MIT License (see that
project's `LICENSE` file). It was reshaped here into a simpler
`{ "Book Name": [["verse 1", "verse 2", ...], ...] }` structure to keep the
bundle small and easy to look up.
