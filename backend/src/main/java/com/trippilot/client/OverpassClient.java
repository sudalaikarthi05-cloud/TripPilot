package com.trippilot.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trippilot.exception.ExternalServiceException;
import com.trippilot.util.TextUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class OverpassClient {

    private static final Logger log = LoggerFactory.getLogger(OverpassClient.class);
    private static final List<String> ENDPOINTS = List.of(
            "https://overpass-api.de/api/interpreter",
            "https://overpass.kumi.systems/api/interpreter"
    );

    private final ExternalHttpClient http;
    private final ObjectMapper objectMapper;

    public OverpassClient(ExternalHttpClient http, ObjectMapper objectMapper) {
        this.http = http;
        this.objectMapper = objectMapper;
    }

    public List<SpotCandidate> nearby(double lat, double lng, double radiusMeters) {
        int radius = (int) Math.max(1000, Math.min(80000, radiusMeters));
        String query = buildQuery(lat, lng, radius);
        String formBody = "data=" + URLEncoder.encode(query, StandardCharsets.UTF_8);

        String response = null;
        RuntimeException lastFailure = null;
        for (String endpoint : ENDPOINTS) {
            try {
                response = http.postForm(endpoint, formBody, 1);
                break;
            } catch (RuntimeException ex) {
                lastFailure = ex;
                log.warn("Overpass endpoint {} failed: {}", endpoint, ex.getMessage());
            }
        }

        if (response == null) {
            throw lastFailure == null
                    ? new ExternalServiceException("Overpass request failed")
                    : lastFailure;
        }

        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode elements = root.path("elements");
            if (!elements.isArray()) {
                return List.of();
            }

            List<SpotCandidate> spots = new ArrayList<>();
            for (JsonNode element : elements) {
                SpotCandidate spot = toSpot(element, lat, lng);
                if (spot != null) {
                    spots.add(spot);
                }
            }
            return spots;
        } catch (Exception ex) {
            throw new ExternalServiceException("Could not read Overpass data", ex);
        }
    }

    private String buildQuery(double lat, double lng, int radius) {
        String around = "(around:" + radius + "," + lat + "," + lng + ")";
        return "[out:json][timeout:20];"
                + "("
                + "nwr" + around + "[\"tourism\"~\"^(attraction|museum|viewpoint|gallery|zoo|theme_park)$\"];"
                + "nwr" + around + "[\"historic\"];"
                + "nwr" + around + "[\"leisure\"~\"^(park|garden)$\"];"
                + "nwr" + around + "[\"natural\"~\"^(beach|waterfall|peak)$\"];"
                + "nwr" + around + "[\"amenity\"=\"place_of_worship\"];"
                + ");"
                + "out center tags 80;";
    }

    private SpotCandidate toSpot(JsonNode element, double centerLat, double centerLng) {
        JsonNode tags = element.path("tags");
        String name = TextUtils.cleanText(tags.path("name").asText(""));
        if (name.isBlank()) {
            name = TextUtils.cleanText(tags.path("name:en").asText(""));
        }
        if (name.isBlank()) {
            return null;
        }

        double lat = element.has("lat")
                ? element.path("lat").asDouble(Double.NaN)
                : element.path("center").path("lat").asDouble(Double.NaN);
        double lng = element.has("lon")
                ? element.path("lon").asDouble(Double.NaN)
                : element.path("center").path("lon").asDouble(Double.NaN);
        if (Double.isNaN(lat) || Double.isNaN(lng)) {
            return null;
        }

        String category = categoryFor(tags);
        if (category == null) {
            return null;
        }

        String description = firstNonBlank(
                tags.path("description:en").asText(null),
                tags.path("description").asText(null)
        );
        if (description != null) {
            description = TextUtils.truncateAtWord(description, 320);
        }

        String wikipediaUrl = wikipediaUrl(tags.path("wikipedia").asText(""));
        String wikidataId = emptyToNull(tags.path("wikidata").asText(""));
        String image = emptyToNull(tags.path("image").asText(""));
        if (image != null && !(image.startsWith("http://") || image.startsWith("https://"))) {
            image = null;
        }

        String type = element.path("type").asText("node");
        String elementId = element.path("id").asText("");
        String id = "osm-" + type + "-" + (elementId.isBlank() ? name.hashCode() : elementId);

        String openingHours = emptyToNull(tags.path("opening_hours").asText(""));
        String street = tags.path("addr:street").asText("");
        String housenumber = tags.path("addr:housenumber").asText("");
        String city = tags.path("addr:city").asText("");
        String address = null;
        if (!street.isBlank()) {
            address = (housenumber.isBlank() ? "" : housenumber + " ") + street + (city.isBlank() ? "" : ", " + city);
        }

        return new SpotCandidate(
                id,
                name,
                category,
                description,
                image,
                wikipediaUrl,
                wikidataId,
                lat,
                lng,
                TextUtils.haversineKm(centerLat, centerLng, lat, lng),
                false,
                openingHours,
                address
        );
    }

    private String categoryFor(JsonNode tags) {
        String natural = tags.path("natural").asText("").toLowerCase(Locale.ROOT);
        String leisure = tags.path("leisure").asText("").toLowerCase(Locale.ROOT);
        String tourism = tags.path("tourism").asText("").toLowerCase(Locale.ROOT);
        String historic = tags.path("historic").asText("").toLowerCase(Locale.ROOT);
        String amenity = tags.path("amenity").asText("").toLowerCase(Locale.ROOT);
        String religion = tags.path("religion").asText("").toLowerCase(Locale.ROOT);
        String building = tags.path("building").asText("").toLowerCase(Locale.ROOT);

        if ("beach".equals(natural)) {
            return "Beach";
        }
        if ("waterfall".equals(natural)) {
            return "Waterfall";
        }
        if ("peak".equals(natural)) {
            return "Mountain";
        }
        if ("park".equals(leisure) || "garden".equals(leisure)) {
            return "Park";
        }
        if ("place_of_worship".equals(amenity)) {
            return worshipCategory(religion, building);
        }
        if ("museum".equals(tourism) || "gallery".equals(tourism)) {
            return "Museum";
        }
        if ("viewpoint".equals(tourism)) {
            return "Viewpoint";
        }
        if ("zoo".equals(tourism)) {
            return "Wildlife";
        }
        if ("theme_park".equals(tourism)) {
            return "Park";
        }
        if (!historic.isBlank()) {
            return historicCategory(historic);
        }
        if ("attraction".equals(tourism)) {
            return "Attraction";
        }
        return null;
    }

    private String worshipCategory(String religion, String building) {
        if (religion.contains("muslim") || building.contains("mosque")) {
            return "Mosque";
        }
        if (religion.contains("christian") || building.contains("church") || building.contains("chapel")) {
            return "Church";
        }
        if (religion.contains("hindu") || religion.contains("buddhist") || religion.contains("jain")
                || building.contains("temple")) {
            return "Temple";
        }
        if (religion.contains("jewish") || building.contains("synagogue")) {
            return "Historic";
        }
        return "Temple";
    }

    private String historicCategory(String historic) {
        if (historic.contains("castle") || historic.contains("fort") || historic.contains("citywall")
                || historic.contains("city_gate")) {
            return "Fort";
        }
        if (historic.contains("palace") || historic.contains("manor")) {
            return "Palace";
        }
        if (historic.contains("church") || historic.contains("chapel")) {
            return "Church";
        }
        if (historic.contains("mosque")) {
            return "Mosque";
        }
        if (historic.contains("temple") || historic.contains("monastery")) {
            return "Temple";
        }
        return "Historic";
    }

    private String wikipediaUrl(String tag) {
        if (tag == null || tag.isBlank()) {
            return null;
        }
        String title;
        if (tag.startsWith("en:")) {
            title = tag.substring(3);
        } else if (tag.contains(":")) {
            return null;
        } else {
            title = tag;
        }
        title = title.trim();
        if (title.isBlank()) {
            return null;
        }
        return "https://en.wikipedia.org/wiki/"
                + URLEncoder.encode(title.replace(' ', '_'), StandardCharsets.UTF_8)
                .replace("+", "%20");
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
