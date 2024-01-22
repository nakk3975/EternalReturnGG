package com.ahn.record.eternalreturn.bo;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class EternalReturnBO {

	private final String apiKey = "x-api-key";
    private final String apiValue = "Z3NP8HwkfB9L6Pqjjh3b12l0bzBDsNnuNsxhEQj4";
    private final String acceptHeader = "application/json";
    private final String apiUrl = "https://open-api.bser.io/v1";

    public String searchNickname(String nickName) throws IOException, URISyntaxException {

        String apiEndpoint = apiUrl + "/user/nickname";
        String queryParam = "query=" + URLEncoder.encode(nickName, StandardCharsets.UTF_8.toString());
        String requestUrl = apiEndpoint + "?" + queryParam;

        URI uri = new URI(requestUrl);

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set(apiKey, apiValue);
        headers.set(HttpHeaders.ACCEPT, acceptHeader);
        headers.set("metaType", "hash");

        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<String> responseEntity = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);
        String response = responseEntity.getBody();

        return response;
    }

    public String searchAllRoute() throws IOException, URISyntaxException {

        String apiEndpoint = apiUrl + "/weaponRoutes/recommend";
        String requestUrl = apiEndpoint;

        URI uri = new URI(requestUrl);

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set(apiKey, apiValue);
        headers.set(HttpHeaders.ACCEPT, acceptHeader);
        
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<String> responseEntity = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);
        String response = responseEntity.getBody();

        return response;
    }
    
    public String searchCharacter(int characterCode) throws IOException, URISyntaxException {
        String apiEndpoint = apiUrl + "/data/Character";
        String requestUrl = apiEndpoint;

        URI uri = new URI(requestUrl);

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set(apiKey, apiValue);
        headers.set(HttpHeaders.ACCEPT, acceptHeader);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<String> responseEntity = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);
        String response = responseEntity.getBody();

        // JSON 파싱
        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode rootNode = objectMapper.readTree(response);
        // 여기서 특정 "code" 값에 해당하는 데이터를 추출
        JsonNode dataArray = rootNode.get("data");
        if (dataArray.isArray()) {
            // 전달받은 characterCode와 "code" 값을 비교하여 해당하는 데이터 추출
            for (JsonNode characterNode : dataArray) {
                int code = characterNode.get("code").asInt();
                if (code == characterCode) {
                    return characterNode.toString();
                }
            }
        }
        return null; // 특정 "code" 값에 해당하는 데이터를 찾지 못한 경우
    }
    
    public String searchWeapon(int weaponCodes) throws IOException, URISyntaxException {

        String apiEndpoint = apiUrl + "/data/ItemWeapon";
        String requestUrl = apiEndpoint;

        URI uri = new URI(requestUrl);

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set(apiKey, apiValue);
        headers.set(HttpHeaders.ACCEPT, acceptHeader);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<String> responseEntity = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);
        String response = responseEntity.getBody();

        // JSON 파싱
        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode rootNode = objectMapper.readTree(response);
        // 여기서 특정 "code" 값에 해당하는 데이터를 추출
        JsonNode dataArray = rootNode.get("data");
        if (dataArray.isArray()) {
            // 전달받은 characterCode와 "code" 값을 비교하여 해당하는 데이터 추출
            for (JsonNode weaponNode : dataArray) {
                int code = weaponNode.get("code").asInt();
                if (code == weaponCodes) {
                    return weaponNode.toString();
                }
            }
        }
        return null; // 특정 "code" 값에 해당하는 데이터를 찾지 못한 경우
    }
}
