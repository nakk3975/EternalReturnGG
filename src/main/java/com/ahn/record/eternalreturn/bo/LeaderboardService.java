package com.ahn.record.eternalreturn.bo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/** Serve a last-known-good ranking without blocking HTTP threads on the upstream API. */
@Service
public class LeaderboardService {
    private final EternalReturnBO api;
    private final ObjectMapper mapper = new ObjectMapper();
    private final ScheduledExecutorService worker = Executors.newSingleThreadScheduledExecutor();
    private final AtomicBoolean refreshing = new AtomicBoolean();
    private volatile Snapshot snapshot;
    private volatile long retryAt;
    private volatile boolean failed;
    public LeaderboardService(EternalReturnBO api) { this.api = api; }
    @PostConstruct
    public void start() { worker.scheduleWithFixedDelay(this::refresh, 0, 300, TimeUnit.SECONDS); }
    @PreDestroy
    public void stop() { worker.shutdownNow(); }
    public ResponseEntity<JsonNode> get() {
        Snapshot current = snapshot;
        long now = System.currentTimeMillis();
        boolean stale = current == null || now - current.updatedAt > 300_000;
        if (stale && now >= retryAt && !refreshing.get()) worker.execute(this::refresh);
        // Do not silently serve arbitrarily old rankings during extended API outages.
        boolean usable = current != null && now - current.updatedAt < 1_800_000;
        ObjectNode body = usable ? current.body.deepCopy() : mapper.createObjectNode();
        if (!usable) body.putArray("topRanks");
        body.put("loading", !usable && !failed);
        body.put("stale", usable && stale);
        body.put("refreshFailed", failed);
        if (usable) body.put("updatedAt", Instant.ofEpochMilli(current.updatedAt).toString());
        if (failed) body.put("message", "랭킹 제공 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return ResponseEntity.status(usable ? 200 : failed ? 503 : 202).body(body);
    }
    void refresh() {
        if (System.currentTimeMillis() < retryAt || !refreshing.compareAndSet(false, true)) return;
        try {
            JsonNode result = mapper.readTree(api.leaderboard());
            if (!result.isObject() || !result.path("topRanks").isArray() || (result.has("code") && result.path("code").asInt() != 200 && result.path("code").asInt() != 0)) throw new IllegalStateException("Invalid ranking response");
            snapshot = new Snapshot((ObjectNode) result, System.currentTimeMillis());
            failed = false;
            retryAt = System.currentTimeMillis() + 300_000;
        } catch (Exception error) {
            failed = true;
            retryAt = System.currentTimeMillis() + 30_000;
            org.slf4j.LoggerFactory.getLogger(getClass()).warn("Ranking refresh failed: {}", error.getClass().getSimpleName());
        } finally { refreshing.set(false); }
    }
    private record Snapshot(ObjectNode body, long updatedAt) {}
}
