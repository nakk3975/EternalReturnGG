package com.ahn.record;

import com.ahn.record.eternalreturn.bo.EternalReturnBO;
import com.ahn.record.eternalreturn.bo.PersistentApiCache;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.MediaType;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class PersistentCacheTests {
    @Test void projectionsAreCachedSeparatelyAndRejectUnknownScopes() throws Exception {
        var cache=new PersistentApiCache();
        try {
            ReflectionTestUtils.setField(cache,"url","https://cache.test");
            ReflectionTestUtils.setField(cache,"token","test");
            var server=MockRestServiceServer.bindTo((RestTemplate)ReflectionTestUtils.getField(cache,"client")).build();
            server.expect(requestTo("https://cache.test"))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.content().json("{\"scope\":\"items\",\"character\":0}"))
                .andRespond(withSuccess("{\"body\":{\"rows\":[],\"items\":[1]}}",MediaType.APPLICATION_JSON));
            server.expect(requestTo("https://cache.test"))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.content().json("{\"scope\":\"character\",\"character\":35}"))
                .andRespond(withSuccess("{\"body\":{\"rows\":[],\"builds\":[35]}}",MediaType.APPLICATION_JSON));
            var items=cache.statistics("items",0);
            assertSame(items,cache.statistics("items",0));
            var character=cache.statistics("character",35);
            assertEquals(35,character.path("builds").get(0).asInt());
            assertSame(character,cache.statistics("character",35));
            assertThrows(IllegalArgumentException.class,()->cache.statistics("unknown",0));
            server.verify();
        } finally {cache.stopStatisticsWarmup();}
    }
    @Test void expiredStatisticsDoNotWaitForADatabaseRefresh() throws Exception {
        var cache=new PersistentApiCache();
        var entered=new java.util.concurrent.CountDownLatch(1);
        var release=new java.util.concurrent.CountDownLatch(1);
        try {
            ReflectionTestUtils.setField(cache,"url","https://cache.test");
            ReflectionTestUtils.setField(cache,"token","test");
            var old=new com.fasterxml.jackson.databind.ObjectMapper().readTree("{\"rows\":[{\"games\":1}]}");
            ReflectionTestUtils.setField(cache,"statistics",old);
            ReflectionTestUtils.setField(cache,"statisticsExpires",System.currentTimeMillis()-1000);
            var server=MockRestServiceServer.bindTo((RestTemplate)ReflectionTestUtils.getField(cache,"client")).build();
            server.expect(requestTo("https://cache.test")).andRespond(request->{
                entered.countDown();
                try { release.await(3,java.util.concurrent.TimeUnit.SECONDS); }catch(InterruptedException e){Thread.currentThread().interrupt();}
                return withSuccess("{\"body\":{\"rows\":[{\"games\":2}]}}",MediaType.APPLICATION_JSON).createResponse(request);
            });
            assertTrue(cache.statistics().path("_cacheStale").asBoolean());
            assertTrue(entered.await(1,java.util.concurrent.TimeUnit.SECONDS));
            assertEquals(1,cache.statistics().path("rows").get(0).path("games").asInt());
            assertFalse(old.has("_cacheStale"));
        } finally {release.countDown();cache.stopStatisticsWarmup();}
    }
    @Test void storedPageSurvivesEmptyMemoryCache() throws Exception {
        EternalReturnBO bo=new EternalReturnBO();
        try {
            PersistentApiCache cache=mock(PersistentApiCache.class);
            ReflectionTestUtils.setField(bo,"persistentCache",cache);
            String path="/v1/user/games/uid/player";
            when(cache.read(path)).thenReturn(new PersistentApiCache.Snapshot("{\"userGames\":[]}",System.currentTimeMillis()+60000));
            assertEquals("{\"userGames\":[]}",bo.userInfo("player"));
            assertEquals("{\"userGames\":[]}",bo.userInfo("player"));
            verify(cache,times(1)).read(path);
        } finally { bo.shutdownPrefetchExecutor(); }
    }
    @Test void staleSnapshotReturnsThenRefreshesInBackground() throws Exception {
        EternalReturnBO bo=new EternalReturnBO();
        try {
            PersistentApiCache cache=mock(PersistentApiCache.class);
            ReflectionTestUtils.setField(bo,"persistentCache",cache);
            ReflectionTestUtils.setField(bo,"apiValue","test");
            String path="/v1/user/games/uid/player";
            when(cache.read(path)).thenReturn(new PersistentApiCache.Snapshot("{\"userGames\":[{\"gameId\":1}]}",0));
            MockRestServiceServer api=MockRestServiceServer.bindTo((RestTemplate)ReflectionTestUtils.getField(bo,"restTemplate")).build();
            api.expect(requestTo("https://open-api.bser.io"+path)).andRespond(withSuccess("{\"userGames\":[{\"gameId\":2}]}",MediaType.APPLICATION_JSON));
            assertTrue(bo.userInfo("player").contains("\"_cacheStale\":true"));
            verify(cache,timeout(2000)).write(eq(path),any(),eq(30000L));
            assertTrue(bo.userInfo("player").contains("\"gameId\":2"));
            api.verify();
        } finally { bo.shutdownPrefetchExecutor(); }
    }
    @Test void databaseMissFallsBackToOfficialApi() throws Exception {
        EternalReturnBO bo=new EternalReturnBO();
        try {
            ReflectionTestUtils.setField(bo,"persistentCache",mock(PersistentApiCache.class));
            ReflectionTestUtils.setField(bo,"apiValue","test");
            MockRestServiceServer api=MockRestServiceServer.bindTo((RestTemplate)ReflectionTestUtils.getField(bo,"restTemplate")).build();
            api.expect(requestTo("https://open-api.bser.io/v1/user/games/uid/player"))
                .andRespond(withSuccess("{\"userGames\":[]}",MediaType.APPLICATION_JSON));
            assertEquals("{\"userGames\":[]}",bo.userInfo("player"));
            api.verify();
        } finally { bo.shutdownPrefetchExecutor(); }
    }
}
