# Music for invitations

Tunes that play once a guest opens an invitation (`lib/catalog.ts` `MUSIC`,
files in `public/music/`). Chosen and downloaded by the owner; made smaller
for phones by Claude Code (AAC, 128 kbps, 44.1 kHz, with macOS `afconvert`).
His original downloads stay in `music/` on his Mac (not in git).

All three are under the **Pixabay Content License**: free for commercial use,
no credit needed. It forbids passing the files on "on a standalone basis"
(as they are, with nothing added), so the app only plays them inside a
host's invitation and never offers them as downloads.

| File | Tune | From | Downloaded |
|---|---|---|---|
| `happy-birthday-1.m4a` | Happy Birthday, by nastelbom | Pixabay audio 469282 (`nastelbom-happy-birthday-469282.mp3`) | 19 Nov 2026 |
| `merry-christmas-1.m4a` | We Wish You a Merry Christmas, by leberch | Pixabay audio 437018 (`leberch-we-wish-you-a-merry-christmas-437018.mp3`) | 19 Nov 2026 |
| `wedding-vows-1.m4a` | Wedding Instrumental (Vow Exchange), by Alex Morgan | Pixabay audio 578502 (`alex-morgan-wedding-instrumental-vow-exchange-578502.mp3`) | 19 Nov 2026 |

Adding a tune: the owner downloads it (Pixabay, or another source whose
licence allows use in an app without credit), Claude Code converts it:

```
afconvert -f m4af -d aac@44100 -b 128000 -s 3 music/NEW.mp3 public/music/name-1.m4a
```

then adds it to `MUSIC` with where its sound starts and fades out (`loop`),
and a line in the table above. A changed file gets a new name (`-2`),
because phones keep these files for a year.

Never use a commercial song (a film song, a chart hit): playing it to guests
needs a licence we don't have.
