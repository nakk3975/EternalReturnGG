package com.ahn.record.eternalreturn.bo;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LeaderboardServiceTests {
    @Test void pendingRankingDoesNotBlockHttpResponse() throws Exception {
        EternalReturnBO api = mock(EternalReturnBO.class);
        CountDownLatch entered = new CountDownLatch(1), release = new CountDownLatch(1);
        when(api.leaderboard()).thenAnswer(call -> { entered.countDown(); release.await(3, TimeUnit.SECONDS); return "{\"topRanks\":[]}"; });
        LeaderboardService service = new LeaderboardService(api);
        try {
            assertEquals(202, service.get().getStatusCode().value());
            assertTrue(entered.await(1, TimeUnit.SECONDS));
            assertEquals(202, service.get().getStatusCode().value());
            verify(api, times(1)).leaderboard();
        } finally { release.countDown(); service.stop(); }
    }
    @Test void malformedRefreshKeepsLastGoodRanking() throws Exception {
        EternalReturnBO api = mock(EternalReturnBO.class);
        when(api.leaderboard()).thenReturn("{\"topRanks\":[{\"nickname\":\"test\",\"rank\":1,\"mmr\":1000}]}", "{\"code\":500}");
        LeaderboardService service = new LeaderboardService(api);
        try {
            service.refresh();
            ReflectionTestUtils.setField(service, "retryAt", 0L);
            service.refresh();
            assertEquals(200, service.get().getStatusCode().value());
            assertEquals("test", service.get().getBody().path("topRanks").get(0).path("nickname").asText());
            assertTrue(service.get().getBody().path("refreshFailed").asBoolean());
        } finally { service.stop(); }
    }
}
