package com.trippilot.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trippilot.client.GeocodedPlace;
import com.trippilot.client.NominatimClient;
import com.trippilot.client.OverpassClient;
import com.trippilot.client.SpotCandidate;
import com.trippilot.client.WikiSummary;
import com.trippilot.client.WikipediaClient;
import com.trippilot.dto.DiscoverPlace;
import com.trippilot.dto.DiscoverResponse;
import com.trippilot.dto.DiscoverSpot;
import com.trippilot.dto.DiscoverSuggestion;
import com.trippilot.exception.PlaceNotFoundException;
import com.trippilot.model.DiscoverCache;
import com.trippilot.repository.DiscoverCacheRepository;
import com.trippilot.util.TextUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Supplier;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class DiscoverService {

    private static final Logger log = LoggerFactory.getLogger(DiscoverService.class);
    private static final int MAX_SPOTS = 24;
    private static final int COMMONS_IMAGE_LIMIT = 12;
    private static final long CACHE_DAYS = 7;
    private static final String CACHE_VERSION = "v3";

    private static final Pattern LOCATION_PATTERN = Pattern.compile(
            "\\b(?:in|near|at|around|close to|within)\\s+(.+)$",
            Pattern.CASE_INSENSITIVE
    );

    private static final List<CategoryKeyword> CATEGORY_KEYWORDS = List.of(
            new CategoryKeyword(Pattern.compile("\\bbeach(?:es)?\\b", Pattern.CASE_INSENSITIVE), "Beach", "beaches"),
            new CategoryKeyword(Pattern.compile("\\btemples?\\b", Pattern.CASE_INSENSITIVE), "Temple", "temples"),
            new CategoryKeyword(Pattern.compile("\\bchurch(?:es)?\\b|\\bcathedrals?\\b", Pattern.CASE_INSENSITIVE), "Church", "churches"),
            new CategoryKeyword(Pattern.compile("\\bmosques?\\b", Pattern.CASE_INSENSITIVE), "Mosque", "mosques"),
            new CategoryKeyword(Pattern.compile("\\bmuseums?\\b", Pattern.CASE_INSENSITIVE), "Museum", "museums"),
            new CategoryKeyword(Pattern.compile("\\bwaterfalls?\\b", Pattern.CASE_INSENSITIVE), "Waterfall", "waterfalls"),
            new CategoryKeyword(Pattern.compile("\\bhill(?:s)?(?:\\s+stations?)?\\b", Pattern.CASE_INSENSITIVE), "Hill", "hills"),
            new CategoryKeyword(Pattern.compile("\\bmountains?\\b", Pattern.CASE_INSENSITIVE), "Mountain", "mountains"),
            new CategoryKeyword(Pattern.compile("\\bforts?\\b|\\bfortress(?:es)?\\b", Pattern.CASE_INSENSITIVE), "Fort", "forts"),
            new CategoryKeyword(Pattern.compile("\\bpalaces?\\b", Pattern.CASE_INSENSITIVE), "Palace", "palaces"),
            new CategoryKeyword(Pattern.compile("\\bparks?\\b|\\bgardens?\\b", Pattern.CASE_INSENSITIVE), "Park", "parks"),
            new CategoryKeyword(Pattern.compile("\\blakes?\\b", Pattern.CASE_INSENSITIVE), "Lake", "lakes"),
            new CategoryKeyword(Pattern.compile("\\bwildlife\\b|\\bsanctuar(?:y|ies)\\b", Pattern.CASE_INSENSITIVE), "Wildlife", "wildlife sanctuaries"),
            new CategoryKeyword(Pattern.compile("\\bview\\s*points?\\b|\\bviewpoints?\\b", Pattern.CASE_INSENSITIVE), "Viewpoint", "viewpoints"),
            new CategoryKeyword(Pattern.compile("\\bmarkets?\\b", Pattern.CASE_INSENSITIVE), "Market", "markets"),
            new CategoryKeyword(Pattern.compile("\\bhistoric\\b|\\bheritage\\b|\\bmonuments?\\b|\\barchaeological\\b", Pattern.CASE_INSENSITIVE), "Historic", "historic sites")
    );

    private static final ExecutorService EXECUTOR = Executors.newFixedThreadPool(8, runnable -> {
        Thread thread = new Thread(runnable, "discover-worker");
        thread.setDaemon(true);
        return thread;
    });

    private final NominatimClient nominatim;
    private final WikipediaClient wikipedia;
    private final OverpassClient overpass;
    private final DiscoverCacheRepository cacheRepository;
    private final ObjectMapper objectMapper;

    public DiscoverService(NominatimClient nominatim, WikipediaClient wikipedia,
                           OverpassClient overpass, DiscoverCacheRepository cacheRepository,
                           ObjectMapper objectMapper) {
        this.nominatim = nominatim;
        this.wikipedia = wikipedia;
        this.overpass = overpass;
        this.cacheRepository = cacheRepository;
        this.objectMapper = objectMapper;
    }

    public DiscoverResponse discover(String rawQuery) {
        String query = rawQuery == null ? "" : rawQuery.trim();
        if (query.length() < 2) {
            throw new IllegalArgumentException("Please enter a place or a short description.");
        }

        String cacheKey = TextUtils.normalize(CACHE_VERSION + " " + query);
        Optional<DiscoverResponse> cached = readCache(cacheKey);
        if (cached.isPresent()) {
            return cached.get();
        }

        ParsedQuery parsed = parse(query);
        GeocodedPlace place = locate(parsed.placeName());
        if (place == null) {
            throw new PlaceNotFoundException(
                    "We couldn't find that place. Try a different spelling or a nearby city.");
        }

        String summaryTitle = summaryTitle(place);
        CompletableFuture<WikiSummary> summaryFuture = async(
                "Wikipedia summary", () -> wikipedia.getSummary(summaryTitle), WikiSummary.empty());
        CompletableFuture<List<SpotCandidate>> geoFuture = async(
                "Wikipedia geosearch", () -> wikipedia.geoSearch(place), List.of());
        CompletableFuture<List<SpotCandidate>> overpassFuture = async(
                "Overpass search", () -> overpass.nearby(place.lat(), place.lng(),
                        place.searchRadiusMeters()), List.of());
        CompletableFuture<List<SpotCandidate>> categoryFuture = parsed.category() == null
                ? CompletableFuture.completedFuture(List.of())
                : async("Wikipedia category search",
                () -> wikipedia.searchCategory(parsed.category().canonical(),
                        parsed.category().searchTerm(), place),
                List.of());

        CompletableFuture.allOf(summaryFuture, geoFuture, overpassFuture, categoryFuture).join();

        List<SpotCandidate> candidates = new ArrayList<>();
        candidates.addAll(geoFuture.join());
        candidates.addAll(overpassFuture.join());
        candidates.addAll(categoryFuture.join());

        List<SpotCandidate> merged = mergeAndFilter(candidates, place, parsed.category());
        merged.sort(Comparator.comparingInt(SpotCandidate::rankScore).reversed()
                .thenComparingDouble(SpotCandidate::distanceKm));

        merged = enrichMissingImages(merged);

        merged.sort(Comparator.comparingInt(SpotCandidate::rankScore).reversed()
                .thenComparingDouble(SpotCandidate::distanceKm));

        List<SpotCandidate> limited = merged.stream().limit(MAX_SPOTS).toList();
        WikiSummary summary = summaryFuture.join();

        String placeImage = summary.image();
        if (placeImage == null) {
            placeImage = limited.stream()
                    .map(SpotCandidate::image)
                    .filter(image -> image != null && !image.isBlank())
                    .findFirst()
                    .orElse(null);
        }

        DiscoverPlace discoverPlace = new DiscoverPlace(
                place.name(),
                place.country(),
                place.lat(),
                place.lng(),
                summary.extract() == null ? "" : summary.extract(),
                placeImage
        );

        List<DiscoverSpot> spots = limited.stream()
                .map(this::toDto)
                .toList();

        DiscoverResponse response = new DiscoverResponse(discoverPlace, spots);
        writeCache(cacheKey, query, response);
        return response;
    }

    public List<DiscoverSuggestion> suggest(String rawQuery) {
        String query = rawQuery == null ? "" : rawQuery.trim();
        if (query.length() < 2) {
            return List.of();
        }

        List<GeocodedPlace> results = nominatim.rankedSuggestions(query);
        if (results.isEmpty() || !nominatim.isConfident(query, results.get(0))) {
            String corrected = wikipedia.suggestCorrection(query);
            if (corrected != null && !TextUtils.normalize(corrected).equals(TextUtils.normalize(query))) {
                List<GeocodedPlace> correctedResults = nominatim.rankedSuggestions(corrected);
                if (!correctedResults.isEmpty()) {
                    results = correctedResults;
                }
            }
        }

        List<DiscoverSuggestion> suggestions = new ArrayList<>();
        Map<String, Boolean> seen = new LinkedHashMap<>();
        for (GeocodedPlace place : results) {
            String key = TextUtils.normalize(place.name() + " " + place.region() + " " + place.country());
            if (key.isBlank() || seen.containsKey(key)) {
                continue;
            }
            seen.put(key, true);
            suggestions.add(new DiscoverSuggestion(place.name(), place.region(), place.country()));
            if (suggestions.size() >= 6) {
                break;
            }
        }
        return suggestions;
    }

    private GeocodedPlace locate(String placeName) {
        GeocodedPlace place = nominatim.geocode(placeName);
        if (place == null) {
            String corrected = wikipedia.suggestCorrection(placeName);
            if (corrected != null) {
                place = nominatim.geocode(corrected);
            }
            return place;
        }

        if (!nominatim.isConfident(placeName, place)) {
            String corrected = wikipedia.suggestCorrection(placeName);
            if (corrected != null && !TextUtils.normalize(corrected).equals(TextUtils.normalize(placeName))) {
                GeocodedPlace correctedPlace = nominatim.geocode(corrected);
                if (correctedPlace != null) {
                    return correctedPlace;
                }
            }
        }
        return place;
    }

    private String summaryTitle(GeocodedPlace place) {
        String wikipediaTag = place.wikipediaTag();
        if (wikipediaTag != null) {
            if (wikipediaTag.startsWith("en:")) {
                return wikipediaTag.substring(3);
            }
            if (!wikipediaTag.contains(":")) {
                return wikipediaTag;
            }
        }
        return place.name();
    }

    private ParsedQuery parse(String rawQuery) {
        String lower = rawQuery.toLowerCase(Locale.ROOT);
        DetectedCategory category = detectCategory(lower);

        Matcher matcher = LOCATION_PATTERN.matcher(rawQuery);
        String placeName;
        if (matcher.find()) {
            placeName = cleanPlaceName(matcher.group(1));
        } else {
            placeName = cleanPlaceName(rawQuery);
        }

        if (placeName.isBlank()) {
            placeName = cleanPlaceName(rawQuery);
        }
        return new ParsedQuery(rawQuery, placeName, category);
    }

    private DetectedCategory detectCategory(String query) {
        int bestIndex = Integer.MAX_VALUE;
        CategoryKeyword best = null;

        for (CategoryKeyword keyword : CATEGORY_KEYWORDS) {
            Matcher matcher = keyword.pattern().matcher(query);
            if (matcher.find() && matcher.start() < bestIndex) {
                bestIndex = matcher.start();
                best = keyword;
            }
        }

        return best == null ? null : new DetectedCategory(best.canonical(), best.searchTerm());
    }

    private String cleanPlaceName(String value) {
        if (value == null) {
            return "";
        }
        String cleaned = value
                .replaceAll("^[\\s,.;:!?'\"-]+", "")
                .replaceAll("[\\s,.;:!?'\"-]+$", "")
                .replaceAll("\\s+", " ")
                .trim();
        cleaned = cleaned.replaceAll("(?i)^(?:the|a|an)\\s+", "");
        return TextUtils.cleanText(cleaned);
    }

    private List<SpotCandidate> mergeAndFilter(List<SpotCandidate> candidates, GeocodedPlace place,
                                               DetectedCategory category) {
        Map<String, SpotCandidate> byName = new LinkedHashMap<>();
        double maxDistanceKm = place.searchRadiusMeters() / 1000.0;

        for (SpotCandidate candidate : candidates) {
            if (candidate == null || candidate.name() == null) {
                continue;
            }
            String name = TextUtils.cleanText(candidate.name());
            if (name.length() < 2 || isSamePlace(name, place.name())) {
                continue;
            }
            if (candidate.distanceKm() > maxDistanceKm) {
                continue;
            }
            if (category != null && !category.canonical().equalsIgnoreCase(candidate.category())) {
                continue;
            }

            String key = TextUtils.normalize(name);
            if (key.isBlank()) {
                continue;
            }

            SpotCandidate existing = byName.get(key);
            byName.put(key, existing == null ? candidate : merge(existing, candidate));
        }

        return new ArrayList<>(byName.values());
    }

    private boolean isSamePlace(String candidateName, String placeName) {
        String candidate = TextUtils.normalize(candidateName);
        String place = TextUtils.normalize(placeName);
        if (candidate.isBlank() || place.isBlank()) {
            return false;
        }
        return candidate.equals(place)
                || candidate.equals(place + " city")
                || place.equals(candidate + " city");
    }

    private SpotCandidate merge(SpotCandidate first, SpotCandidate second) {
        String image = firstNonBlank(first.image(), second.image());
        String wikipediaUrl = firstNonBlank(first.wikipediaUrl(), second.wikipediaUrl());
        String wikidataId = firstNonBlank(first.wikidataId(), second.wikidataId());
        String description = longer(first.description(), second.description());
        String category = betterCategory(first.category(), second.category());
        double distance = Math.min(first.distanceKm(), second.distanceKm());
        boolean categorySearchHit = first.categorySearchHit() || second.categorySearchHit();

        String openingHours = firstNonBlank(first.openingHours(), second.openingHours());
        String address = firstNonBlank(first.address(), second.address());

        return new SpotCandidate(first.id(), first.name(), category, description, image, wikipediaUrl,
                wikidataId, first.lat(), first.lng(), distance, categorySearchHit, openingHours, address);
    }

    private String betterCategory(String first, String second) {
        if (first == null || "Attraction".equalsIgnoreCase(first)) {
            return second == null ? first : second;
        }
        return first;
    }

    private List<SpotCandidate> enrichMissingImages(List<SpotCandidate> spots) {
        List<SpotCandidate> result = new ArrayList<>(spots);
        List<CompletableFuture<Void>> futures = new ArrayList<>();
        int attempted = 0;

        for (int i = 0; i < result.size() && attempted < COMMONS_IMAGE_LIMIT; i++) {
            SpotCandidate spot = result.get(i);
            if (spot.image() != null && !spot.image().isBlank()) {
                continue;
            }
            attempted++;
            int index = i;
            futures.add(CompletableFuture.runAsync(() -> {
                String image = wikipedia.findCommonsImage(spot.name());
                if (image != null && !image.isBlank()) {
                    result.set(index, result.get(index).withImage(image));
                }
            }, EXECUTOR));
        }

        CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();
        return result;
    }

    private DiscoverSpot toDto(SpotCandidate spot) {
        String description = spot.description();
        if (description == null || description.isBlank()) {
            description = null;
        }

        return new DiscoverSpot(
                spot.id(),
                spot.name(),
                spot.category(),
                description,
                spot.image(),
                spot.lat(),
                spot.lng(),
                Math.round(spot.distanceKm() * 10.0) / 10.0,
                spot.wikipediaUrl(),
                spot.openingHours(),
                spot.address()
        );
    }

    private <T> CompletableFuture<T> async(String label, Supplier<T> supplier, T fallback) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return supplier.get();
            } catch (Exception ex) {
                log.warn("{} failed: {}", label, ex.getMessage());
                return fallback;
            }
        }, EXECUTOR);
    }

    private Optional<DiscoverResponse> readCache(String key) {
        try {
            if (key.isBlank()) {
                return Optional.empty();
            }
            Optional<DiscoverCache> cached = cacheRepository.findById(key);
            if (cached.isEmpty()) {
                return Optional.empty();
            }
            DiscoverCache entry = cached.get();
            if (entry.getExpiresAt() == null || entry.getExpiresAt().before(new Date())) {
                return Optional.empty();
            }
            return Optional.of(objectMapper.readValue(entry.getPayload(), DiscoverResponse.class));
        } catch (Exception ex) {
            log.warn("Discover cache read failed: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    private void writeCache(String key, String query, DiscoverResponse response) {
        try {
            DiscoverCache entry = new DiscoverCache();
            entry.setKey(key);
            entry.setPayload(objectMapper.writeValueAsString(response));
            entry.setCreatedAt(new Date());
            entry.setExpiresAt(new Date(System.currentTimeMillis() + CACHE_DAYS * 24 * 60 * 60 * 1000L));
            cacheRepository.save(entry);
        } catch (Exception ex) {
            log.warn("Discover cache write failed for '{}': {}", query, ex.getMessage());
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String longer(String first, String second) {
        if (first == null) {
            return second;
        }
        if (second == null) {
            return first;
        }
        return second.length() > first.length() ? second : first;
    }

    private record ParsedQuery(String raw, String placeName, DetectedCategory category) {
    }

    private record DetectedCategory(String canonical, String searchTerm) {
    }

    private record CategoryKeyword(Pattern pattern, String canonical, String searchTerm) {
    }
}
