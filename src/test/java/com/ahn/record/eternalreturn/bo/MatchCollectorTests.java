package com.ahn.record.eternalreturn.bo;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import static org.junit.jupiter.api.Assertions.*;
class MatchCollectorTests {
    @Test void idleTicksWriteOnlyChangedStateAndRetryFailedWrites() {
        var cache=org.mockito.Mockito.mock(PersistentApiCache.class);
        var collector=new MatchCollector(org.mockito.Mockito.mock(EternalReturnBO.class),cache);
        var state=new MatchCollector.State();
        state.day=java.time.LocalDate.now(java.time.ZoneId.of("Asia/Seoul")).toString();
        state.collectedToday=200;
        org.springframework.test.util.ReflectionTestUtils.setField(collector,"dailyLimit",200);
        org.springframework.test.util.ReflectionTestUtils.setField(collector,"state",state);
        try {
            collector.tick();collector.tick();collector.tick();
            org.mockito.Mockito.verify(cache,org.mockito.Mockito.times(1)).writeChecked(org.mockito.Mockito.eq(MatchCollector.KEY),org.mockito.Mockito.any(),org.mockito.Mockito.eq(86400000L));
            state.lastSuccess="changed";collector.tick();
            org.mockito.Mockito.verify(cache,org.mockito.Mockito.times(2)).writeChecked(org.mockito.Mockito.eq(MatchCollector.KEY),org.mockito.Mockito.any(),org.mockito.Mockito.eq(86400000L));
            org.mockito.Mockito.doThrow(new IllegalStateException("offline")).doNothing().when(cache).writeChecked(org.mockito.Mockito.eq(MatchCollector.KEY),org.mockito.Mockito.any(),org.mockito.Mockito.eq(86400000L));
            state.lastSuccess="retry";
            assertThrows(IllegalStateException.class,()->org.springframework.test.util.ReflectionTestUtils.invokeMethod(collector,"checkpoint"));
            org.springframework.test.util.ReflectionTestUtils.invokeMethod(collector,"checkpoint");
            org.mockito.Mockito.verify(cache,org.mockito.Mockito.times(4)).writeChecked(org.mockito.Mockito.eq(MatchCollector.KEY),org.mockito.Mockito.any(),org.mockito.Mockito.eq(86400000L));
        } finally {collector.stop();}
    }

    @Test void deduplicatesAndRejectsOldFutureAndInvalidDates() throws Exception {
        var json=new ObjectMapper();var s=new MatchCollector.State();s.seen.add(1);
        var page=json.readTree("{\"userGames\":[{\"gameId\":1,\"startDtm\":\"2026-09-11T09:00:00.055+0900\"},{\"gameId\":2,\"startDtm\":\"2026-09-11T09:00:00.055+0900\"},{\"gameId\":2,\"startDtm\":\"2026-09-11T09:00:00.055+0900\"},{\"gameId\":3,\"startDtm\":\"2026-01-01T00:00:00Z\"},{\"gameId\":4,\"startDtm\":\"2027-01-01T00:00:00Z\"},{\"gameId\":5}]}");
        MatchCollector.enqueue(s,page,Instant.parse("2026-09-12T00:00:00Z").toEpochMilli());
        assertEquals(java.util.Set.of(2),s.pending);
        s=json.readValue(json.writeValueAsString(s),MatchCollector.State.class);
        assertTrue(s.seen.contains(1));assertTrue(s.pending.contains(2));
    }
    @Test void boundedPlayerFrontierPreservesPagination() {
        var s=new MatchCollector.State();MatchCollector.addPlayer(s,"player");s.players.get("player").cursor=12L;
        MatchCollector.addPlayer(s,"player");assertEquals(12L,s.players.get("player").cursor);
        for(int i=0;i<1000;i++)MatchCollector.addPlayer(s,"user"+i);
        assertEquals(300,s.players.size());
    }
}
