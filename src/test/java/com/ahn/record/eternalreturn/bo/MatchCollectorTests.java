package com.ahn.record.eternalreturn.bo;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import static org.junit.jupiter.api.Assertions.*;
class MatchCollectorTests {
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
