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
    private volatile JsonNode statistics;
    private volatile long statisticsExpires;
    private final java.util.concurrent.ScheduledExecutorService statisticsWorker=java.util.concurrent.Executors.newSingleThreadScheduledExecutor();
    private final java.util.concurrent.atomic.AtomicBoolean statisticsRefreshing=new java.util.concurrent.atomic.AtomicBoolean();
    @jakarta.annotation.PostConstruct
    public void startStatisticsWarmup() {
        statisticsWorker.scheduleWithFixedDelay(() -> {
            try { refreshStatistics(); } catch(Exception ignored) { }
        },0,300,java.util.concurrent.TimeUnit.SECONDS);
    }
    @jakarta.annotation.PreDestroy
    public void stopStatisticsWarmup(){statisticsWorker.shutdownNow();}
    public JsonNode statistics() {
        JsonNode current=statistics;
        long now=System.currentTimeMillis();
        if(current!=null && now-statisticsExpires<1_500_000) {
            if(statisticsExpires<=now && statisticsRefreshing.compareAndSet(false,true)) {
                statisticsWorker.execute(() -> {try {refreshStatistics();}catch(Exception ignored){}finally{statisticsRefreshing.set(false);}});
            }
            if(statisticsExpires>now)return current;
            var stale=current.deepCopy();
            ((com.fasterxml.jackson.databind.node.ObjectNode)stale).put("_cacheStale",true);
            return stale;
        }
        return refreshStatistics();
    }
    private synchronized JsonNode refreshStatistics() {
        if(statistics!=null && statisticsExpires>System.currentTimeMillis())return statistics;
        JsonNode result = call(Map.of("action","get","key","/v2/data/statistics"));
        if(result != null)result=result.path("body");
        if(result == null || !result.path("rows").isArray())throw new IllegalStateException("통계를 불러오지 못했습니다.");
        statisticsExpires=System.currentTimeMillis()+300000;
        statistics=result;
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
