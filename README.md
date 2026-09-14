# EternalReturnGG

이터널 리턴의 **전적 검색·경기 분석·표본 통계·장비 제작·사냥 동선 계획**을 연결한 개인 웹 프로젝트입니다.

[서비스 열기](https://eternalreturngg.onrender.com/er/search/view) · [Notion 프로젝트](https://www.notion.so/3da9e5109c8e81eab807e6b44d6fa470) · [개발자 소개](https://github.com/nakk3975/TripPlan/blob/main/PORTFOLIO.md)

## 현재 상태

2026-09-14 기능 배포 기준: [`95cf3d3`](https://github.com/nakk3975/EternalReturnGG/commit/95cf3d3b5264b79527a6b85d3b03b745ce440dc3), Render **NAKK / eternalreturngg**. 프로필·지도·시뮬레이터 변경과 통계 HTTP 500 수정까지 배포하고 11개 메뉴의 주요 흐름을 확인했습니다.

- [배포·기능·검증 기록](docs/verification/2026-09-14-profile-map.md)
- [개발 로드맵과 완료 기준](docs/ROADMAP.md)
- [API 관측 계약 검증](docs/verification/2026-09-14.md)
- [전체 이슈](https://github.com/nakk3975/EternalReturnGG/issues)

## 주요 기능

| 메뉴 | 제공 기능 |
| --- | --- |
| 전적 검색·프로필 | 레벨·닉네임·랭크/RP, 새로고침과 서버 갱신 시각, 기본 프로필/실험체/매치 히스토리/스킨 통계 탭 |
| 경기 상세 | 팀·참가자 정보와 닉네임 아래 티어/RP, 빌드·스탯·킬 정보·그래프·특성·크레딧·큐브/LUMI |
| 랭킹·멀티서치 | 시즌 랭킹, 주요 실험체, 최대 5명 전적 비교 |
| 실험체·통계 | 시즌·모드·티어·기간별 수집 경기 표본과 추천 빌드 |
| 아이템 | 무기군·부위·등급 검색, 능력치, 제작 트리, 표본 통계 |
| 추천 루트·시뮬레이터 | 루트 ID 가져오기, 실험체별 무기 제한, 5부위 장비, 초반/후반 3빌드, 전술·핵심·보조 특성, 재료와 방문 순서 추천, 공유 |
| 야생동물 지도 | 일반 캠프 163개 근사 좌표, 출발점 지정, 크레딧/이동 부담 기준 사냥 추천, 필터·처치/지역 제외·공유 |
| 가이드·즐겨찾기 | 메뉴 안내와 브라우저에 저장한 플레이어 다시 조회 |

공통 검색창의 focus 선·그림자를 제거했습니다. 스킨은 **보유 목록이 아닌 사용 기록**, 통계는 **수집된 경기 표본**입니다. 경기 티어는 시작 RP 구간으로 표시하며 당시 상위 랭킹이 없는 미스릴·데미갓·이터니티는 ‘미스릴 이상’으로 합산합니다.

## 성능 개선과 남는 한계

- 독립 요청 병렬화, 중복 요청 공유, 다음 전적 선조회, 메모리·Supabase 캐시, 정적 카탈로그 재사용을 적용했습니다.
- 통계 전체 JSON 전송 병목을 화면별 `overview/items/character` 응답으로 분리했습니다. overview 저장 JSON은 **13,844,802 → 702,979 bytes(약 95% 감소)**입니다.
- 서버가 깨어 있고 HTTP 연결을 재사용한 단일 측정에서 통계 API는 **0.361~0.555초**였습니다. 첫 조회·전체 화면 완료·p95 수치가 아닙니다.
- **첫 접속부터 모든 메뉴 1초 미만은 미달성**입니다. Render Free 절전 이후 기동 대기와 외부 API 의존성이 남아 있습니다.
- 지도는 실제 벽·현재 동물 생존·생성 단계까지 반영한 최단 경로가 아닙니다. 시뮬레이터는 실험체 기본 수치와 장비 합계를 별도로 표시하며 숙련도·고유효과를 포함한 최종 능력치는 아직 계산하지 않습니다.
- 모바일 실제 기기와 모든 테마·화면 크기의 조합은 추가 검증 대상입니다.

## 기술 구성

| 영역 | 구성 |
| --- | --- |
| Backend | Java 17, Spring Boot 3.2.1, Spring MVC/WebFlux, Jackson |
| Frontend | JSP/JSTL, JavaScript, HTML/CSS, SVG |
| 운영 저장소 | Supabase PostgreSQL: 영속 캐시·경기 아카이브·통계, Edge Function HTTP 연결 |
| 배포 | Gradle 8.5, 실행 가능한 WAR, Docker, Render Singapore Free |
| 검증 | JUnit/Spring Boot Test, Node.js 테스트, GitHub Actions, 운영 브라우저 점검 |

MyBatis/MySQL 의존성은 초기 구성으로 빌드에 남아 있습니다. `render` 프로필은 JDBC/MyBatis 자동 구성을 제외하고, 운영 캐시·통계는 Supabase HTTP 경로를 사용합니다.

## 실행과 검증

Java 17을 준비하고 환경변수로 키를 설정합니다. 값은 저장소에 커밋하지 않습니다.

```bash
export ETERNAL_RETURN_API_KEY="YOUR_API_KEY"
# 영속 캐시·통계 사용 시 기존 서버용 연결을 설정
export ER_CACHE_URL="YOUR_CACHE_ENDPOINT"
export ER_CACHE_TOKEN="YOUR_CACHE_TOKEN"
bash gradlew bootRun --args='--spring.profiles.active=render'
```

```powershell
$env:ETERNAL_RETURN_API_KEY="YOUR_API_KEY"
$env:ER_CACHE_URL="YOUR_CACHE_ENDPOINT"
$env:ER_CACHE_TOKEN="YOUR_CACHE_TOKEN"
.\gradlew.bat bootRun --args="--spring.profiles.active=render"
```

기본 포트는 `10000`이며 `PORT`로 변경할 수 있습니다. 영속 캐시 설정을 생략하면 저장된 통계 등 해당 연결에 의존하는 기능은 사용할 수 없습니다. 수집 설정은 `ER_COLLECTOR_ENABLED`, `ER_COLLECTOR_DAILY_LIMIT`로 관리합니다. 웹 서버 절전 중에는 신규 경기 수집도 멈춥니다.

```bash
node --test src/test/js/*.test.cjs
bash gradlew test bootWar
```

PR #3~#5에서 Java 테스트/bootWar와 JS 17개 파일이 통과했습니다. 로컬 Java 검사는 Gradle 다운로드 제한으로 실행하지 못해 CI 결과를 근거로 사용했습니다. `live` workflow는 자동 실행에서 skipped이며, 공식 API 직접 실행 완료로 간주하지 않습니다. [재현 스크립트와 실제 API 검증 범위](docs/verification/2026-09-14.md)를 참고하세요.

## 코드와 운영 문서

- [EternalReturnBO](src/main/java/com/ahn/record/eternalreturn/bo/EternalReturnBO.java): 외부 API·캐시·선조회
- [PersistentApiCache](src/main/java/com/ahn/record/eternalreturn/bo/PersistentApiCache.java): Supabase 캐시와 화면별 통계
- [프론트엔드](src/main/resources/static/js): 프로필·지도·시뮬레이터·카탈로그
- [DB 정의](db) · [화면별 통계 SQL](docs/sql/statistics_projection.sql) · [Render 설정](render.yaml)
- 변경 PR: [#3](https://github.com/nakk3975/EternalReturnGG/pull/3), [#4](https://github.com/nakk3975/EternalReturnGG/pull/4), [#5](https://github.com/nakk3975/EternalReturnGG/pull/5)

게임 데이터·이미지의 권리는 각 제공자에게 있습니다. Eternal Return Open API와 DAK.GG의 정보 구성·리소스를 참고하며, 상용 서비스 전체 기능과의 동등성을 주장하지 않습니다.

**함께 보기** · [TripPlan](https://github.com/nakk3975/TripPlan) · [2Team-Workspace](https://github.com/nakk3975/2Team-Workspace)
