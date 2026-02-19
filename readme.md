# ng-locator

브라우저에서 `Alt + 클릭`으로 Angular 컴포넌트 소스를 에디터에서 바로 여는 개발 도구입니다.

## 설치

```bash
npm install github:asdfgl98/ng-locatorjs
```

## 사용법

### 1. main.ts에 추가

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { installAngularLocator } from 'ng-locator/runtime';

// Angular가 로드될 때까지 대기 후 설치
function initLocator() {
  if ((window as any).ng?.getComponent) {
    installAngularLocator({
      editor: 'antigravity',  // 'cursor' | 'code' | 'webstorm' | 'windsurf' | 'antigravity'
    });
  } else {
    setTimeout(initLocator, 100);
  }
}

if (document.readyState === 'complete') {
  initLocator();
} else {
  window.addEventListener('load', initLocator);
}

bootstrapApplication(AppComponent, appConfig).catch(console.error);
```

### 2. 컴포넌트 스캔

```bash
npx ng-locator-scan
```

### 3. 서버 실행

```bash
npx ng-locator-server --editor antigravity
```

### 4. Angular 개발 서버 실행

```bash
ng serve
```

### 5. 사용

- **Alt 키 누르기** → 컴포넌트들이 파란색 테두리로 표시
- **마우스 이동** → 주황색 하이라이트 + 컴포넌트 정보 툴팁
- **Alt + 클릭** → 에디터에서 **해당 태그가 위치한 템플릿 라인**으로 바로 이동

### 간소화 모드 (스캔 + 서버 통합)

`ng-locator-scan`을 별도로 실행하지 않고 서버에서 자동 스캔 + watch:

```bash
npx ng-locator-server --editor antigravity --watch
```

이 모드에서는:
- 서버 시작 시 자동으로 컴포넌트 스캔
- `.ts` / `.html` 파일 변경 감지 시 자동 재스캔
- 별도의 `ng-locator-scan` 실행 불필요

---

## CLI 명령어

### `ng-locator-scan`

```bash
npx ng-locator-scan [options]

Options:
  --config, -c   설정 파일 경로 (기본값: locator.config.json)
  --output, -o   출력 파일 경로 (기본값: .locator/component-map.json)
  --watch, -w    파일 변경 감지 모드
```

### `ng-locator-server`

```bash
npx ng-locator-server [options]

Options:
  --port, -p     서버 포트 (기본값: 4123)
  --editor, -e   에디터 (cursor, code, webstorm, windsurf, antigravity)
  --map, -m      컴포넌트 맵 파일 경로
  --watch, -w    자동 스캔 + 파일 감시 모드 (ng-locator-scan 불필요)
  --config, -c   스캔 설정 파일 경로 (기본값: locator.config.json)
  --include, -i  추가 스캔 패턴 (여러 번 사용 가능, 기본 패턴에 추가됨)
  --exclude, -x  추가 제외 디렉토리 (여러 번 사용 가능)
```

#### 커스텀 패턴 예시

```bash
# 기본 패턴 + 커스텀 패턴 추가
npx ng-locator-server --editor cursor --watch \
  --include "projects/**/*.component.ts" \
  --include "custom/**/*.widget.ts" \
  --exclude "test-utils"
```

> `--include`/`--exclude`는 기존 기본 패턴에 **추가**됩니다. 기본 패턴을 완전히 교체하려면 `locator.config.json` 파일을 사용하세요.

---

## 지원 파일 패턴

| 패턴 | 설명 |
|------|------|
| `**/*.component.ts` | 컴포넌트 |
| `**/*.page.ts` | 페이지 |
| `**/*.modal.ts` | 모달 |
| `**/*.dialog.ts` | 다이얼로그 |
| `**/*.panel.ts` | 패널 |

### 커스텀 설정 (`locator.config.json`)

```json
{
  "include": [
    "src/**/*.component.ts",
    "apps/**/*.{component,page,modal}.ts"
  ],
  "exclude": ["node_modules", "dist", ".git"],
  "output": ".locator/component-map.json"
}
```

---

## 옵션

```typescript
interface AngularLocatorOptions {
  port?: number;              // 서버 포트 (기본값: 4123)
  editor?: 'cursor' | 'code' | 'webstorm' | 'windsurf' | 'antigravity';
  modifier?: 'alt' | 'ctrl' | 'meta' | 'shift';  // 클릭 키 (기본값: 'alt')
}
```

---

## package.json 스크립트

```json
{
  "scripts": {
    "locator:scan": "ng-locator-scan",
    "locator:server": "ng-locator-server --editor cursor --watch",
    "dev": "concurrently \"npm run locator:server\" \"ng serve\""
  }
}
```

> `--watch` 옵션 사용 시 `locator:scan`을 별도로 실행할 필요가 없습니다.

---

## .gitignore

```gitignore
.locator/
```

---

## 문제 해결

### 컴포넌트가 열리지 않음

1. `ng-locator-scan` 실행 확인
2. `ng-locator-server` 실행 확인 (포트 4123)
3. 브라우저 콘솔에 에러 확인

### Angular not detected

개발 모드(`ng serve`)로 실행 중인지 확인하세요.

---

## 라이선스

MIT
