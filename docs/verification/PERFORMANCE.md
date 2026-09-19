# 성능 검증 실행 기준

이 문서는 GitHub 이슈 #6의 **11개 메뉴 최초 화면 완료 1초 미만**을 같은 정의로 반복 측정하기 위한 절차입니다. API 단일 응답과 브라우저 화면 완료를 섞어서 판정하지 않습니다.

## 설치

```bash
npm install
npx playwright install chromium
```

## 브라우저 cold/warm 및 p50/p95

```bash
npm run perf:browser -- --runs 20 --output performance-report.json
```

- `browser-cold`: 매회 새 브라우저 컨텍스트를 만들고 `no-cache` 요청 헤더를 사용합니다. Render 프로세스 cold start라는 뜻은 아닙니다.
- `browser-warm`: 메뉴별 1회 예열 후 같은 컨텍스트에서 반복합니다.
- `navigationResponse`: HTML 탐색 요청의 Resource Timing입니다.
- `dataResponse`: 같은 origin의 `/er/` 데이터 요청 Resource Timing입니다.
- `screenComplete`: DOMContentLoaded 뒤 network idle, 이미지 완료 및 250ms 안정화까지의 벽시계 시간입니다.
- p95 판정은 최소 20회 측정을 권장합니다. 오류가 난 표본은 지연 통계에서 빼되 `errorRate`에 포함합니다.

특정 메뉴만 빠르게 점검할 수 있습니다.

```bash
npm run perf:browser -- --menu statistics --runs 5 --output statistics-smoke.json
```

로컬 Chromium 설치가 제한된 환경에서는 GitHub Actions의 `Browser performance`를 수동 실행합니다. 완료 후 `performance-report-<run id>` artifact를 내려받으면 같은 원본 JSON을 확인할 수 있습니다.

## Render Free 15분 절전 후 첫 접속

1. Render 로그의 마지막 요청 시각을 기록합니다.
2. UptimeRobot, 브라우저 탭, 헬스체크 외 호출을 포함해 15분 이상 서비스 요청이 없도록 합니다.
3. 15분이 지난 직후 아래 명령을 **한 번만** 실행합니다.

```bash
npm run perf:browser -- --render-cold --menu home --runs 1 --output render-cold.json
```

이 결과는 `render-after-15m-idle`로 별도 기록됩니다. 실행 전에 다른 HTTP 확인을 하면 서버를 깨우므로 해당 회차는 폐기합니다. Render가 실제로 절전되었는지는 Render 로그의 기동 시각과 첫 요청 시각으로 확인해야 합니다.

## 판정표

| 항목 | 로컬/자동 수집 | 외부 증거 필요 |
| --- | --- | --- |
| 11개 메뉴 HTML·데이터·이미지 화면 완료 p50/p95 | 가능 | 실제 배포 URL 네트워크에서 실행 |
| 브라우저 cold/warm 분리 | 가능 | 없음 |
| Render 절전 후 첫 요청 | 단일 측정 가능 | 15분 무접속 및 기동 로그 |
| Supabase 지연 | `/er/` 데이터 응답으로 관측 가능 | Supabase 로그와 상관분석 |
| 공식 API 제한/캐시 miss 원인 | 오류율·느린 요청 관측 가능 | 서버 로그의 cache hit/miss 및 upstream 상태 |
| 1초 목표 판정 | `screenComplete.p95Ms < 1000` 확인 | 대표 사용자 지역/네트워크 조건 명시 |

보고서에는 원본 표본이 함께 저장되므로 p50/p95만 남기지 말고 JSON을 검증 기록으로 보존합니다. 닉네임, API 키, 응답 본문은 수집하지 않습니다.
