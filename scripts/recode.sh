#!/bin/bash
for f in *_VaporWave.ogg *_HorrorOST.ogg; do
  base="${f%.ogg}"
  out="${base}_fixed.ogg"
  if ffmpeg -y -v error -i "$f" -vn -map 0:a -c:a copy "$out" 2>>"$log"; then
    count=$((count+1))
  else
    fail=$((fail+1))
    echo "FAILED: $f" >> "$log"
