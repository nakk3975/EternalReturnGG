package com.ahn.record.eternalreturn;

import java.time.Duration;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
public class AssetController {
    private static final String CDN = "https://cdn.dak.gg/assets/er/game-assets/";
    private static final Pattern VERSION = Pattern.compile("game-assets/(\\d+\\.\\d+\\.\\d+)/");
    // Last observed working version; used only if discovery is unavailable.
    private String version = "12.3.0";
    private long refreshAt;
    @Value("${eternal-return.asset-version:}")
    private String override;
    private final RestTemplate client;

    public AssetController() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(3000);
        client = new RestTemplate(factory);
    }

    @GetMapping("/er/assets/config")
    public synchronized Map<String, String> config() {
        if (override != null && override.matches("\\d+\\.\\d+\\.\\d+")) {
            return Map.of("baseUrl", CDN + override + "/");
        }
        long now = System.currentTimeMillis();
        if (now >= refreshAt) {
            refreshAt = now + Duration.ofMinutes(5).toMillis();
            try {
                String html = client.getForObject("https://dak.gg/er/characters/Tazia", String.class);
                Matcher matcher = VERSION.matcher(html == null ? "" : html);
                if (matcher.find()) {
                    version = matcher.group(1);
                    refreshAt = now + Duration.ofHours(6).toMillis();
                }
            } catch (RuntimeException ignored) {
                // Keep the last known version and retry later; never block page rendering indefinitely.
            }
        }
        return Map.of("baseUrl", CDN + version + "/");
    }
}
