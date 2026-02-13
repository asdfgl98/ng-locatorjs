# @locator/angular

브라우저에서 UI 컴포넌트를 클릭하면 해당 소스코드를 IDE에서 바로 열어주는 Angular 전용 개발 도구입니다.

![LocatorJS](../../docs/logo-noborders.png)

## 동작 원리

1. **빌드 타임** - 플러그인이 Angular 템플릿의 각 HTML 요소에 `data-locatorjs` 속성을 자동 주입합니다.
2. **런타임** - 브라우저에서 `Option(Alt) + 클릭` 시 해당 요소의 소스코드 위치를 IDE에서 엽니다.

외부 `.html` 템플릿과 인라인 `template` 모두 지원하며, Angular 17+의 control flow 구문(`@if`, `@for`, `@switch`)도 처리합니다.

## 설치

이 패키지는 아직 npm에 퍼블리시되지 않았으므로 `npm link`를 사용하여 로컬에서 연결합니다.

### 1. 모노레포 빌드

```bash
# ng-locatorjs 저장소 루트에서
pnpm install
pnpm build
```

### 2. npm link 등록

`@locator/angular`, `@locator/runtime`, `@locator/shared` 세 패키지 모두 링크해야 합니다.

```bash
# ng-locatorjs 저장소에서 각 패키지를 글로벌 링크로 등록
cd packages/angular && npm link
cd ../runtime && npm link
cd ../shared && npm link
```

또는 스크립트로 한번에 실행:

```bash
./setup-link.sh
```

### 3. Angular 프로젝트에서 링크 연결

```bash
# 적용할 Angular 프로젝트 루트에서
npm link @locator/angular @locator/runtime @locator/shared
```

> **참고:** `npm link`는 심볼릭 링크를 생성하므로, 모노레포의 소스를 수정하고 다시 빌드하면 연결된 프로젝트에 즉시 반영됩니다.

## 설정

### esbuild (Angular 17+ Application Builder) - 권장

Angular 17 이상의 기본 빌더(`application`)를 사용하는 프로젝트에 권장됩니다.

#### 1. 커스텀 esbuild 빌더 설치

```bash
npm install --save-dev @angular-builders/custom-esbuild
```

#### 2. `angular.json` 수정

빌더를 `@angular-builders/custom-esbuild:application`으로 변경하고 플러그인 파일을 지정합니다.

```json
{
  "architect": {
    "build": {
      "builder": "@angular-builders/custom-esbuild:application",
      "options": {
        "plugins": ["./esbuild-plugins.ts"]
      }
    }
  }
}
```

#### 3. `esbuild-plugins.ts` 생성 (프로젝트 루트)

```typescript
import { locatorAngularEsbuildPlugin } from '@locator/angular';

export default [locatorAngularEsbuildPlugin()];
```

#### 4. `src/main.ts`에 런타임 초기화 추가

```typescript
import '@locator/angular/init';
```

---

### Webpack (Custom Webpack Builder)

Angular 16 이하 또는 Webpack 기반 빌드를 사용하는 프로젝트용입니다.

#### 1. 커스텀 Webpack 빌더 설치

```bash
npm install --save-dev @angular-builders/custom-webpack
```

#### 2. `angular.json` 수정

```json
{
  "architect": {
    "build": {
      "builder": "@angular-builders/custom-webpack:browser",
      "options": {
        "customWebpackConfig": {
          "path": "./webpack.config.js"
        }
      }
    }
  }
}
```

#### 3. `webpack.config.js` 생성 (프로젝트 루트)

```javascript
const { LocatorAngularWebpackPlugin } = require('@locator/angular');

module.exports = {
  plugins: [new LocatorAngularWebpackPlugin()]
};
```

#### 4. `src/main.ts`에 런타임 초기화 추가

```typescript
import '@locator/angular/init';
```

## 프로덕션 빌드 제외

이 라이브러리는 개발 전용 도구입니다. 프로덕션 빌드에서는 반드시 제외하세요.

### angular.json에서 환경별 분리

```json
{
  "architect": {
    "build": {
      "configurations": {
        "development": {
          "plugins": ["./esbuild-plugins.ts"]
        },
        "production": {}
      }
    }
  }
}
```

### main.ts에서 조건부 import

```typescript
import { isDevMode } from '@angular/core';

if (isDevMode()) {
  import('@locator/angular/init');
}
```

## API

### 빌드 타임

| Export | 설명 |
|--------|------|
| `transformTemplate(template, options)` | HTML 템플릿에 `data-locatorjs` 속성을 주입합니다 |
| `transformInlineTemplate(source, filePath)` | `.component.ts` 파일의 인라인 템플릿을 변환합니다 |
| `LocatorAngularWebpackPlugin` | Webpack 플러그인 (로더 자동 등록) |
| `locatorAngularEsbuildPlugin()` | esbuild 플러그인 팩토리 |

### `TransformTemplateOptions`

```typescript
interface TransformTemplateOptions {
  filePath: string;        // 파일 절대 경로 (필수)
  lineOffset?: number;     // 시작 라인 오프셋 (인라인 템플릿용, 기본값: 0)
  columnOffset?: number;   // 첫 줄 컬럼 오프셋 (인라인 템플릿용, 기본값: 0)
}
```

### 런타임

```typescript
import '@locator/angular/init';
```

이 import는 다음을 수행합니다:
- SSR 환경에서는 초기화를 건너뜁니다
- 문서 로드 완료를 대기한 후 LocatorJS 런타임을 설정합니다

## 지원 범위

- Angular 14+ (Webpack 빌더)
- Angular 17+ (esbuild/Application 빌더)
- 외부 HTML 템플릿 (`.html`)
- 인라인 템플릿 (`@Component({ template: '...' })`)
- Angular 바인딩 구문 (`[property]`, `(event)`, `[(ngModel)]`, `*ngIf`, `*ngFor`)
- Angular 17+ control flow (`@if`, `@for`, `@switch`)

## 라이선스

MIT
