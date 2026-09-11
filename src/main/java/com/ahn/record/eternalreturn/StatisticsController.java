package com.ahn.record.eternalreturn;
import com.ahn.record.eternalreturn.bo.PersistentApiCache;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.bind.annotation.*;
@RestController
public class StatisticsController {
    private final PersistentApiCache cache;
    public StatisticsController(PersistentApiCache cache){this.cache=cache;}
    @GetMapping("/er/user/rp-history")
    public String rpHistory(@RequestParam String userNum){
        if(!userNum.matches("[A-Za-z0-9_-]{1,200}"))throw new IllegalArgumentException("Invalid player");
        var snapshot=cache.read("/v2/user/rp-summary/"+userNum);
        return snapshot==null?"{\"userGames\":[]}":snapshot.body();
    }
    @GetMapping("/er/statistics/data")
    public JsonNode statistics(){return cache.statistics();}
}
