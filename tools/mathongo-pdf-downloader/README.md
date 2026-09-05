# MathonGo PDF downloader

Downloads every JEE Main previous year question paper PDF listed on
[mathongo.com/iit-jee/jee-main-previous-year-question-paper](https://www.mathongo.com/iit-jee/jee-main-previous-year-question-paper)
(currently 173 papers spanning 2002–2025), grouped into folders by year/session.

Each listing row links to a `links.mathongo.com` short link that redirects to
a Google Drive file. The script resolves each short link, downloads the file
from Drive, and saves it under an output directory named after the paper.

## Usage

```sh
npx tsx tools/mathongo-pdf-downloader/download.ts
```

By default this saves everything into `tools/mathongo-pdf-downloader/downloads/`.

### Options

| Flag              | Description                                                        | Default    |
| ----------------- | ------------------------------------------------------------------ | ---------- |
| `--out <dir>`     | Output directory                                                   | `./downloads` |
| `--concurrency <n>` | Number of papers to download in parallel                         | `3`        |
| `--limit <n>`     | Only process the first `n` papers (handy for a quick test run)     | all        |
| `--year <text>`   | Only download sections whose heading contains this text (case-insensitive), e.g. `--year "2024 (January)"` | none |
| `--force`         | Re-download even if the destination file already exists            | off        |

Examples:

```sh
# Just the 2024 January session
npx tsx tools/mathongo-pdf-downloader/download.ts --year "2024 (January)"

# Everything, saved elsewhere, 5 at a time
npx tsx tools/mathongo-pdf-downloader/download.ts --out ~/Downloads/jee-papers --concurrency 5
```

Already-downloaded files are skipped on re-run unless `--force` is passed, so
it's safe to re-run the script if it's interrupted partway through.

## Notes

- Google Drive occasionally throttles anonymous downloads of a single file
  ("quota exceeded"). If that happens the script reports the failure for that
  paper at the end instead of writing a corrupt file — re-run later to pick
  up the ones that failed.
- This is a personal/educational-use tool for fetching publicly listed past
  papers; it doesn't bypass any authentication or access control on the
  source site.
