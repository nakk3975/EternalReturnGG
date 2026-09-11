package com.ahn.record;

import com.ahn.record.eternalreturn.bo.EternalReturnBO;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import java.nio.charset.StandardCharsets;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class EternalReturnCacheTests {
    @Test
    void localizationDownloadsOnceAndOnlyReturnsNames() throws Exception {
        EternalReturnBO bo = new EternalReturnBO();
        try {
            ReflectionTestUtils.setField(bo, "apiValue", "test-key");
            RestTemplate client = (RestTemplate) ReflectionTestUtils.getField(bo, "restTemplate");
            MockRestServiceServer mock = MockRestServiceServer.bindTo(client).build();
            mock.expect(requestTo("https://open-api.bser.io/v1/l10n/Korean"))
                .andRespond(withSuccess("{\"data\":{\"l10Path\":\"https://example.test/names\"}}", MediaType.APPLICATION_JSON));
            mock.expect(requestTo("https://example.test/names"))
                .andRespond(withSuccess("Character/Name/1┃재키\nItem/Name/1┃검\nSkill/Description/1┃긴 설명", new MediaType("text", "plain", StandardCharsets.UTF_8)));
            byte[] first = bo.loadTextFile().getBody();
            assertArrayEquals(first, bo.loadTextFile().getBody());
            String names = new String(first, StandardCharsets.UTF_8);
            assertTrue(names.contains("재키"));
            assertTrue(names.contains("Item/Name/1"));
            assertFalse(names.contains("Skill/Description"));
            mock.verify();
        } finally { bo.shutdownPrefetchExecutor(); }
    }

    @Test
    void repeatedGameLookupUsesCache() throws Exception {
        EternalReturnBO bo = new EternalReturnBO();
        try {
            ReflectionTestUtils.setField(bo, "apiValue", "test-key");
            MockRestServiceServer mock = MockRestServiceServer.bindTo((RestTemplate) ReflectionTestUtils.getField(bo, "restTemplate")).build();
            mock.expect(requestTo("https://open-api.bser.io/v1/games/123"))
                .andRespond(withSuccess("{\"userGames\":[]}", MediaType.APPLICATION_JSON));
            assertEquals(bo.searchGame(123), bo.searchGame(123));
            mock.verify();
        } finally { bo.shutdownPrefetchExecutor(); }
    }
}
