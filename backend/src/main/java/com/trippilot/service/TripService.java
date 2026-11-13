package com.trippilot.service;

import com.trippilot.exception.TripNotFoundException;
import com.trippilot.model.Trip;
import com.trippilot.repository.TripRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TripService {

    private final TripRepository repo;

    public TripService(TripRepository repo) {
        this.repo = repo;
    }

    public List<Trip> findAll() {
        return repo.findAll();
    }

    public Optional<Trip> findById(String id) {
        return repo.findById(id);
    }

    public Trip save(Trip trip) {
        if (trip.getCreatedAt() == null) {
            trip.setCreatedAt(java.time.Instant.now().toString());
        }
        return repo.save(trip);
    }

    public Trip update(String id, Trip updated) {
        return repo.findById(id).map(existing -> {
            updated.setId(id);
            if (updated.getCreatedAt() == null) {
                updated.setCreatedAt(existing.getCreatedAt());
            }
            return repo.save(updated);
        }).orElseThrow(() -> new TripNotFoundException("Trip not found: " + id));
    }

    public void delete(String id) {
        if (!repo.existsById(id)) {
            throw new TripNotFoundException("Trip not found: " + id);
        }
        repo.deleteById(id);
    }
}

