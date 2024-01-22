package com.ahn.record.eternalreturn;

import java.io.IOException;
import java.net.URISyntaxException;

import org.springframework.beans.factory.annotation.Autowired;
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
	public String mainCharater() throws IOException, URISyntaxException {
		return erBo.searchAllRoute();
	}

	@GetMapping("/search/nickname")
	public String searchNickname(@RequestParam("nickname") String nickName) throws IOException, URISyntaxException {
		return erBo.searchNickname(nickName);
	}
	
	@GetMapping("/character")
	public String characterInfo(@RequestParam("characterCode") int characterCode) throws IOException, URISyntaxException {
		return erBo.searchCharacter(characterCode);
	}
	
	@GetMapping("/weapon/info")
	public String weaponInfo(@RequestParam("weaponCodes") int weaponCodes) throws IOException, URISyntaxException {
		return erBo.searchWeapon(weaponCodes);
	}
}
