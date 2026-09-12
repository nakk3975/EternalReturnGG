package com.ahn.record.eternalreturn.bo;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.Instant;
import java.util.Map;

@Service
public class PersistentApiCache {
    @Value("${ER_CACHE_URL:}") private String url;
    @Value("${ER_CACHE_TOKEN:}") private String token;
    private final RestTemplate client;
    public PersistentApiCache() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(1000);
        factory.setReadTimeout(3500);
        client = new RestTemplate(factory);
    }
    private JsonNode call(Map<String,Object> body) {
        if(url.isBlank() || token.isBlank())return null;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-cache-token", token);
        return client.postForObject(url, new HttpEntity<>(body,headers),JsonNode.class);
    }
    private JsonNode statistics;
    private long statisticsExpires;
    public synchronized JsonNode statistics() {
        if(statistics != null && statisticsExpires > System.currentTimeMillis())return statistics;
        JsonNode result = call(Map.of("action","get","key","/v2/data/statistics"));
        if(result != null)result=result.path("body");
        if(result == null || !result.path("rows").isArray())throw new IllegalStateException("통계를 불러오지 못했습니다.");
        statistics=result;statisticsExpires=System.currentTimeMillis()+300000;
        return result;
    }
    public Snapshot read(String key) {
        try {
            JsonNode row = call(Map.of("action","get","key",key));
            if(row == null || !row.path("body").isObject())return null;
            return new Snapshot(row.get("body").toString(),Instant.parse(row.path("expires_at").asText()).toEpochMilli());
        } catch(Exception ignored) { return null; } // DB failure must not break API lookups.
    }
    public void writeChecked(String key, JsonNode body, long ttl) {
        JsonNode result=call(Map.of("action","put","key",key,"body",body,"ttl",ttl));
        if(result==null || !result.path("ok").asBoolean())throw new IllegalStateException("Cache write not confirmed");
    }
    public void write(String key, JsonNode body, long ttl) {
        try { call(Map.of("action","put","key",key,"body",body,"ttl",ttl)); }
        catch(Exception ignored) { /* Keep the in-memory response available. */ }
    }
    public record Snapshot(String body, long expiresAt) {}
}
