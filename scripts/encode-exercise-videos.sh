#!/bin/bash
# Encodes raw demo clips (<src-dir>/<id>.mp4) into small looping H.264 clips for the app bundle:
#   scripts/encode-exercise-videos.sh <src-dir> [ffmpeg-binary]
# Output: assets/exercises/<id>.mp4 (512x384, silent, ~50-90 KB each).
set -e
SRC=${1:?src dir}; FF=${2:-ffmpeg}
OUT="$(dirname "$0")/../assets/exercises"
for f in "$SRC"/*.mp4; do
  id=$(basename "$f" .mp4)
  "$FF" -y -loglevel error -i "$f" -c:v libx264 -crf 24 -preset veryslow -profile:v main -pix_fmt yuv420p \
    -vf "scale=512:384:flags=lanczos" -an -movflags +faststart "$OUT/$id.mp4"
  echo "$id.mp4 $(stat -c %s "$OUT/$id.mp4")"
done
