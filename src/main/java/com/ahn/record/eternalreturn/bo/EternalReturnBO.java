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

@Service
public class EternalReturnBO {

	private final String apiKey = "x-api-key";
    private final String apiValue = "Z3NP8HwkfB9L6Pqjjh3b12l0bzBDsNnuNsxhEQj4";
    private final String acceptHeader = "application/json";
    private final String apiUrl = "https://open-api.bser.io";

    public String searchNickname(String nickName) throws IOException, URISyntaxException {

        String apiEndpoint = apiUrl + "/v1/user/nickname";
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

        String apiEndpoint = apiUrl + "/v1/weaponRoutes/recommend?next=1";
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
    
    public String searchCharacter() throws IOException, URISyntaxException {
        String apiEndpoint = apiUrl + "/v2/data/Character";
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
    
    public String searchWeapon() throws IOException, URISyntaxException {

        String apiEndpoint = apiUrl + "/v2/data/WeaponTypeInfo";
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
}
