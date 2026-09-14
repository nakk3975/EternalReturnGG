package com.ahn.record.eternalreturn;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;
import java.util.Set;

/** Browser caching applies only to successful public catalog responses, never player data. */
@RestControllerAdvice(assignableTypes = EternalReturnRestController.class)
public class CatalogCacheHeaders implements ResponseBodyAdvice<Object> {
    private static final Set<String> METHODS = Set.of("characterInfo", "weaponTypes", "weaponInfo", "armorInfo",
        "skinInfo", "tacticalSkill", "materials", "skillInfo", "traitSkill", "seasons", "routeData", "mainCharater");
    private final ObjectMapper json = new ObjectMapper();
    public boolean supports(MethodParameter method, Class<? extends HttpMessageConverter<?>> converter) {
        return method.getMethod()!=null && METHODS.contains(method.getMethod().getName());
    }
    public Object beforeBodyWrite(Object body, MethodParameter method, MediaType type,
            Class<? extends HttpMessageConverter<?>> converter, ServerHttpRequest request, ServerHttpResponse response) {
        try {
            var data=json.readTree((String)body);
            int code=data.path("code").asInt(200);
            if((code==0 || code==200) && (data.path("data").isArray() || data.path("result").isArray())) {
                // Stale server snapshots must be revalidated, not promoted into a fresh browser entry.
                response.getHeaders().setCacheControl(data.path("_cacheStale").asBoolean()
                    ? "no-cache" : "public, max-age=300");
            }
        } catch(Exception ignored) { /* Errors and unknown response shapes are not cached. */ }
        return body;
    }
}
