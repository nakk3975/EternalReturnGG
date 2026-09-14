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
    @GetMapping("/er/statistics/collection")
    public java.util.Map<String,Object> collection() throws java.io.IOException {
        var saved=cache.read("/v2/data/collector-state");
        if(saved==null)return java.util.Map.of("status","starting");
        var row=new com.fasterxml.jackson.databind.ObjectMapper().readTree(saved.body());
        return java.util.Map.of("status",row.path("status").asText(),"collectedToday",row.path("collectedToday").asInt(),
            "lastSuccess",row.path("lastSuccess").asText(),"players",row.path("players").size(),"pending",row.path("pending").size());
    }
    @GetMapping("/er/statistics/data")
    public JsonNode statistics(@RequestParam(defaultValue="overview") String scope,
            @RequestParam(defaultValue="0") int character){
        if(character<0 || character>10000 || !java.util.Set.of("overview","items","character").contains(scope))
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,"Invalid statistics scope");
        return cache.statistics(character>0?"character":scope,character);
    }
}
