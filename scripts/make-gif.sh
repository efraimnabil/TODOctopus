#!/usr/bin/env bash
# Turns the recorded demo video into docs/media/demo.gif (needs ffmpeg).
# START / LENGTH are seconds into the video; WIDTH is the GIF width in px.
set -euo pipefail
cd "$(dirname "$0")/.."
VIDEO=$(ls test-results/media/*/video.webm | head -n 1)
START=${START:-9}
LENGTH=${LENGTH:-20}
WIDTH=${WIDTH:-560}
FPS=${FPS:-8}
OUT=docs/media/demo.gif
ffmpeg -v error -y -ss "$START" -t "$LENGTH" -i "$VIDEO" \
  -vf "fps=${FPS},scale=${WIDTH}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4" \
  "$OUT"
echo "wrote $OUT ($(du -k "$OUT" | cut -f1) KB)"
