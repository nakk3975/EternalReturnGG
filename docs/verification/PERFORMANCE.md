# 11개 메뉴 배포 화면 성능 검증

기준은 현재 main의 `scripts/verify-site-pages.cjs`에 있는 메뉴 경로와 화면 준비 요소다. 로그인·닉네임 입력 없이 열 수 있는 각 메뉴의 초기 화면을 측정한다. 멀티서치는 검색 결과가 아니라 빈 입력 화면이다.

```bash
npm ci
npx playwright install chromium
npm run perf:browser -- --runs 20 --require-20 --output performance-report.json
```

GitHub Actions의 **Browser performance**를 수동 실행해도 된다. 단일 메뉴 검사는 `--menu statistics`처럼 지정한다. 결과 JSON은 매 표본 뒤 갱신되므로 도중 중단된 파일은 `attempts`를 확인해야 한다.

- `browser-cold`: 매번 새 브라우저 컨텍스트와 no-cache 헤더. 서버 재시작이나 Render 절전 해제와 다르다.
- `browser-warm`: 메뉴별 예열 1회 뒤 같은 컨텍스트에서 20회. 예열은 통계에서 제외한다. main의 sessionStorage 메타데이터 캐시도 유지된다.
- `screenComplete`: 탐색 시작부터 해당 메뉴 준비 요소가 보이고 화면 안의 이미지가 완료된 시점. 아래쪽 lazy 이미지와 계속되는 배경 요청은 기다리지 않는다. 준비 요소가 25초 안에 없거나 이미지가 15초 안에 완료되지 않으면 실패 표본이다.
- `navigationResponse`: HTML 탐색 Resource Timing의 요청 시작부터 응답 종료. `dataResponse`는 같은 origin의 `/er/` 비탐색 요청으로, 요청별 Resource Timing을 집계한다. 응답이 없는 요청은 오류율에 포함되지만 지연 백분위에서는 제외된다.
- p50/p95는 성공한 지연 표본의 nearest-rank 값이다. `pageFailureRate`, `requestErrorRate`와 1초 미만 비율은 전체 시도 횟수를 분모로 한다. `dataByEndpoint`는 경로별 응답 시간과 오류율을 보인다. 초기 페이지가 요청하지 않은 API는 해당 메뉴의 데이터 지연 표본에 나타나지 않는다.
- 요청 오류는 화면 완료 시점까지만 수집한다. 측정을 끝낸 뒤 페이지를 닫으며 취소되는 lazy 이미지 요청은 오류율에 넣지 않는다. 외부 리소스 실패는 경로와 함께 `failedRequests`에 남기고 동일 origin API 실패와 구분한다.

Render 절전 표본은 별도 실행한다. Render 요청·기동 로그로 마지막 접속 후 **15분 이상 무접속**과 실제 슬립·기동을 확인하고 다른 확인 요청 없이 `--render-cold --menu home --runs 1`을 실행한다. JSON의 `renderIdleVerified`는 자동으로 `false`이며 로그 검증을 사람의 기록으로 따로 남긴다. 이 단일 표본은 p50/p95나 일반 브라우저 cold 결과에 합치지 않는다.

보고서의 URL·측정 시간·지역(GitHub hosted runner)·표본 수를 함께 기록한다. 외부 병목의 원인 확정에는 같은 시간대 Render cache hit/miss, Supabase, 공식 API 상태 로그가 필요하다. 클라이언트 요청 시간이 길다는 사실만으로 특정 제공자 원인을 단정하지 않는다. 1초 목표 판정은 메뉴별 `screenComplete.p95Ms < 1000`과 실패율을 함께 확인한다.
