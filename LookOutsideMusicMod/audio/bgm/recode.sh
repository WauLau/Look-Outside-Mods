#!/bin/bash
for f in *_VaporWave*; do
    mv "$f" "$(echo "$f" | sed -r 's/{//')"
done
