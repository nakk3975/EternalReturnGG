package com.ahn.record.eternalreturn.bo;

import com.fasterxml.jackson.databind.*;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;

/** One background API operation per tick. Checkpoints contain no API credentials. */
@Service
public class MatchCollector {
    static final String KEY="/v2/data/collector-state";
    private final EternalReturnBO api;
    private final PersistentApiCache cache;
    private final ObjectMapper json=new ObjectMapper();
    private final ScheduledExecutorService worker=Executors.newSingleThreadScheduledExecutor();
    @Value("${ER_COLLECTOR_ENABLED:true}") private boolean enabled;
    @Value("${ER_COLLECTOR_DAILY_LIMIT:200}") private int dailyLimit;
    private State state;
    public MatchCollector(EternalReturnBO api,PersistentApiCache cache){this.api=api;this.cache=cache;}
    @EventListener(ApplicationReadyEvent.class) public void start(){if(enabled)worker.scheduleWithFixedDelay(this::tick,15,20,TimeUnit.SECONDS);}
    @PreDestroy public void stop(){worker.shutdownNow();}
    public static class Player {public String uid="";public Long cursor;public long due;}
    public static class State {
        public LinkedHashMap<String,Player> players=new LinkedHashMap<>();
        public LinkedHashSet<Integer> pending=new LinkedHashSet<>(),seen=new LinkedHashSet<>();
        public String day="",status="starting",lastSuccess="";
        public int collectedToday,failures;public long retryAt,seededAt;
    }
    synchronized void tick(){
        try{
            if(state==null){var saved=cache.read(KEY);state=saved==null?new State():json.readValue(saved.body(),State.class);}
            long now=System.currentTimeMillis();if(now<state.retryAt)return;
            String day=LocalDate.now(ZoneId.of("Asia/Seoul")).toString();
            if(!day.equals(state.day)){state.day=day;state.collectedToday=0;}
            if(state.collectedToday>=Math.max(1,dailyLimit)){state.status="daily_limit";checkpoint();return;}
            // Existing searched players seed a broader sample than the leaderboard alone.
            if(state.players.isEmpty()){
                var seeds=cache.read("/v2/data/collector-seeds");
                if(seeds!=null)for(JsonNode n:json.readTree(seeds.body()).path("nicknames"))addPlayer(state,n.asText());
                if(state.players.isEmpty())for(JsonNode n:json.readTree(api.leaderboard()).path("topRanks")){addPlayer(state,n.path("nickname").asText());if(state.players.size()>=30)break;}
                state.seededAt=now;checkpoint();return;
            }
            if(!state.pending.isEmpty()){
                int id=state.pending.iterator().next();JsonNode game=json.readTree(api.searchGame(id));
                if(!game.path("userGames").isArray()||game.path("userGames").isEmpty())throw new IllegalStateException("Missing game response");
                // A confirmed write is required before advancing the durable cursor.
                cache.writeChecked("/v1/games/"+id,game,86400000);
                for(JsonNode p:game.path("userGames"))addPlayer(state,p.path("nickname").asText());
                state.pending.remove(id);state.seen.add(id);while(state.seen.size()>20000)state.seen.remove(state.seen.iterator().next());
                state.collectedToday++;state.lastSuccess=Instant.now().toString();
            }else{
                var entry=state.players.entrySet().stream().filter(e->e.getValue().due<=now).findFirst().orElse(null);
                if(entry==null){state.status="waiting";checkpoint();return;}
                String nickname=entry.getKey();Player p=entry.getValue();
                if(p.uid.isEmpty()){
                    JsonNode user=json.readTree(api.searchNickname(nickname)).path("user");
                    p.uid=user.path("userId").asText(user.path("uid").asText(""));
                    if(p.uid.isEmpty())p.due=now+86400000;
                }else{
                    JsonNode page=json.readTree(api.userInfo(p.uid,p.cursor));
                    if(!page.path("userGames").isArray())throw new IllegalStateException("Missing history response");
                    enqueue(state,page,now);
                    Long next=page.path("next").canConvertToLong()&&page.path("next").asLong()>0?page.path("next").asLong():null;
                    if(Objects.equals(next,p.cursor))next=null;
                    p.cursor=next;p.due=now+(next==null?1800000:0);
                    state.players.remove(nickname);state.players.put(nickname,p);
                }
            }
            state.status="collecting";state.failures=0;checkpoint();
        }catch(Exception error){
            if(state!=null){state.failures++;
                if(state.failures%3==0){
                    if(!state.pending.isEmpty()){int id=state.pending.iterator().next();state.pending.remove(id);state.pending.add(id);}
                    else if(!state.players.isEmpty()){var e=state.players.entrySet().iterator().next();String n=e.getKey();Player p=e.getValue();p.uid="";p.due=System.currentTimeMillis()+3600000;state.players.remove(n);state.players.put(n,p);}
                }
                state.status="retrying";state.retryAt=System.currentTimeMillis()+Math.min(900000,30000L*(1L<<Math.min(5,state.failures)));try{checkpoint();}catch(Exception ignored){}}
        }
    }
    static void addPlayer(State s,String nickname){if(nickname!=null&&!nickname.isBlank()&&nickname.length()<=64&&s.players.size()<300)s.players.putIfAbsent(nickname,new Player());}
    static void enqueue(State s,JsonNode page,long now){
        for(JsonNode row:page.path("userGames")){
            int id=row.path("gameId").asInt();long started;
            try{started=Instant.parse(row.path("startDtm").asText().replaceFirst("([+-]\\d{2})(\\d{2})$", "$1:$2")).toEpochMilli();}catch(Exception e){continue;}
            if(id>0&&started<=now&&started>=now-90L*86400000&&!s.seen.contains(id)&&s.pending.size()<2000)s.pending.add(id);
        }
    }
    private void checkpoint(){cache.writeChecked(KEY,json.valueToTree(state),86400000);}
}
