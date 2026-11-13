package com.trippilot.config;

import com.trippilot.model.Trip.TripDestination;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.bson.Document;

import java.util.List;

@Configuration
public class MongoConfig {

    @Bean
    MongoCustomConversions mongoCustomConversions() {
        return new MongoCustomConversions(List.of(
                new LegacyStringToTripDestinationConverter(),
                new LegacyBudgetDocumentConverter()
        ));
    }

    @ReadingConverter
    static class LegacyStringToTripDestinationConverter implements Converter<String, TripDestination> {
        @Override
        public TripDestination convert(String source) {
            TripDestination destination = new TripDestination();
            destination.setName(source);
            return destination;
        }
    }

    @ReadingConverter
    static class LegacyBudgetDocumentConverter implements Converter<Document, Double> {
        @Override
        public Double convert(Document source) {
            Number budget = source.get("max", Number.class);
            if (budget == null) {
                budget = source.get("min", Number.class);
            }
            if (budget == null) {
                throw new IllegalArgumentException("Legacy trip budget must contain a numeric max or min.");
            }
            return budget.doubleValue();
        }
    }
}
