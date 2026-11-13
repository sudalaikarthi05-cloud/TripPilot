package com.trippilot.repository;

import com.trippilot.model.Destination;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface DestinationRepository extends MongoRepository<Destination, String> {
    Optional<Destination> findBySlug(String slug);
}

