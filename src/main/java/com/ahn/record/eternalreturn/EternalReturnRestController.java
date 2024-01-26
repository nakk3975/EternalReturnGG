package com.ahn.record.eternalreturn;

import java.io.IOException;
import java.net.URISyntaxException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
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
	
	@GetMapping("/main")
	public String mainCharater() throws URISyntaxException {
		return erBo.searchAllRoute();
	}

	@GetMapping("/search/nickname")
	public String searchNickname(@RequestParam("nickname") String nickName) throws URISyntaxException, IOException {
		return erBo.searchNickname(nickName);
	}
	
	@GetMapping("/character")
	public String characterInfo() throws URISyntaxException {
		return erBo.searchCharacter();
	}
	
	@GetMapping("/weapon/info")
	public String weaponInfo() throws URISyntaxException {
		return erBo.searchWeapon();
	}
	
	@GetMapping("/user/detail")
	public String userDetail(@RequestParam("userNum") int userNum) throws URISyntaxException {
		return erBo.userInfo(userNum);
	}
	
	@GetMapping("/skin/info")
	public String skinInfo() throws URISyntaxException {
		return erBo.characterSkin();
	}
	
	@GetMapping("/loadTextFile")
	public ResponseEntity<Resource> characterName() throws IOException {
		return erBo.loadTextFile();
	}
   
}
