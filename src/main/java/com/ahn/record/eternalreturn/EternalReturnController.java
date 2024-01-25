package com.ahn.record.eternalreturn;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/er")
public class EternalReturnController {
	
	@GetMapping("/search/view")
	public String mainView() {
		return "main/main";
	}
	
	@GetMapping("/detail/view")
	public String detailView() {
		return "main/detail";
	}
	
	@GetMapping("/user/detail/view")
	public String userView() {
		return "main/usersearch";
	}
	
}
