#!/bin/bash
set -e

REPO_ROOT=$(cd "$(dirname "$0")" && pwd)

echo "=== 1/3 패키지 설치 및 빌드 ==="
cd "$REPO_ROOT"
pnpm install && pnpm build

echo ""
echo "=== 2/3 글로벌 링크 생성 (pnpm) ==="
cd "$REPO_ROOT/packages/angular" && pnpm link --global
cd "$REPO_ROOT/packages/runtime" && pnpm link --global
cd "$REPO_ROOT/packages/shared" && pnpm link --global

echo ""
echo "=== 3/3 완료 ==="
echo ""
echo "Angular 프로젝트에서 아래 명령어를 실행하세요:"
echo ""
echo "  # pnpm을 사용하는 경우:"
echo "  pnpm link --global @locator/angular @locator/runtime @locator/shared"
echo ""
echo "  # npm을 사용하는 경우:"
echo "  npm link @locator/angular @locator/runtime @locator/shared"
echo ""
