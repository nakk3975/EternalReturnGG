package com.ahn.record.eternalreturn.bo;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

@Service
public class EternalReturnBO {

    private static final String API_KEY_HEADER = "x-api-key";
    private static final String ACCEPT_HEADER = "application/json";
    private static final String API_URL = "https://open-api.bser.io";

    private static final long STATIC_CACHE_MS = Duration.ofHours(12).toMillis();
    private static final long GAME_CACHE_MS = Duration.ofHours(24).toMillis();
    private static final long USER_CACHE_MS = Duration.ofSeconds(30).toMillis();

    @Value("${eternal-return.api-key:}")
    private String apiValue;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ExecutorService prefetchExecutor = Executors.newFixedThreadPool(6);

    private final Map<String, CacheEntry> responseCache = new ConcurrentHashMap<>();
    private final Map<String, Object> cacheLocks = new ConcurrentHashMap<>();

    @PostConstruct
    public void warmStaticCache() {
        // 애플리케이션 시작 직후 자주 사용하는 정적 데이터를 병렬로 미리 적재한다.
        prefetchStatic("/v2/data/Character");
        prefetchStatic("/v2/data/CharacterSkin");
        prefetchStatic("/v2/data/ItemWeapon");
        prefetchStatic("/v2/data/ItemArmor");
        prefetchStatic("/v2/data/TacticalSkillSetGroup");
        prefetchStatic("/v2/data/Trait");
        prefetchStatic("/v1/data/SkillGroup");
    }

    @PreDestroy
    public void shutdownPrefetchExecutor() {
        prefetchExecutor.shutdownNow();
    }

    public String searchGame(int gameId) throws IOException, URISyntaxException {
        return requestCached("/v1/games/" + gameId, true, GAME_CACHE_MS);
    }

    public String searchNickname(String nickName) throws IOException, URISyntaxException {
        String queryParam = "query=" + URLEncoder.encode(nickName, StandardCharsets.UTF_8.toString());
        return request("/v1/user/nickname?" + queryParam, true);
    }

    public String searchAllRoute() throws URISyntaxException {
        return requestCached("/v1/weaponRoutes/recommend", false, STATIC_CACHE_MS);
    }

    public String searchCharacter() throws URISyntaxException {
        return requestCached("/v2/data/Character", false, STATIC_CACHE_MS);
    }

    public String searchArmor() throws URISyntaxException {
        return requestCached("/v2/data/ItemArmor", false, STATIC_CACHE_MS);
    }

    public String searchWeapon() throws URISyntaxException {
        return requestCached("/v2/data/ItemWeapon", false, STATIC_CACHE_MS);
    }

    public String userInfo(int userNum) throws URISyntaxException {
        String response = requestCached("/v1/user/games/" + userNum, false, USER_CACHE_MS);
        prefetchRecentGames(response);
        return response;
    }

    public String tacticalSkill() throws URISyntaxException {
        return requestCached("/v2/data/TacticalSkillSetGroup", false, STATIC_CACHE_MS);
    }

    public String characterSkin() throws URISyntaxException {
        return requestCached("/v2/data/CharacterSkin", false, STATIC_CACHE_MS);
    }

    public String skillInfo() throws URISyntaxException {
        return requestCached("/v1/data/SkillGroup", false, STATIC_CACHE_MS);
    }

    public String traitSkill() throws URISyntaxException {
        return requestCached("/v2/data/Trait", false, STATIC_CACHE_MS);
    }

    public String userRank(int userNum) throws URISyntaxException {
        // 현재 JSP가 이 API를 가장 먼저 호출하므로, 랭크 응답을 기다리는 동안
        // 다음 단계에서 필요한 최근 전적/게임 상세를 미리 병렬 조회한다.
        prefetchUserInfo(userNum);
        return requestCached("/v1/user/stats/" + userNum + "/21", false, USER_CACHE_MS);
    }

    private void prefetchUserInfo(int userNum) {
        prefetchExecutor.submit(() -> {
            try {
                userInfo(userNum);
            } catch (Exception e) {
                // 선조회 실패는 실제 /er/user/detail 요청에서 다시 시도한다.
            }
        });
    }

    private void prefetchStatic(String path) {
        prefetchExecutor.submit(() -> {
            try {
                requestCached(path, false, STATIC_CACHE_MS);
            } catch (Exception e) {
                // 정적 데이터 선조회 실패 시 실제 요청에서 다시 시도한다.
            }
        });
    }

    private String requestCached(String path, boolean useMetaHash, long ttlMillis) throws URISyntaxException {
        long now = System.currentTimeMillis();
        CacheEntry cached = responseCache.get(path);

        if(cached != null && cached.expiresAt > now) {
            return cached.body;
        }

        Object lock = cacheLocks.computeIfAbsent(path, key -> new Object());

        synchronized(lock) {
            now = System.currentTimeMillis();
            cached = responseCache.get(path);

            if(cached != null && cached.expiresAt > now) {
                return cached.body;
            }

            String response = request(path, useMetaHash);
            responseCache.put(path, new CacheEntry(response, now + ttlMillis));
            return response;
        }
    }

    private String request(String path, boolean useMetaHash) throws URISyntaxException {
        if(!StringUtils.hasText(apiValue)) {
            throw new IllegalStateException("ETERNAL_RETURN_API_KEY environment variable is not configured.");
        }

        URI uri = new URI(API_URL + path);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set(API_KEY_HEADER, apiValue);
        headers.set(HttpHeaders.ACCEPT, ACCEPT_HEADER);

        if(useMetaHash) {
            headers.set("metaType", "hash");
        }

        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<String> responseEntity = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);
        return responseEntity.getBody();
    }

    private void prefetchRecentGames(String userGameResponse) {
        List<Integer> gameIds = extractRecentGameIds(userGameResponse, 10);

        for(Integer gameId : gameIds) {
            String path = "/v1/games/" + gameId;
            CacheEntry cached = responseCache.get(path);

            if(cached != null && cached.expiresAt > System.currentTimeMillis()) {
                continue;
            }

            prefetchExecutor.submit(() -> {
                try {
                    requestCached(path, true, GAME_CACHE_MS);
                } catch (Exception e) {
                    // 선조회 실패는 실제 /er/game 요청에서 다시 시도한다.
                }
            });
        }
    }

    private List<Integer> extractRecentGameIds(String response, int limit) {
        List<Integer> gameIds = new ArrayList<>();

        if(!StringUtils.hasText(response)) {
            return gameIds;
        }

        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode userGames = root.path("userGames");

            if(!userGames.isArray()) {
                return gameIds;
            }

            for(JsonNode game : userGames) {
                JsonNode gameIdNode = game.path("gameId");
                if(gameIdNode.canConvertToInt()) {
                    gameIds.add(gameIdNode.asInt());
                }

                if(gameIds.size() >= limit) {
                    break;
                }
            }
        } catch (Exception e) {
            // 선조회용 파싱 실패는 기존 조회 기능에 영향을 주지 않도록 무시한다.
        }

        return gameIds;
    }

    // 텍스트 파일 불러오기
    public ResponseEntity<Resource> loadTextFile() throws IOException {
        Resource resource = new ClassPathResource("static/text/l10n-Korean-20240124065525.txt");

        if(!resource.exists()) {
            throw new IOException("Localization text resource not found.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "plain", StandardCharsets.UTF_8));
        headers.setContentDispositionFormData("attachment", "l10n-Korean-20240124065525.txt");
        headers.setCacheControl(CacheControl.maxAge(Duration.ofHours(12)).cachePublic());

        return ResponseEntity.ok()
                .headers(headers)
                .body(resource);
    }

    private static class CacheEntry {
        private final String body;
        private final long expiresAt;

        private CacheEntry(String body, long expiresAt) {
            this.body = body;
            this.expiresAt = expiresAt;
        }
    }
}
