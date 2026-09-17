package com.ahn.record.eternalreturn;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/er")
public class EternalReturnController {

	@GetMapping({"/characters", "/characters/{name}", "/items", "/items/{code}", "/routes", "/leaderboard", "/guide", "/favorites", "/multi", "/statistics", "/route-planner", "/animal-map"})
	public String explorerView(HttpServletRequest request, Model model) {
        String path = request.getServletPath();
        model.addAttribute("explorerMenu", path.split("/")[2]);
		return "main/explorer";
	}
	
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
