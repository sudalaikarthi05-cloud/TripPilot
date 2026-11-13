package com.trippilot.controller;

import com.trippilot.dto.DiscoverResponse;
import com.trippilot.dto.DiscoverSuggestion;
import com.trippilot.service.DiscoverService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/discover")
public class DiscoverController {

    private final DiscoverService discoverService;

    public DiscoverController(DiscoverService discoverService) {
        this.discoverService = discoverService;
    }

    @GetMapping
    public DiscoverResponse discover(@RequestParam("q") String query) {
        return discoverService.discover(query);
    }

    @GetMapping("/suggest")
    public List<DiscoverSuggestion> suggest(@RequestParam("q") String query) {
        return discoverService.suggest(query);
    }
}
