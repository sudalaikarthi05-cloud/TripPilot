package com.trippilot.service;

import com.trippilot.model.TouristPlace;
import com.trippilot.repository.PlaceRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PlaceService {

    private final PlaceRepository repo;

    public PlaceService(PlaceRepository repo) {
        this.repo = repo;
    }

    public List<TouristPlace> findAll() {
        return repo.findAll();
    }

    public List<TouristPlace> findByDestinationId(String destinationId) {
        return repo.findByDestinationId(destinationId);
    }

    public Optional<TouristPlace> findById(String id) {
        return repo.findById(id);
    }
}

