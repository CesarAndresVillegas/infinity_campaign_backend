#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

npm run build

rm -rf build
mkdir -p build/stage
cp -r dist/* build/stage/
cp package.json package-lock.json build/stage/

cd build/stage
npm ci --omit=dev --silent
cd ..

python3 -I -c "
import os, zipfile
stage = 'stage'
out = 'lambda.zip'
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, _, files in os.walk(stage):
        for f in files:
            if f.endswith('.map'):
                continue
            full = os.path.join(root, f)
            arc = os.path.relpath(full, stage)
            zf.write(full, arc)
"

echo "Built build/lambda.zip"
