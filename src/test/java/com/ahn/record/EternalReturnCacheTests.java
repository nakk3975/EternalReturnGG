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
    void refreshReplacesOldSnapshotAndSharesRapidRepeat() throws Exception {
        EternalReturnBO bo=new EternalReturnBO();
        try {
            ReflectionTestUtils.setField(bo,"apiValue","test-key");
            MockRestServiceServer mock=MockRestServiceServer.bindTo((RestTemplate)ReflectionTestUtils.getField(bo,"restTemplate")).build();
            String path="/v1/user/games/uid/player";
            mock.expect(requestTo("https://open-api.bser.io"+path)).andRespond(withSuccess("{\"userGames\":[{\"gameId\":1}]}",MediaType.APPLICATION_JSON));
            mock.expect(requestTo("https://open-api.bser.io"+path)).andRespond(withSuccess("{\"userGames\":[{\"gameId\":2}]}",MediaType.APPLICATION_JSON));
            String first=bo.playerSnapshot("player",null,false);
            assertTrue(first.contains("_fetchedAt"));
            var cache=(java.util.Map<?,?>)ReflectionTestUtils.getField(bo,"responseCache");
            ReflectionTestUtils.setField(cache.get(path),"expiresAt",System.currentTimeMillis()+24000);
            String refreshed=bo.playerSnapshot("player",null,true);
            assertTrue(refreshed.contains("\"gameId\":2"));
            assertEquals(refreshed,bo.playerSnapshot("player",null,true));
            assertEquals(refreshed,bo.playerSnapshot("player",null,false));
            mock.verify();
        } finally {bo.shutdownPrefetchExecutor();}
    }
    @Test
    void derivedSkillsReuseTheSameCatalogUntilLocalizationChanges() throws Exception {
        EternalReturnBO bo=new EternalReturnBO();
        try {
            ReflectionTestUtils.setField(bo,"localizationBody","Skill/Group/Name/1001000┃첫 스킬".getBytes(StandardCharsets.UTF_8));
            ReflectionTestUtils.setField(bo,"localizationExpiresAt",System.currentTimeMillis()+60000);
            String first=bo.skillInfo();
            assertSame(first,bo.skillInfo());
            ReflectionTestUtils.setField(bo,"localizationBody","Skill/Group/Name/1001000┃변경된 스킬".getBytes(StandardCharsets.UTF_8));
            assertNotEquals(first,bo.skillInfo());
            assertTrue(bo.skillInfo().contains("변경된 스킬"));
        } finally { bo.shutdownPrefetchExecutor(); }
    }

    @Test
    void localizationDownloadsOnceAndReturnsNamesAndSkillDescriptions() throws Exception {
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
            assertTrue(names.contains("Skill/Description/1┃긴 설명"));
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
    @Test
    void recentGamePagesHaveSeparateCacheKeys() throws Exception {
        EternalReturnBO bo = new EternalReturnBO();
        try {
            ReflectionTestUtils.setField(bo, "apiValue", "test-key");
            MockRestServiceServer mock = MockRestServiceServer.bindTo((RestTemplate) ReflectionTestUtils.getField(bo, "restTemplate")).build();
            mock.expect(requestTo("https://open-api.bser.io/v1/user/games/uid/player"))
                .andRespond(withSuccess("{\"userGames\":[{\"gameId\":123}],\"next\":123}", MediaType.APPLICATION_JSON));
            mock.expect(requestTo("https://open-api.bser.io/v1/user/games/uid/player?next=123"))
                .andRespond(withSuccess("{\"userGames\":[{\"gameId\":122}]}", MediaType.APPLICATION_JSON));
            String first = bo.userInfo("player");
            String second = bo.userInfo("player", 123L);
            assertNotEquals(first, second);
            assertEquals(second, bo.userInfo("player", 123L));
            assertEquals(first, bo.userInfo("player"));
            mock.verify();
        } finally { bo.shutdownPrefetchExecutor(); }
    }
}
