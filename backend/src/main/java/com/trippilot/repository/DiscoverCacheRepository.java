package com.trippilot.repository;

import com.trippilot.model.DiscoverCache;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface DiscoverCacheRepository extends MongoRepository<DiscoverCache, String> {
}
