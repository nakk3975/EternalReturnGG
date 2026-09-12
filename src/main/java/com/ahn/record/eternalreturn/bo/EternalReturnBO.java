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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

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
    private static final long SEASON_CACHE_MS = Duration.ofHours(1).toMillis();
    private static final long GAME_CACHE_MS = Duration.ofHours(24).toMillis();
    private static final long USER_CACHE_MS = Duration.ofSeconds(30).toMillis();

    private static final int RANKED_MODE = 3;

    @Value("${eternal-return.api-key:}")
    private String apiValue;

    private final RestTemplate restTemplate = new RestTemplate(httpFactory());
    private static SimpleClientHttpRequestFactory httpFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(10000);
        return factory;
    }
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ExecutorService prefetchExecutor = Executors.newFixedThreadPool(6);

    @Autowired(required = false) private PersistentApiCache persistentCache;
    private final java.util.Set<String> refreshing = ConcurrentHashMap.newKeySet();
    private final java.util.concurrent.ThreadPoolExecutor persistenceExecutor = new java.util.concurrent.ThreadPoolExecutor(
            2, 2, 0L, java.util.concurrent.TimeUnit.MILLISECONDS, new java.util.concurrent.ArrayBlockingQueue<>(64));
    private final Map<String, CacheEntry> responseCache = new ConcurrentHashMap<>();
    private final Object[] cacheLocks = java.util.stream.IntStream.range(0, 64)
            .mapToObj(i -> new Object()).toArray();
    private byte[] localizationBody;
    private long localizationExpiresAt;

    @PostConstruct
    public void warmStaticCache() {
        // 서버 시작 시 자주 사용하는 최신 메타 데이터를 미리 적재한다.
        prefetchStatic("/v2/data/Season", SEASON_CACHE_MS);
        prefetchStatic("/v2/data/Character", STATIC_CACHE_MS);
        prefetchStatic("/v2/data/CharacterSkin", STATIC_CACHE_MS);
        prefetchStatic("/v2/data/ItemWeapon", STATIC_CACHE_MS);
        prefetchStatic("/v2/data/ItemArmor", STATIC_CACHE_MS);
        prefetchStatic("/v2/data/TacticalSkillSetGroup", STATIC_CACHE_MS);
        prefetchStatic("/v2/data/Trait", STATIC_CACHE_MS);
        prefetchStatic("/v1/l10n/Korean", STATIC_CACHE_MS);
    }

    @PreDestroy
    public void shutdownPrefetchExecutor() {
        prefetchExecutor.shutdownNow();
        persistenceExecutor.shutdownNow();
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

    public String routeData(String table) throws URISyntaxException {
        if (!java.util.Set.of("Area", "ItemSpawn", "DropGroup", "Collectible", "ItemConsumable", "ItemSpecial", "NearByArea", "NaviCollectAndHunt").contains(table))
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Unsupported route table");
        return requestCached("/v2/data/" + table, false, STATIC_CACHE_MS);
    }

    public String materials() throws URISyntaxException { return requestCached("/v2/data/ItemMisc", false, STATIC_CACHE_MS); }

    public String searchWeapon() throws URISyntaxException {
        return requestCached("/v2/data/ItemWeapon", false, STATIC_CACHE_MS);
    }

    public String userInfo(String userId) throws URISyntaxException {
        return userInfo(userId, null);
    }

    public String userInfo(String userId, Long next) throws URISyntaxException {
        String path = "/v1/user/games/uid/" + encodePathSegment(userId);
        if (next != null && next > 0) path += "?next=" + next;
        return requestCached(path, false, next != null && next > 0 ? GAME_CACHE_MS : USER_CACHE_MS);
    }

    public String tacticalSkill() throws URISyntaxException {
        return requestCached("/v2/data/TacticalSkillSetGroup", false, STATIC_CACHE_MS);
    }

    public String characterSkin() throws URISyntaxException {
        return requestCached("/v2/data/CharacterSkin", false, STATIC_CACHE_MS);
    }

    public String skillInfo() throws IOException, URISyntaxException {
        // SkillGroup is no longer a public data table. Names remain in official localization.
        byte[] body = loadTextFile().getBody();
        var skills = new ArrayList<Map<String, Object>>();
        for (String line : new String(body, StandardCharsets.UTF_8).split("\\n")) {
            if (!line.startsWith("Skill/Group/Name/")) continue;
            int separator = line.indexOf('┃');
            if (separator < 0) continue;
            try {
                int code = Integer.parseInt(line.substring("Skill/Group/Name/".length(), separator).trim());
                int character = code / 1000 - 1000;
                if (character < 1 || character > 999) continue;
                skills.add(Map.of("group", code, "characterCode", character,
                        "name", line.substring(separator + 1).trim(), "icon", "SkillIcon_" + code));
            } catch (NumberFormatException ignored) { }
        }
        return objectMapper.writeValueAsString(Map.of("code", 200, "data", skills));
    }

    public String metaHash() throws URISyntaxException {
        return requestCached("/v2/data/hash", false, STATIC_CACHE_MS);
    }

    public String traitSkill() throws URISyntaxException {
        return requestCached("/v2/data/Trait", false, STATIC_CACHE_MS);
    }

    public String userRank(String userId) throws URISyntaxException {
        return userRank(userId,getCurrentSeasonId());
    }
    public String seasons() throws URISyntaxException {return requestCached("/v2/data/Season",false,SEASON_CACHE_MS);}
    public String userRank(String userId,int season) throws URISyntaxException {
        try {
            boolean valid=false;
            for(JsonNode row:objectMapper.readTree(seasons()).path("data"))if(readSeasonId(row)==season)valid=true;
            if(!valid)throw new IllegalArgumentException("Unknown season");
        }catch(IOException e){throw new IllegalStateException("Invalid season data",e);}
        return requestCached("/v2/user/stats/uid/"+encodePathSegment(userId)+"/"+season+"/"+RANKED_MODE,false,
            season==getCurrentSeasonId()?USER_CACHE_MS:Duration.ofHours(6).toMillis());
    }

    public String leaderboard() throws URISyntaxException {
        return requestCached("/v1/rank/top/" + getCurrentSeasonId() + "/3", false,
                Duration.ofMinutes(5).toMillis());
    }

    public int getCurrentSeasonId() throws URISyntaxException {
        String response = requestCached("/v2/data/Season", false, SEASON_CACHE_MS);

        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode seasons = root.path("data");
            Integer latestSeasonId = null;

            if(seasons.isArray()) {
                for(JsonNode season : seasons) {
                    int seasonId = readSeasonId(season);
                    if(seasonId <= 0) {
                        continue;
                    }

                    if(latestSeasonId == null || seasonId > latestSeasonId) {
                        latestSeasonId = seasonId;
                    }

                    if(season.path("isCurrent").asInt(0) == 1 || season.path("isCurrent").asBoolean(false)) {
                        return seasonId;
                    }
                }
            }

            // 프리시즌 등으로 isCurrent가 비어 있는 경우 가장 최신 시즌을 사용한다.
            if(latestSeasonId != null) {
                return latestSeasonId;
            }
        } catch (Exception e) {
            throw new IllegalStateException("Current Eternal Return season data could not be parsed.", e);
        }

        throw new IllegalStateException("Current Eternal Return season could not be determined.");
    }

    private int readSeasonId(JsonNode season) {
        if(season.has("seasonID")) {
            return season.path("seasonID").asInt();
        }
        if(season.has("seasonId")) {
            return season.path("seasonId").asInt();
        }
        if(season.has("id")) {
            return season.path("id").asInt();
        }
        return 0;
    }

    private void prefetchUserInfo(String userId) {
        prefetchExecutor.submit(() -> {
            try {
                userInfo(userId);
            } catch (Exception e) {
                // 선조회 실패는 실제 /er/user/detail 요청에서 다시 시도한다.
            }
        });
    }

    private void prefetchStatic(String path, long ttlMillis) {
        prefetchExecutor.submit(() -> {
            try {
                requestCached(path, false, ttlMillis);
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

        if (cached != null && persistentEligible(path)) {
            refreshStored(path, useMetaHash, ttlMillis);
            return staleBody(cached.body);
        }
        Object lock = cacheLocks[(path.hashCode() & Integer.MAX_VALUE) % cacheLocks.length];

        synchronized(lock) {
            now = System.currentTimeMillis();
            cached = responseCache.get(path);

            if(cached != null && cached.expiresAt > now) {
                return cached.body;
            }

            if (persistentEligible(path) && persistentCache != null) {
                PersistentApiCache.Snapshot stored = persistentCache.read(path);
                if(stored != null) {
                    responseCache.put(path, new CacheEntry(stored.body(), stored.expiresAt()));
                    if(stored.expiresAt() <= now) {
                        refreshStored(path,useMetaHash,ttlMillis);
                        return staleBody(stored.body());
                    }
                    return stored.body();
                }
            }
            String response = request(path, useMetaHash);
            validateCacheBody(response);
            if (responseCache.size() >= 500) {
                long expiryNow = System.currentTimeMillis();
                responseCache.entrySet().removeIf(entry -> entry.getValue().expiresAt <= expiryNow);
                if (responseCache.size() >= 500) {
                    responseCache.keySet().stream().limit(100).forEach(responseCache::remove);
                }
            }
            responseCache.put(path, new CacheEntry(response, System.currentTimeMillis() + ttlMillis));
            if(persistentEligible(path) && persistentCache != null) {
                try { persistenceExecutor.execute(() -> writeStored(path,response,ttlMillis)); }
                catch(java.util.concurrent.RejectedExecutionException ignored) { }
            }
            return response;
        }
    }

    private boolean persistentEligible(String path) {
        return path.startsWith("/v1/user/games/") || path.startsWith("/v2/user/stats/") || path.startsWith("/v1/games/") || path.startsWith("/v1/rank/top/");
    }
    private void validateCacheBody(String body) {
        try {
            JsonNode data=objectMapper.readTree(body);
            if(!data.isObject() || (data.has("code") && data.path("code").asInt()!=0 && data.path("code").asInt()!=200))
                throw new IllegalStateException("Invalid API cache response");
        } catch(IOException e) { throw new IllegalStateException("Invalid API JSON",e); }
    }
    private String staleBody(String body) {
        try {
            com.fasterxml.jackson.databind.node.ObjectNode data=(com.fasterxml.jackson.databind.node.ObjectNode)objectMapper.readTree(body);
            data.put("_cacheStale",true);
            return data.toString();
        } catch(Exception ignored) { return body; }
    }
    private void writeStored(String path,String body,long ttl) {
        try { persistentCache.write(path,objectMapper.readTree(body),ttl); }
        catch(Exception ignored) { }
    }
    private void refreshStored(String path,boolean meta,long ttl) {
        if(!refreshing.add(path))return;
        try {
            persistenceExecutor.execute(() -> {
                try {
                    String body=request(path,meta);
                    validateCacheBody(body);
                    responseCache.put(path,new CacheEntry(body,System.currentTimeMillis()+ttl));
                    if(persistentCache != null)writeStored(path,body,ttl);
                } catch(Exception ignored) { /* Preserve the last successful snapshot. */ }
                finally { refreshing.remove(path); }
            });
        } catch(java.util.concurrent.RejectedExecutionException ignored) { refreshing.remove(path); }
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

    private String encodePathSegment(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
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

    public synchronized ResponseEntity<byte[]> loadTextFile() throws IOException, URISyntaxException {
        if (localizationBody != null && localizationExpiresAt > System.currentTimeMillis()) {
            return localizationResponse(localizationBody);
        }
        String l10nInfo = requestCached("/v1/l10n/Korean", false, STATIC_CACHE_MS);
        String l10nPath;

        try {
            JsonNode root = objectMapper.readTree(l10nInfo);
            l10nPath = root.path("data").path("l10Path").asText();
        } catch (Exception e) {
            throw new IOException("Localization download information could not be parsed.", e);
        }

        if(!StringUtils.hasText(l10nPath)) {
            throw new IOException("Localization download URL was not returned by the API.");
        }

        ResponseEntity<byte[]> localizationResponse = restTemplate.getForEntity(l10nPath, byte[].class);
        byte[] body = localizationResponse.getBody();

        if(body == null) {
            throw new IOException("Localization data could not be downloaded.");
        }

        // Share official names and descriptions for the global information tooltip.
        String names = new String(body, StandardCharsets.UTF_8).lines()
                .filter(line -> line.startsWith("Character/Name/") || (line.startsWith("Item/Name/") || line.startsWith("Item/Desc/")) || line.startsWith("Trait/") || line.startsWith("Skill/"))
                .collect(java.util.stream.Collectors.joining("\n"));
        if (names.isEmpty()) throw new IOException("Localization name records were not found.");
        localizationBody = names.getBytes(StandardCharsets.UTF_8);
        localizationExpiresAt = System.currentTimeMillis() + STATIC_CACHE_MS;
        return localizationResponse(localizationBody);
    }

    private ResponseEntity<byte[]> localizationResponse(byte[] body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "plain", StandardCharsets.UTF_8));
        headers.setCacheControl(CacheControl.maxAge(Duration.ofHours(12)).cachePublic());

        return ResponseEntity.ok()
                .headers(headers)
                .body(body);
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
