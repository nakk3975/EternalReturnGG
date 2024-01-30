package com.ahn.record.eternalreturn.bo;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
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

    public String searchAllRoute() throws URISyntaxException {

        String apiEndpoint = apiUrl + "/v1/weaponRoutes/recommend";
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
    
    public String searchCharacter() throws URISyntaxException {
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
    
    public String searchArmor() throws URISyntaxException {
    	String apiEndpoint = apiUrl + "/v2/data/ItemArmor";
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
    
    public String searchWeapon() throws URISyntaxException {
    	String apiEndpoint = apiUrl + "/v2/data/ItemWeapon";
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
    
    public String userInfo(int userNum) throws URISyntaxException {

        String apiEndpoint = apiUrl + "/v1/user/games/" + userNum;
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
  
    public String tacticalSkill() throws URISyntaxException {
    	String apiEndpoint = apiUrl + "/v2/data/TacticalSkillSetGroup";
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
    
    public String characterSkin() throws URISyntaxException {
	        String apiEndpoint = apiUrl + "/v2/data/CharacterSkin";
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
    
    public String skillInfo() throws URISyntaxException {
    	String apiEndpoint = apiUrl + "/v1/data/SkillGroup";
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
    
    public String traitSkill() throws URISyntaxException {
    	String apiEndpoint = apiUrl + "/v2/data/Trait";
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
    
    // 텍스트 파일 불러오기
    public ResponseEntity<Resource> loadTextFile() throws IOException {
    	Path filePath = Paths.get("src/main/resources/static/text/l10n-Korean-20240124065525.txt");

        // Resource 객체를 생성하여 파일을 읽어옴
        Resource resource = new UrlResource(filePath.toUri());

        // 파일의 내용을 읽어오기 위한 Content-Type 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "plain", StandardCharsets.UTF_8));

        // 파일 다운로드를 위한 Content-Disposition 설정
        headers.setContentDispositionFormData("attachment", "l10n-Korean-20240124065525.txt");

        return ResponseEntity.ok()
                .headers(headers)
                .body(resource);
    }
}
