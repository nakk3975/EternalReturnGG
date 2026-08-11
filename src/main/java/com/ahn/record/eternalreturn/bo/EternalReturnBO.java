package com.ahn.record.eternalreturn.bo;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

@Service
public class EternalReturnBO {

    private static final String API_KEY_HEADER = "x-api-key";
    private static final String ACCEPT_HEADER = "application/json";
    private static final String API_URL = "https://open-api.bser.io";

    @Value("${eternal-return.api-key:}")
    private String apiValue;

    private final RestTemplate restTemplate = new RestTemplate();

    public String searchGame(int gameId) throws IOException, URISyntaxException {
        return request("/v1/games/" + gameId, true);
    }
    
    public String searchNickname(String nickName) throws IOException, URISyntaxException {
        String queryParam = "query=" + URLEncoder.encode(nickName, StandardCharsets.UTF_8.toString());
        return request("/v1/user/nickname?" + queryParam, true);
    }

    public String searchAllRoute() throws URISyntaxException {
        return request("/v1/weaponRoutes/recommend", false);
    }
    
    public String searchCharacter() throws URISyntaxException {
        return request("/v2/data/Character", false);
    }
    
    public String searchArmor() throws URISyntaxException {
        return request("/v2/data/ItemArmor", false);
    }
    
    public String searchWeapon() throws URISyntaxException {
        return request("/v2/data/ItemWeapon", false);
    }
    
    public String userInfo(int userNum) throws URISyntaxException {
        return request("/v1/user/games/" + userNum, false);
    }
  
    public String tacticalSkill() throws URISyntaxException {
        return request("/v2/data/TacticalSkillSetGroup", false);
    }
    
    public String characterSkin() throws URISyntaxException {
        return request("/v2/data/CharacterSkin", false);
    }
    
    public String skillInfo() throws URISyntaxException {
        return request("/v1/data/SkillGroup", false);
    }
    
    public String traitSkill() throws URISyntaxException {
        return request("/v2/data/Trait", false);
    }
    
    public String userRank(int userNum) throws URISyntaxException {
        return request("/v1/user/stats/" + userNum + "/21", false);
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
    
    // 텍스트 파일 불러오기
    public ResponseEntity<Resource> loadTextFile() throws IOException {
        Resource resource = new ClassPathResource("static/text/l10n-Korean-20240124065525.txt");

        if(!resource.exists()) {
            throw new IOException("Localization text resource not found.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "plain", StandardCharsets.UTF_8));
        headers.setContentDispositionFormData("attachment", "l10n-Korean-20240124065525.txt");

        return ResponseEntity.ok()
                .headers(headers)
                .body(resource);
    }
}
