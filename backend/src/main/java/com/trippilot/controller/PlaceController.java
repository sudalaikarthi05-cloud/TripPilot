package com.trippilot.controller;

import com.trippilot.model.TouristPlace;
import com.trippilot.service.PlaceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/places")
public class PlaceController {

    private final PlaceService service;

    public PlaceController(PlaceService service) {
        this.service = service;
    }

    @GetMapping
    public List<TouristPlace> getAll(@RequestParam(required = false) String destinationId) {
        if (destinationId != null && !destinationId.isBlank()) {
            return service.findByDestinationId(destinationId);
        }
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TouristPlace> getById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

