package com.trippilot.config;

import com.trippilot.model.Trip.TripDestination;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MongoConfigTest {

    @Test
    void convertsLegacyStringDestinationToDestinationSummary() {
        TripDestination destination = new MongoConfig.LegacyStringToTripDestinationConverter()
                .convert("Kochi, India");

        assertEquals("Kochi, India", destination.getName());
        assertNull(destination.getCountry());
    }

    @Test
    void convertsLegacyBudgetRangeUsingItsMaximum() {
        double budget = new MongoConfig.LegacyBudgetDocumentConverter()
                .convert(new Document("min", 5000).append("max", 10000).append("currency", "INR"));

        assertEquals(10000, budget);
    }

    @Test
    void registersLegacyDocumentReadConverters() {
        MongoCustomConversions conversions = new MongoConfig().mongoCustomConversions();

        assertTrue(conversions.hasCustomReadTarget(String.class, TripDestination.class));
        assertTrue(conversions.hasCustomReadTarget(Document.class, Double.class));
    }
}
