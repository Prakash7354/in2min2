#!/bin/bash
# Screenshots side by side, to look at several at once (20 Nov 2026).
#   scripts/dev/sheet.sh out.png a.png b.png c.png d.png   (4 per row, 300px wide each)
out=$1; shift
n=$#; cols=$(( n < 4 ? n : 4 )); rows=$(( (n + 3) / 4 ))
html="$(dirname "$out")/.sheet.html"
{ echo "<html><body style='margin:0;display:grid;grid-template-columns:repeat($cols,300px);gap:6px;background:#888'>"
  for f in "$@"; do echo "<div style='position:relative'><img src='file://$f' style='width:300px;display:block'><b style='position:absolute;left:0;top:0;background:#000;color:#fff;font:12px sans-serif;padding:2px 4px'>$(basename "$f" .png)</b></div>"; done
  echo "</body></html>"; } > "$html"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --allow-file-access-from-files \
  --screenshot="$out" --window-size=$(( cols * 306 )),$(( rows * 655 )) "file://$html" >/dev/null 2>&1
