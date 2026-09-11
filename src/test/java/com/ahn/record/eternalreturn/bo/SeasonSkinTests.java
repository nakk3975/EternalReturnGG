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
}
