# PR #2·#14 diff 대조와 잔여 변경 보존

검토 기준: main `c1fd5496cd34a99a0feaadb528736056671187f8`.
PR #2는 base `5ed0eed42454cb6cdc9c0439d91e13d9fafeebc9` → head `f97e277a2788afbd72b9deec1cfe82d198d09595`의 1개 파일·전체 hunk를, #14는 base `72ad8a5009c6ae830fa669a7ddb85f3f4a4a13f1` → head `916b55682695dcc8935cae7e183bfe3eacb4466a`의 7개 파일·전체 hunk를 비교했다. 충돌 여부나 검색 결과만으로 대체 완료를 판정하지 않았다.

## PR #2

| 원래 변경 | main의 대체 근거 | 처리 |
|---|---|---|
| 동기 AJAX 제거·랭크 응답 이후 요약 렌더링 | `1e40a74`에서 동기 AJAX 제거, `cafd671`에서 랭크/최근 요청 독립화, `dbbe876`에서 JSP 인라인 코드를 `player.js`로 교체. 현재 랭크 요청은 `.then(renderRank)`이고 최근 전적 요청과 독립 실행 | 대체됨 |
| 게임 상세 10건 병렬 요청 | `1e40a74` 병렬화 이후 `aa48e7e`·`cafd671`에서 확장 시 상세 조회로 전환. 현재 `erRenderGame`은 카드를 펼칠 때 `/er/game` 조회, 최근 목록은 `/er/user/detail` 응답만으로 표시 | 선조회 방식이 지연 조회로 대체됨; 10건 선조회 복원 불필요 |
| 전술/특성/스킬 공통 메타데이터 1회 조회 | `1e40a74` 공통 병렬 조회, `dbbe876`의 정적 JS 분리, 현재 `siteData.js`의 `erStatic`/`erRequest` 캐시 및 중복 요청 병합. #19 (`c5d6e3b`)에서 선택 메타데이터가 초기 렌더링을 막지 않게 독립 로딩 | 대체됨 |
| 장비 등급 5건 병렬 조회 | `1e40a74` 병렬화, `dbbe876` 이후 `itemSlots.js`의 무기/방어구 카탈로그 병렬 조회와 Map 조회·CSS 등급 색상 | 슬롯별 API 요청 자체가 제거됨 |
| 평균 딜량을 시즌 랭크 게임 수·고정 10건에 의존하지 않고 최근 건수로 계산 | `cafd671`에서 `totalDamage/items.length`, 이후 `player.js`의 `rows.length` 계산. 그러나 현재 첫 요약의 평균 피해 문구는 직후 `render()`에 덮여 표시되지 않음 | 유효한 표시 누락: 최신 렌더링의 `recent-overview`에 평균 딜량 지표 보존. 현재 필터·추가 조회된 경기 수를 분모로 사용 |
| 상위 티어 판정 순서·랭크 응답 이후 이미지 설정 | `dbbe876` 정적 JS 전환 후 `fcdce5c`의 `siteData.js erTier`, 현재 이터니티/데미갓 분기가 미스릴 이전에 평가되고 `player.test.cjs`가 경계 검증. 현재 정책의 RP·랭크 기준 사용 | 대체됨; 구 200/500/1000 경계 복원 불필요 |
| 로컬 변수 범위, 줄바꿈·들여쓰기·중복 코드 제거 | JSP 인라인 구현 전체가 `dbbe876`에서 제거되고 정적 JS로 교체 | 이식할 독립 동작 없음 |

## PR #14

주요 대체 PR: #21 merge `2f94e91f98898c0559a3b621d62c0074a0807fad`, #22 merge `2d3f3eec23478986ff4b96f5272baccd19b995ae`, #23 merge `c1fd5496cd34a99a0feaadb528736056671187f8`.

| 원래 파일/변경 | main 대조 | 처리 |
|---|---|---|
| `.github/workflows/performance.yml` | #21의 `browser-performance.yml`로 대체: 메뉴/회수/Render 모드·설치·artifact 보존, 중단 시 업로드·최소20회·180분 제한이 개선됨 | 중복 workflow 생성 없이 누락된 `base_url` 입력과 npm 캐시만 보존 |
| `.gitignore` node_modules | #21에서 `/node_modules/`, 성능 JSON 무시 규칙 추가 | 대체됨 |
| README 측정 명령·문서 링크 | 실행 문서는 존재하지만 README의 진입 링크가 없음 | 최신 설치/측정 명령과 링크 보존 |
| `docs/verification/PERFORMANCE.md` | #21~#23이 cold/warm, p50/p95, 오류율, Render 단일 회차·로그 증거 절차를 대체 | 환경변수·headed·추가 진단 필드 설명만 보존 |
| `package.json`·lock | #21에서 같은 `test:js`/`perf:browser`와 Playwright 1.63.0을 고정. 기존 #14의 느슨한 버전 범위로 되돌릴 이유 없음 | 대체됨 |
| 하네스 메뉴·cold/warm·단일 Render·표본 JSON·p50/p95·1초 비율·오류율 | #21 구현에 #22 종료 취소 제외·#23 placeholder 의도된 취소 제외 반영 | 대체됨 |
| 강제 networkidle·250ms 대기·전체 이미지 timeout 무시 | #21에서 메뉴 준비 요소·가시 이미지 및 실패 표본 판정으로 교체 | 오래된 측정 정의 복원 불필요 |
| CLI 환경변수 기본값·`--headed` | 현재 CLI 인수는 있지만 환경변수·headed 없음 | 보존 |
| DNS·connect·TLS·TTFB·DOMContentLoaded·load 상세 timing, API transferSize | 현재 HTML responseMs/API duration만 남아 있음 | 표본에 부가 진단 필드로 보존 |
| min/max, 실행 runs/mode 메타데이터 | 현재 집계는 count/p50/p95, 실행 모드는 phase로만 구분 | 기존 필드 유지하며 추가 보존 |
| 구 JSON 키명·콘솔 표·중복 definitions | #21의 새 schema·실행 로그·문서 정의로 대체 | 호환성 없는 구 schema 복원 불필요 |

이슈 #6의 2026-09-30 결과는 본측정 440회이며 cold p95 1초 미만 3/11, warm 7/11이다. 이 대조나 잔여 변경 보존은 목표 달성·Render 실제 절전 검증 완료를 의미하지 않는다. 새로운 실서비스 측정은 수행하지 않았다.

## 보존 범위와 검증

잔여 변경은 최신 main에서 분기한 `codex/preserve-stale-pr-residuals`에만 분리했다. 오래된 JSP·중복 workflow·과거 준비 조건은 이식하지 않았다. 원본 PR 본문에 이 문서와 후속 PR을 연결한 뒤 닫되 원본 브랜치는 유지한다.

- `npm run test:js`: 24개 테스트 파일 통과. 기존 티어·캐시·요청 회귀 검사 포함.
- 추가 계측 검사: DNS/TLS/TTFB·전송량 보존, 환경변수/CLI 우선순위, 성공 표본만 min/max, placeholder/종료 취소 제외 규칙.
- 평균 딜량: 두 경기·한 경기·피해0·빈 목록 표시 검사.
- `node --check scripts/performance-browser.cjs`, `git diff --check` 통과.
- Java 코드 변경 없음. Render 절전·실서비스 440회 재측정·배포는 이번 검증 범위 밖이다.
