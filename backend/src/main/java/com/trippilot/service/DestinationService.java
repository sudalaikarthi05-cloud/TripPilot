package com.trippilot.service;

import com.trippilot.model.Destination;
import com.trippilot.repository.DestinationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DestinationService {

    private final DestinationRepository repo;

    public DestinationService(DestinationRepository repo) {
        this.repo = repo;
    }

    public List<Destination> findAll() {
        return repo.findAll();
    }

    public Optional<Destination> findById(String id) {
        return repo.findById(id);
    }

    public Optional<Destination> findBySlug(String slug) {
        return repo.findBySlug(slug);
    }

    public Destination save(Destination dest) {
        return repo.save(dest);
    }
}

