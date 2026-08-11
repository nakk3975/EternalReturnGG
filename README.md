# EternalReturnGG

이터널 리턴의 게임 데이터를 조회하고 전적 및 각종 게임 정보를 화면에 제공하기 위해 만든 Spring Boot 웹 프로젝트입니다.

## 주요 기능

- 닉네임 기반 사용자 검색
- 사용자 상세 정보 조회
- 사용자 랭크 정보 조회
- 개별 게임 기록 조회
- 캐릭터 및 스킨 정보 조회
- 무기 / 방어구 정보 조회
- 스킬 및 특성 정보 조회
- 전술 스킬 정보 조회

## 기술 스택

### Backend
- Java 17
- Spring Boot 3.2.1
- Spring MVC
- Spring WebFlux
- MyBatis 3.0.3
- MySQL
- Gradle

### Frontend
- JSP / JSTL
- JavaScript

## 프로젝트 구조

- `EternalReturnController` : 검색, 상세, 사용자 조회 화면 라우팅
- `EternalReturnRestController` : 게임 데이터 조회 REST API
- `EternalReturnBO` : 외부 데이터 요청 및 비즈니스 로직
- `WEB-INF/jsp` : 사용자 화면

## 실행 방법

Java 17과 프로젝트에서 사용하는 MySQL 설정을 준비합니다.

이터널 리턴 Open API 키는 소스 코드에 직접 저장하지 않고 `ETERNAL_RETURN_API_KEY` 환경변수로 전달합니다.

Windows PowerShell:

```powershell
$env:ETERNAL_RETURN_API_KEY="YOUR_API_KEY"
```

macOS / Linux:

```bash
export ETERNAL_RETURN_API_KEY="YOUR_API_KEY"
```

이후 프로젝트 루트에서 실행합니다.

```bash
./gradlew bootRun
```

Windows:

```bash
gradlew.bat bootRun
```

> DB 계정 등 개발 환경별 설정은 로컬 환경에 맞게 변경해야 합니다.

## 목적

외부 게임 API 연동, 서버 측 데이터 처리, 사용자 검색 및 상세 화면 구성을 하나의 Spring Boot 프로젝트에서 학습하고 구현하기 위해 만든 프로젝트입니다.
