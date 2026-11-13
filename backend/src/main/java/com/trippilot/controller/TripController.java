package com.trippilot.controller;

import com.trippilot.dto.TripRequest;
import com.trippilot.model.Trip;
import com.trippilot.service.ItineraryGenerator;
import com.trippilot.service.TripService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final TripService tripService;
    private final ItineraryGenerator generator;

    public TripController(TripService tripService, ItineraryGenerator generator) {
        this.tripService = tripService;
        this.generator = generator;
    }

    /** Generate an itinerary (does NOT auto-save) */
    @PostMapping("/generate")
    public ResponseEntity<Trip> generate(@Valid @RequestBody TripRequest request) {
        Trip trip = generator.generate(request);
        return ResponseEntity.ok(trip);
    }

    /** Save a trip */
    @PostMapping
    public ResponseEntity<Trip> save(@Valid @RequestBody Trip trip) {
        Trip saved = tripService.save(trip);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /** Get all saved trips */
    @GetMapping
    public List<Trip> getAll() {
        return tripService.findAll();
    }

    /** Get a saved trip by ID */
    @GetMapping("/{id}")
    public ResponseEntity<Trip> getById(@PathVariable String id) {
        return tripService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Update a saved trip */
    @PutMapping("/{id}")
    public ResponseEntity<Trip> update(@PathVariable String id, @Valid @RequestBody Trip trip) {
        Trip updated = tripService.update(id, trip);
        return ResponseEntity.ok(updated);
    }

    /** Delete a saved trip */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        tripService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

