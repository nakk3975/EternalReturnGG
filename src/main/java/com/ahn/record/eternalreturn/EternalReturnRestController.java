package com.ahn.record.eternalreturn;

import java.io.IOException;
import java.net.URISyntaxException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ahn.record.eternalreturn.bo.EternalReturnBO;

@RequestMapping("/er")
@RestController
public class EternalReturnRestController {
	
	@Autowired
	private EternalReturnBO erBo;

	@Autowired
	private com.ahn.record.eternalreturn.bo.LeaderboardService rankings;
	
	@GetMapping("/main")
	public String mainCharater() throws URISyntaxException {
		return erBo.searchAllRoute();
	}

	@GetMapping("/leaderboard/data")
	public ResponseEntity<com.fasterxml.jackson.databind.JsonNode> leaderboard() {
		return rankings.get();
	}

	@GetMapping("/search/nickname")
	public String searchNickname(@RequestParam("nickname") String nickName) throws URISyntaxException, IOException {
		return erBo.searchNickname(nickName);
	}
	
	@GetMapping("/character")
	public String characterInfo() throws URISyntaxException {
		return erBo.searchCharacter();
	}
	
    @GetMapping("/weapon-types")
    public String weaponTypes() throws URISyntaxException { return erBo.weaponTypes(); }

	@GetMapping("/weapon")
	public String weaponInfo() throws URISyntaxException {
		return erBo.searchWeapon();
	}
	
	@GetMapping("/armor")
	public String armorInfo() throws URISyntaxException {
		return erBo.searchArmor();
	}
	
	@GetMapping("/user/detail")
	public String userDetail(@RequestParam("userNum") String userId,
            @RequestParam(value = "next", required = false) Long next) throws URISyntaxException {
		return erBo.userInfo(userId, next);
	}
	
    @Autowired private com.ahn.record.eternalreturn.bo.SeasonSkinService seasonSkins;

    @GetMapping("/user/season-skin")
    public ResponseEntity<?> seasonSkin(@RequestParam("userNum") String userId,
            @RequestParam("season") int season, @RequestParam("character") int character) throws URISyntaxException {
        if(season != erBo.getCurrentSeasonId())return ResponseEntity.badRequest().body(java.util.Map.of("error","Current season only"));
        try { return ResponseEntity.ok().cacheControl(org.springframework.http.CacheControl.noStore()).body(seasonSkins.get(userId,season,character)); }
        catch(IllegalArgumentException e){return ResponseEntity.badRequest().body(java.util.Map.of("error","Invalid parameters"));}
    }

	@GetMapping("/skin/info")
	public String skinInfo() throws URISyntaxException {
		return erBo.characterSkin();
	}
	
	@GetMapping("/loadTextFile")
	public ResponseEntity<byte[]> characterName() throws IOException, URISyntaxException {
		return erBo.loadTextFile();
	}
	
	@GetMapping("/tacticalSkill")
	public String tacticalSkill() throws URISyntaxException {
		return erBo.tacticalSkill();
	}
	
    @GetMapping("/route-data/{table}")
    public String routeData(@org.springframework.web.bind.annotation.PathVariable("table") String table) throws URISyntaxException {
        return erBo.routeData(table);
    }

    @GetMapping("/materials")
    public String materials() throws URISyntaxException {return erBo.materials();}

	@GetMapping("/skillInfo")
	public String skillInfo() throws IOException, URISyntaxException {
		return erBo.skillInfo();
	}
	
    @GetMapping("/meta/hash")
    public String metaHash() throws URISyntaxException {
        return erBo.metaHash();
    }

	@GetMapping("/trait")
	public String traitSkill() throws URISyntaxException {
		return erBo.traitSkill();
	}
	
    @GetMapping("/seasons")
    public String seasons() throws URISyntaxException {return erBo.seasons();}
	@GetMapping("/userRank")
	public String userRank(@RequestParam("userNum") String userId, @RequestParam(value="season",required=false) Integer season) throws URISyntaxException {
		return season==null?erBo.userRank(userId):erBo.userRank(userId,season);
	}
	
	@GetMapping("/game")
	public String gameRecord(@RequestParam("gameId") int gameId) throws IOException, URISyntaxException {
		return erBo.searchGame(gameId);
	}
   
}
