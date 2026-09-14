package com.ahn.record.eternalreturn.bo;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SeasonSkinTests {
    private final ObjectMapper json=new ObjectMapper();
    @Test void countsOnlyTargetSeasonAndDeduplicatesCheckpointPages() throws Exception {
        SeasonSkinService.State state=new SeasonSkinService.State();
        String first="{\"userGames\":[{\"gameId\":10,\"seasonId\":41,\"characterNum\":1,\"skinCode\":1005},{\"gameId\":9,\"seasonId\":41,\"characterNum\":1,\"skinCode\":1005}],\"next\":8}";
        assertFalse(SeasonSkinService.apply(state,json.readTree(first),41));
        state=json.readValue(json.writeValueAsString(state),SeasonSkinService.State.class);
        assertTrue(SeasonSkinService.apply(state,json.readTree("{\"userGames\":[{\"gameId\":9,\"seasonId\":41,\"characterNum\":1,\"skinCode\":1005},{\"gameId\":8,\"seasonId\":41,\"characterNum\":1,\"skinCode\":1000},{\"gameId\":7,\"seasonId\":40,\"characterNum\":1,\"skinCode\":1000}],\"next\":6}"),41));
        assertEquals(3,state.seen.size());
        assertEquals(1005,SeasonSkinService.bestSkin(state,1));
        assertEquals(2,state.counts.get("1:1005"));
        assertNull(state.cursor);
    }
    @Test void incrementalRefreshStopsAtKnownGameWithoutDoubleCounting() throws Exception {
        SeasonSkinService.State state=new SeasonSkinService.State();
        state.complete=true;state.seen.add(10L);state.counts.put("1:1005",1);
        assertTrue(SeasonSkinService.apply(state,json.readTree("{\"userGames\":[{\"gameId\":11,\"seasonId\":41,\"characterNum\":1,\"skinCode\":1005},{\"gameId\":10,\"seasonId\":41,\"characterNum\":1,\"skinCode\":1005}],\"next\":9}"),41));
        assertEquals(2,state.counts.get("1:1005"));
    }
    @Test void repeatedCursorDoesNotFalselyCompleteSeason() throws Exception {
        SeasonSkinService.State state=new SeasonSkinService.State();state.cursor=10L;
        assertThrows(IllegalStateException.class,()->SeasonSkinService.apply(state,json.readTree("{\"userGames\":[{\"gameId\":12,\"seasonId\":41,\"characterNum\":1,\"skinCode\":1000}],\"next\":10}"),41));
        assertFalse(state.complete);
    }
    @Test void characterMetricsDeduplicateAndExcludeOtherModesAndSeasons() throws Exception {
        var state=new SeasonSkinService.State();
        var page=json.readTree("""
            {"userGames":[
              {"gameId":11,"seasonId":41,"matchingMode":3,"characterNum":1,"skinCode":1000,"playerKill":4,"teamKill":10,"damageToPlayer":15000,"mmrGain":25},
              {"gameId":10,"seasonId":41,"matchingMode":3,"characterNum":1,"skinCode":1000,"playerKill":0,"teamKill":2,"damageToPlayer":5000,"mmrBefore":100,"mmrAfter":90},
              {"gameId":9,"seasonId":41,"matchingMode":2,"characterNum":1,"skinCode":1000,"playerKill":100,"mmrGain":999}
            ],"next":8}
            """);
        SeasonSkinService.apply(state,page,41);
        state=json.readValue(json.writeValueAsString(state),SeasonSkinService.State.class);
        SeasonSkinService.apply(state,json.readTree("""
            {"userGames":[{"gameId":11,"seasonId":41,"matchingMode":3,"characterNum":1,"skinCode":1000,"mmrGain":25}],"next":7}
            """),41);
        var m=state.characterMetrics.get("1");
        assertEquals(2,m.games);assertEquals(4,m.kills);assertEquals(12,m.teamKills);
        assertEquals(20000,m.damage);assertEquals(15,m.rp);assertEquals(2,m.rpGames);
        SeasonSkinService.apply(state,json.readTree("""
            {"userGames":[{"gameId":7,"seasonId":41,"matchingMode":3,"characterNum":2,"skinCode":2000},{"gameId":6,"seasonId":40,"matchingMode":3,"characterNum":2,"skinCode":2000}],"next":0}
            """),41);
        assertEquals(1,state.characterMetrics.get("2").games);
        assertEquals(0,state.characterMetrics.get("2").killGames);
        assertEquals(0,state.characterMetrics.get("2").rpGames);
    }
}
