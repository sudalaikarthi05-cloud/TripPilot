package com.trippilot.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trippilot.exception.ExternalServiceException;
import com.trippilot.util.TextUtils;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Component
public class NominatimClient {

    private static final String BASE_URL = "https://nominatim.openstreetmap.org/search";
    private static final long MIN_INTERVAL_MS = 1000L;

    private final ExternalHttpClient http;
    private final ObjectMapper objectMapper;
    private long lastRequestAt = 0L;

    public NominatimClient(ExternalHttpClient http, ObjectMapper objectMapper) {
        this.http = http;
        this.objectMapper = objectMapper;
    }

    public List<GeocodedPlace> search(String query, int limit) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        String url = BASE_URL
                + "?format=jsonv2&addressdetails=1&extratags=1&accept-language=en"
                + "&limit=" + Math.max(1, Math.min(limit, 10))
                + "&q=" + URLEncoder.encode(query.trim(), StandardCharsets.UTF_8);

        String body = rateLimitedGet(url);
        try {
            JsonNode root = objectMapper.readTree(body);
            if (!root.isArray()) {
                return List.of();
            }

            List<GeocodedPlace> places = new ArrayList<>();
            for (JsonNode node : root) {
                GeocodedPlace place = toPlace(node);
                if (place != null) {
                    places.add(place);
                }
            }
            return places;
        } catch (Exception ex) {
            throw new ExternalServiceException("Could not read location data", ex);
        }
    }

    public GeocodedPlace geocode(String query) {
        List<GeocodedPlace> results = search(query, 8);
        if (results.isEmpty()) {
            return null;
        }

        return results.stream()
                .max(Comparator.comparingDouble(place -> scoreMatch(query, place)))
                .orElse(results.get(0));
    }

    public boolean isConfident(String query, GeocodedPlace place) {
        if (place == null) {
            return false;
        }
        double similarity = TextUtils.similarity(query, place.name());
        if (similarity >= 0.86) {
            return true;
        }
        return similarity >= 0.70
                && (place.importance() >= 0.2 || (place.wikipediaTag() != null && !place.wikipediaTag().isBlank()));
    }

    public List<GeocodedPlace> rankedSuggestions(String query) {
        List<GeocodedPlace> results = new ArrayList<>(search(query, 8));
        results.sort(Comparator.comparingDouble((GeocodedPlace place) -> scoreMatch(query, place)).reversed());
        return results;
    }

    private double scoreMatch(String query, GeocodedPlace place) {
        double similarity = TextUtils.similarity(query, place.name());
        double score = similarity * 2.0 + Math.min(place.importance(), 1.0);
        if (place.wikipediaTag() != null && !place.wikipediaTag().isBlank()) {
            score += 0.5;
        }
        if (place.placeRank() <= 16) {
            score += 0.25;
        } else if (place.placeRank() > 20) {
            score -= 0.4;
        }
        return score;
    }

    private GeocodedPlace toPlace(JsonNode node) {
        try {
            double lat = Double.parseDouble(node.path("lat").asText());
            double lng = Double.parseDouble(node.path("lon").asText());
            String displayName = node.path("display_name").asText("");
            JsonNode address = node.path("address");

            String name = node.path("name").asText("");
            if (name.isBlank() && !displayName.isBlank()) {
                name = displayName.split(",")[0].trim();
            }
            if (name.isBlank()) {
                return null;
            }

            String region = firstNonBlank(
                    address.path("state").asText(null),
                    address.path("region").asText(null),
                    address.path("county").asText(null),
                    address.path("city").asText(null),
                    address.path("town").asText(null),
                    address.path("village").asText(null)
            );
            String country = address.path("country").asText("");
            String wikipedia = node.path("extratags").path("wikipedia").asText(null);
            String type = node.path("type").asText("");
            String addresstype = node.path("addresstype").asText("");
            int placeRank = node.path("place_rank").asInt(30);
            double importance = node.path("importance").asDouble(0);

            return new GeocodedPlace(name, displayName, region, country, lat, lng,
                    type, addresstype, placeRank, importance, wikipedia);
        } catch (Exception ex) {
            return null;
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private synchronized String rateLimitedGet(String url) {
        long now = System.currentTimeMillis();
        long wait = MIN_INTERVAL_MS - (now - lastRequestAt);
        if (wait > 0) {
            try {
                Thread.sleep(wait);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                throw new ExternalServiceException("Location lookup was interrupted", ex);
            }
        }
        try {
            return http.get(url, 2);
        } finally {
            lastRequestAt = System.currentTimeMillis();
        }
    }
}
