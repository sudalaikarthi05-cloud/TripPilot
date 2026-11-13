package com.trippilot.repository;

import com.trippilot.model.TouristPlace;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PlaceRepository extends MongoRepository<TouristPlace, String> {
    List<TouristPlace> findByDestinationId(String destinationId);
}

