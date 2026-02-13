#!/bin/bash
set -e

REPO_ROOT=$(cd "$(dirname "$0")" && pwd)

echo "=== 1/2 빌드 ==="
cd "$REPO_ROOT"
pnpm install && pnpm build

echo ""
echo "=== 2/2 npm link 등록 ==="
cd "$REPO_ROOT/packages/angular" && npm link
cd "$REPO_ROOT/packages/runtime" && npm link
cd "$REPO_ROOT/packages/shared" && npm link

echo ""
echo "=== 완료 ==="
echo "Angular 프로젝트에서 아래 명령어를 실행하세요:"
echo ""
echo "  npm link @locator/angular @locator/runtime @locator/shared"
