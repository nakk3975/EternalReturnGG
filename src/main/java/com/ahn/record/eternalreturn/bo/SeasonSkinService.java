package com.ahn.record.eternalreturn.bo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.*;

/** Incremental season scan, separate from latency-sensitive player requests. */
@Service
public class SeasonSkinService {
    private final EternalReturnBO api;
    private final PersistentApiCache store;
    private final ObjectMapper json=new ObjectMapper();
    private final Map<String,State> states=new ConcurrentHashMap<>();
    private final Set<String> running=ConcurrentHashMap.newKeySet();
    private final ScheduledExecutorService worker=Executors.newSingleThreadScheduledExecutor();
    public SeasonSkinService(EternalReturnBO api,PersistentApiCache store){this.api=api;this.store=store;}
    @PreDestroy public void stop(){worker.shutdownNow();}
    public Map<String,Object> get(String user,int season,int character) {
        if(user==null || !user.matches("[A-Za-z0-9_-]{1,160}") || season<=0 || character<=0)
            throw new IllegalArgumentException("Invalid skin lookup");
        String key="/v2/user/skin-summary/"+user+"/"+season;
        State state=states.get(key);
        if(state==null){
            if(states.size()>=100)return Map.of("status","busy");
            State created=new State();
            State existing=states.putIfAbsent(key,created);state=existing==null?created:existing;
        }
        State current=state;
        synchronized(current){
            if(!running.contains(key) && System.currentTimeMillis()>=current.retryAt && running.add(key)) {
                worker.execute(()->loadAndScan(key,user,season,current));
            }
            int skin=bestSkin(current,character);
            return Map.of("status",current.complete?"complete":current.incomplete?"incomplete":"collecting","skinCode",skin,
                    "games",current.seen.size(),"uses",current.counts.getOrDefault(character+":"+skin,0));
        }
    }
    private void loadAndScan(String key,String user,int season,State state){
        try {
            if(!state.loaded){
                PersistentApiCache.Snapshot saved=store.read(key);
                synchronized(state){
                    if(saved!=null){
                        State old=json.readValue(saved.body(),State.class);
                        state.seen=old.seen;state.counts=old.counts;state.cursor=old.cursor;
                        state.complete=old.complete;state.retryAt=old.retryAt;
                        state.rankGames=old.rankGames;state.expectedRankGames=old.expectedRankGames;
                        state.missingSkin=old.missingSkin;state.incomplete=old.incomplete;
                    }
                    state.loaded=true;
                    if(state.complete && state.retryAt>System.currentTimeMillis()){running.remove(key);return;}
                }
            }
            JsonNode stats=json.readTree(api.userRank(user)).path("userStats");
            if(stats.isArray())for(JsonNode row:stats)if(row.path("seasonId").asInt()==season)
                state.expectedRankGames=Math.max(state.expectedRankGames,row.path("totalGames").asInt());
            scan(key,user,season,state,0);
        } catch(Exception e){fail(key,state);}
    }
    private void scan(String key,String user,int season,State state,int pages){
        try {
            Long cursor; synchronized(state){cursor=state.cursor;}
            JsonNode page=json.readTree(api.userInfo(user,cursor));
            if(page.path("_cacheStale").asBoolean() || !page.path("userGames").isArray())throw new IllegalStateException("Page not ready");
            boolean done;
            synchronized(state){done=apply(state,page,season);}
            if(done || pages%5==4)save(key,state);
            if(done){running.remove(key);return;}
            // A bounded batch prevents endless scans on malformed cursors or huge histories.
            if(pages>=499){save(key,state);fail(key,state);return;}
            worker.schedule(()->scan(key,user,season,state,pages+1),750,TimeUnit.MILLISECONDS);
        } catch(Exception e){save(key,state);fail(key,state);}
    }
    static boolean apply(State state,JsonNode page,int season){
        boolean boundary=false,known=false;
        for(JsonNode row:page.path("userGames")){
            int rowSeason=row.path("seasonId").asInt(-1);
            if(rowSeason>0 && rowSeason<season){boundary=true;continue;}
            if(rowSeason!=season || !row.hasNonNull("gameId"))continue;
            long id=row.path("gameId").asLong();
            if(state.seen.contains(id)){if(state.complete)known=true;continue;}
            if(!row.hasNonNull("characterNum") || !row.hasNonNull("skinCode")){state.missingSkin=true;continue;}
            state.seen.add(id);
            if(row.path("matchingMode").asInt()==3)state.rankGames++;
            String key=row.path("characterNum").asInt()+":"+row.path("skinCode").asInt();
            state.counts.merge(key,1,Integer::sum);
        }
        long next=page.path("next").asLong(0);
        boolean end=boundary || known || page.path("userGames").isEmpty() || next<=0;
        if(!end && Objects.equals(state.cursor,next))throw new IllegalStateException("Repeated cursor");
        state.cursor=end?null:next;
        if(end){state.incomplete=state.missingSkin || state.rankGames<state.expectedRankGames;state.complete=!state.incomplete;state.retryAt=System.currentTimeMillis()+300_000;}
        return end;
    }
    static int bestSkin(State state,int character){
        return state.counts.entrySet().stream().filter(e->e.getKey().startsWith(character+":"))
            .sorted(Comparator.<Map.Entry<String,Integer>>comparingInt(Map.Entry::getValue).reversed()
                .thenComparingInt(e->Integer.parseInt(e.getKey().split(":")[1])))
            .map(e->Integer.parseInt(e.getKey().split(":")[1])).findFirst().orElse(0);
    }
    private void save(String key,State state){
        JsonNode body;synchronized(state){body=json.valueToTree(state);}store.write(key,body,300_000);
    }
    private void fail(String key,State state){synchronized(state){state.retryAt=System.currentTimeMillis()+10_000;}running.remove(key);}
    public static class State {
        public Set<Long> seen=new HashSet<>();
        public Map<String,Integer> counts=new HashMap<>();
        public Long cursor;
        public boolean complete;
        public boolean incomplete,missingSkin;
        public int rankGames,expectedRankGames;
        public boolean loaded;
        public long retryAt;
    }
}
