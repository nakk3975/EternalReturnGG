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
