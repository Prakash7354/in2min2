# The website's images (in2min2.com)

The owner chose these free stock photos (21 Nov 2026) and the logo files. The
originals stay in the git-ignored `images/` folder; the web copies in
`public/site/` are made with `sips` (JPEG, about 600 px and 1200 px wide; the
turning photos at the top, `show-*`, 900 and 1600 px at quality 50–55, as they
sit under a shade). All eight of the owner's photos for the top are used (22 Nov
2026); Lhosar, football and the party came as 1920 px PNGs.
**Owner: please add the page link for each stock photo** (Pexels or Unsplash),
as with the music in [music.md](music.md), so the source can always be shown.

| Web copy | Original | Used for | Source link |
| --- | --- | --- | --- |
| `show-party` | birthday-celebration copy.jpg | Top of the page, turning photos (1st) | (add) |
| `show-mist` | newlyweds-in-the-mist2231126.jpg | Top of the page, turning photos (2nd) | (add) |
| `show-concert` | event-audience-221126.jpg | Top of the page, turning photos (4th) | (add) |
| `show-bench` | happy-valentines-day-211126.jpg | Top of the page, turning photos (5th) | (add) |
| `show-bride` | bride-and-groom-221126.jpg | Top of the page, turning photos (8th) | (add) |
| `show-lhosar` | tamu-lhosar-celebration.png | Top of the page, turning photos (3rd) | (add) |
| `show-football` | football-event.png | Top of the page, turning photos (6th) | (add) |
| `show-reception` | multi-party-screen.png | Top of the page, turning photos (7th) | (add) |
| `birthday` | birthday-celebration.jpg | Birthdays card, the demo invitation | (add) |
| `wedding` | multi-party-screen.png (the owner's 1920 px copy, 22 Nov) | Weddings and receptions | (add) |
| `christmas` | christmas-family-lunch.jpg | Christmas | (add) |
| `office` | christmas-function.jpg | Work and office parties | (add) |
| `newyear` | new-year-celebration.jpg | New Year's Eve | (add) |
| `party` | happy-newyear-party.jpg | Parties | (add) |
| `sport` | football-event-coordination.jpg | Tournaments, bigger events | (add) |
| `festival` | musical-event-221126.webp | Melas and festivals | (add) |
| `marquee` | birthday-celebration copy.jpg | Afterwards | (add) |
| `jeena` | Jeena-wenning-221126.svg (the photo inside it) | Jeena’s Pasni card | (add) |
| `harisita` | hari-sita-anniversary.svg (the photo inside it) | Hari & Sita’s anniversary card (heart), the photo wheel | (add) |
| `memorial` | memorial-candle-24-1126.svg (the photo inside it) | The memorial card | (add) |
| `lhosar-s` | tamu-lhosar-celebration.png (the owner's 1920 px copy, 22 Nov) | Tamu Lhosar card, the photo wheel | (add) |
| `petals` | wedding-241126.jpg | “Your words, your way” wedding card (top of the stack) | (add) |
| `w-ceremony-s` | traditional-indian-wedding.jpg | The photo wheel, the wedding card’s stack | (add) |
| `reunion-s` | reunion-group-211126.jpg (the owner’s group photo, 21 Nov) | 25th Year Reunion card, the photo wheel | owner’s own |
| `w-cake-s` | date-of-birth-221126.jpg, cut upright | The photo wheel | (add) |
| `w-heart-s` | wedding-heart-212226.jpg, cut upright | The photo wheel, the wedding card’s stack | (add) |
| `w-mist-s` | newlyweds-in-the-mist2231126.jpg, cut upright | The photo wheel | (add) |

The owner's Jeena, Hari & Sita and memorial files are SVGs with one big photo
inside (2–8 MB each); the web copies are made from that photo. Please send
JPEGs in future: the SVGs were too big to read in a chat message.

**Logo** (owner's design): `public/brand/logo.png` from in2min2-logo-stars-211126.webp,
with the white taken off by `scripts/art/white-to-alpha.swift`. The light logo
for the navy top bar, `public/brand/logo-light.png`, is made from it by
`scripts/art/dark-to-light.swift` (navy turns cream; the dial and stars stay). Favicon and app
icons (`app/icon.png`, `app/apple-icon.png`) from “in2min2-favicon-281126- Background Removed.png”
(owner, 21 Nov 2026), trimmed so the ticket fills the icon, by `scripts/art/icons.swift`.
The sharing picture `public/share/in2min2-festive.jpg` (what WhatsApp, Viber and
Facebook show for in2min2.com) is the owner's banner with "Your event online in two
minutes" and "Free until 31 January", made from `scripts/art/share-image.html` (how,
at the top of that file). Its title and words are in `lib/site-share.ts`.
**Change both in February**, and give the new picture a new file name.

**App icons** (23 Nov 2026): the WhatsApp, Viber, Messenger and Facebook logo shapes in `components/app-icons.tsx` come from Simple Icons 13.21.0 (simpleicons.org), CC0 (public domain). Each company allows its logo on a "share with" button; keep them unchanged and in their own colours.

**Banner** (owner's design, stopwatch and people): `public/brand/logo-banner.png` from
in2min2-banner-211126.jpeg (only 512 px wide; a bigger copy would be sharper), white
taken off as above. Shown in “Why we made in2min2” with what the logo means.

`in2min2-log-human-211126.jpeg` isn't used: its "transparent" background is a
grey-and-white checkerboard printed into the JPEG.
