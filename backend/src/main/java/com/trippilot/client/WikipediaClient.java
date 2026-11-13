package com.trippilot.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trippilot.util.TextUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Pattern;

@Component
public class WikipediaClient {

    private static final Logger log = LoggerFactory.getLogger(WikipediaClient.class);
    private static final String WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
    private static final String COMMONS_API = "https://commons.wikimedia.org/w/api.php";
    private static final int MAX_GEO_RADIUS_METERS = 10000;
    private static final Set<String> NON_DESCRIPTIVE_IMAGE_WORDS = Set.of(
            "the", "and", "for", "from", "with", "near", "in", "at", "of", "on",
            "jpg", "jpeg", "png", "webp", "file"
    );

    private static final Pattern TOURIST_CATEGORY = Pattern.compile(
            "tourist attractions?|museums|art museums|museums in|parks in|urban public parks|"
                    + "beaches|temples|churches|cathedrals|basilicas|mosques|synagogues|"
                    + "castles|palaces|forts|fortifications|historic sites|monuments and memorials|"
                    + "monuments|landmarks|observation towers|towers in|archaeological sites|"
                    + "waterfalls|mountains|hills|viewpoints|gardens|nature reserves|zoos|"
                    + "world heritage sites|religious buildings|shinto shrines|buddhist temples|"
                    + "hindu temples|plazas|squares in|marketplaces|markets|bridges|fountains|"
                    + "theatres|opera houses|stadiums|beaches of|lakes|national parks|"
                    + "shopping districts|shopping streets|cultural heritage|visitor attractions|"
                    + "amusement parks|theme parks|city walls|city gates|tombs|mausoleums|"
                    + "cemeteries|shrines|monasteries|abbeys",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern BAD_TITLE = Pattern.compile(
            "railway|metro|subway|station\\b|line\\b|airport|school|university|college|"
                    + "hospital|ministry|stock exchange|bank\\b|constituency|prison|court|"
                    + "embassy|archive|festival|organization|association|company|companies|"
                    + "list of|timeline|siege|battle|election|incident|accident|history of|"
                    + "neighborhood|neighbourhood|suburb|district\\b|street\\b|road\\b|"
                    + "expressway|causeway|tourism in|film|disambiguation",
            Pattern.CASE_INSENSITIVE
    );

    private final ExternalHttpClient http;
    private final ObjectMapper objectMapper;

    public WikipediaClient(ExternalHttpClient http, ObjectMapper objectMapper) {
        this.http = http;
        this.objectMapper = objectMapper;
    }

    public WikiSummary getSummary(String title) {
        if (title == null || title.isBlank()) {
            return WikiSummary.empty();
        }

        String url = WIKIPEDIA_API
                + "?action=query&format=json&formatversion=2&redirects=1"
                + "&prop=extracts%7Cpageimages&exintro=1&explaintext=1"
                + "&piprop=thumbnail&pithumbsize=800"
                + "&titles=" + encode(title);

        try {
            String body = http.get(url, 2);
            JsonNode root = objectMapper.readTree(body);
            JsonNode pages = root.path("query").path("pages");
            JsonNode page = pages.isArray() && pages.size() > 0 ? pages.get(0) : null;
            if (page == null || page.path("missing").asBoolean(false)) {
                return WikiSummary.empty();
            }

            String pageTitle = page.path("title").asText(title);
            String extract = TextUtils.truncateAtWord(page.path("extract").asText(""), 700);
            String image = page.path("thumbnail").path("source").asText(null);
            return new WikiSummary(pageTitle, extract, emptyToNull(image), wikipediaUrl(pageTitle));
        } catch (Exception ex) {
            log.warn("Wikipedia summary lookup failed for {}: {}", title, ex.getMessage());
            return WikiSummary.empty();
        }
    }

    public String suggestCorrection(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }

        String url = WIKIPEDIA_API
                + "?action=query&format=json&formatversion=2&list=search"
                + "&srlimit=1&srinfo=suggestion"
                + "&srsearch=" + encode(query);

        try {
            String body = http.get(url, 2);
            JsonNode root = objectMapper.readTree(body);
            String suggestion = root.path("query").path("searchinfo").path("suggestion").asText("").trim();
            if (suggestion.isBlank() || TextUtils.normalize(suggestion).equals(TextUtils.normalize(query))) {
                return null;
            }
            return suggestion;
        } catch (Exception ex) {
            log.warn("Wikipedia spelling suggestion failed for {}: {}", query, ex.getMessage());
            return null;
        }
    }

    public List<SpotCandidate> geoSearch(GeocodedPlace place) {
        double offset = place.geoSearchOffsetDegrees();
        List<double[]> centers = new ArrayList<>();
        centers.add(new double[]{place.lat(), place.lng()});
        if (place.searchRadiusMeters() > 25000) {
            centers.addAll(List.of(
                    new double[]{place.lat() + offset, place.lng()},
                    new double[]{place.lat() - offset, place.lng()},
                    new double[]{place.lat(), place.lng() + offset},
                    new double[]{place.lat(), place.lng() - offset}
            ));
        }

        List<CompletableFuture<List<SpotCandidate>>> futures = new ArrayList<>();
        for (double[] center : centers) {
            futures.add(CompletableFuture.supplyAsync(() -> {
                try {
                    return fetchGeoSearch(center[0], center[1], place);
                } catch (Exception ex) {
                    log.warn("Wikipedia geosearch failed around {},{}: {}", center[0], center[1], ex.getMessage());
                    return List.of();
                }
            }));
        }

        List<SpotCandidate> results = new ArrayList<>();
        for (CompletableFuture<List<SpotCandidate>> future : futures) {
            try {
                results.addAll(future.join());
            } catch (Exception ex) {
                log.warn("Wikipedia geosearch result failed: {}", ex.getMessage());
            }
        }
        return results;
    }

    public List<SpotCandidate> searchCategory(String category, String searchTerm, GeocodedPlace place) {
        String url = WIKIPEDIA_API
                + "?action=query&format=json&formatversion=2"
                + "&generator=search&gsrnamespace=0&gsrlimit=12"
                + "&gsrsearch=" + encode(searchTerm + " in " + place.name())
                + "&prop=coordinates%7Cpageimages%7Cextracts%7Ccategories"
                + "&cllimit=max&clshow=!hidden&piprop=thumbnail&pithumbsize=800"
                + "&exintro=1&explaintext=1&exlimit=max";

        try {
            String body = http.get(url, 2);
            JsonNode root = objectMapper.readTree(body);
            return parsePages(root, place, category, true);
        } catch (Exception ex) {
            log.warn("Wikipedia category search failed for {} in {}: {}", category, place.name(), ex.getMessage());
            return List.of();
        }
    }

    public String findCommonsImage(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }

        String url = COMMONS_API
                + "?action=query&format=json&formatversion=2"
                + "&generator=search&gsrnamespace=6&gsrlimit=5"
                + "&gsrsearch=" + encode(name + " filetype:bitmap")
                + "&prop=imageinfo&iiprop=url&iiurlwidth=800";

        try {
            String body = http.get(url, 1);
            JsonNode root = objectMapper.readTree(body);
            JsonNode pages = root.path("query").path("pages");
            if (!pages.isArray() || pages.isEmpty()) {
                return null;
            }

            List<String> nameWords = imageWords(name);
            if (nameWords.isEmpty() || (nameWords.size() == 1 && nameWords.get(0).length() < 5)) {
                return null;
            }

            JsonNode bestPage = null;
            int bestMatches = 0;
            for (JsonNode page : pages) {
                int matches = (int) nameWords.stream()
                        .filter(imageWords(page.path("title").asText(""))::contains)
                        .count();
                if (matches > bestMatches) {
                    bestMatches = matches;
                    bestPage = page;
                }
            }
            if (bestPage == null || bestMatches < Math.ceil(nameWords.size() * 0.6)) {
                return null;
            }

            JsonNode info = bestPage.path("imageinfo");
            if (!info.isArray() || info.isEmpty()) {
                return null;
            }
            String thumb = info.get(0).path("thumburl").asText("");
            String original = info.get(0).path("url").asText("");
            return !thumb.isBlank() ? thumb : emptyToNull(original);
        } catch (Exception ex) {
            log.warn("Wikimedia Commons image lookup failed for {}: {}", name, ex.getMessage());
            return null;
        }
    }

    private List<String> imageWords(String value) {
        return Arrays.stream(TextUtils.normalize(value).split("\\s+"))
                .filter(word -> word.length() > 2 && !NON_DESCRIPTIVE_IMAGE_WORDS.contains(word))
                .distinct()
                .toList();
    }

    private List<SpotCandidate> fetchGeoSearch(double lat, double lng, GeocodedPlace place) {
        String coord = lat + "|" + lng;
        String url = WIKIPEDIA_API
                + "?action=query&format=json&formatversion=2"
                + "&generator=geosearch&ggslimit=100&ggsradius=" + MAX_GEO_RADIUS_METERS
                + "&ggscoord=" + encode(coord)
                + "&prop=coordinates%7Cpageimages%7Cextracts%7Ccategories"
                + "&cllimit=max&clshow=!hidden&piprop=thumbnail&pithumbsize=800"
                + "&exintro=1&explaintext=1&exlimit=max";

        String body = http.get(url, 2);
        try {
            JsonNode root = objectMapper.readTree(body);
            return parsePages(root, place, null, false);
        } catch (Exception ex) {
            log.warn("Wikipedia geosearch response could not be read: {}", ex.getMessage());
            return List.of();
        }
    }

    private List<SpotCandidate> parsePages(JsonNode root, GeocodedPlace place,
                                           String requestedCategory, boolean categorySearch) {
        JsonNode pages = root.path("query").path("pages");
        List<JsonNode> pageList = new ArrayList<>();

        if (pages.isArray()) {
            pages.forEach(pageList::add);
        } else if (pages.isObject()) {
            pages.fields().forEachRemaining(entry -> pageList.add(entry.getValue()));
        }

        List<SpotCandidate> spots = new ArrayList<>();
        for (JsonNode page : pageList) {
            String title = TextUtils.cleanText(page.path("title").asText(""));
            if (title.isBlank() || title.equalsIgnoreCase(place.name())) {
                continue;
            }
            if (title.toLowerCase(Locale.ROOT).contains("disambiguation")) {
                continue;
            }
            if (BAD_TITLE.matcher(title).find()) {
                continue;
            }

            JsonNode coordinates = page.path("coordinates");
            if (!coordinates.isArray() || coordinates.isEmpty()) {
                continue;
            }

            double lat = coordinates.get(0).path("lat").asDouble(Double.NaN);
            double lng = coordinates.get(0).path("lon").asDouble(Double.NaN);
            if (Double.isNaN(lat) || Double.isNaN(lng)) {
                continue;
            }

            List<String> categories = new ArrayList<>();
            JsonNode catNodes = page.path("categories");
            if (catNodes.isArray()) {
                for (JsonNode cat : catNodes) {
                    categories.add(cat.path("title").asText("").replace("Category:", ""));
                }
            }

            String categoryText = String.join(" ", categories);
            boolean positiveCategory = TOURIST_CATEGORY.matcher(categoryText).find();
            if (!categorySearch && !positiveCategory) {
                continue;
            }

            String extract = TextUtils.truncateAtWord(page.path("extract").asText(""), 320);
            String inferred = inferCategory(title, extract, categoryText);
            String category = inferred;
            if (categorySearch) {
                category = requestedCategory;
            } else if (category == null && positiveCategory) {
                category = "Attraction";
            }
            if (category == null) {
                continue;
            }

            String image = emptyToNull(page.path("thumbnail").path("source").asText(""));
            String pageId = page.path("pageid").asText(title);
            String wikiUrl = wikipediaUrl(title);

            spots.add(new SpotCandidate(
                    "wiki-" + pageId,
                    title,
                    category,
                    extract.isBlank() ? null : extract,
                    image,
                    wikiUrl,
                    null,
                    lat,
                    lng,
                    TextUtils.haversineKm(place.lat(), place.lng(), lat, lng),
                    categorySearch
            ));
        }
        return spots;
    }

    private String inferCategory(String title, String extract, String categoryText) {
        String text = (title + " " + categoryText + " " + (extract == null ? "" : extract))
                .toLowerCase(Locale.ROOT);

        if (text.matches(".*\\bbeach(es)?\\b.*")) {
            return "Beach";
        }
        if (text.matches(".*\\bwaterfalls?\\b.*")) {
            return "Waterfall";
        }
        if (text.matches(".*\\bmuseums?\\b.*")) {
            return "Museum";
        }
        if (text.matches(".*\\b(temples?|shrine|monastery|monasteries)\\b.*")) {
            return "Temple";
        }
        if (text.matches(".*\\b(church|churches|cathedral|cathedrals|basilica|basilicas|chapel|chapels|abbey|abbeys)\\b.*")) {
            return "Church";
        }
        if (text.matches(".*\\bmosques?\\b.*")) {
            return "Mosque";
        }
        if (text.matches(".*\\bpalaces?\\b.*")) {
            return "Palace";
        }
        if (text.matches(".*\\b(forts?|fortress|fortresses|castle|castles|fortification|fortifications)\\b.*")) {
            return "Fort";
        }
        if (text.matches(".*\\b(viewpoint|viewpoints|observation tower|tower|towers|lookout)\\b.*")) {
            return "Viewpoint";
        }
        if (text.matches(".*\\b(parks?|gardens?|garden)\\b.*")) {
            return "Park";
        }
        if (text.matches(".*\\blakes?\\b.*")) {
            return "Lake";
        }
        if (text.matches(".*\\b(mountains?|peaks?|hills?)\\b.*")) {
            return "Mountain";
        }
        if (text.matches(".*\\b(zoo|zoos|wildlife|sanctuary|sanctuaries)\\b.*")) {
            return "Wildlife";
        }
        if (text.matches(".*\\bmarkets?\\b.*")) {
            return "Market";
        }
        if (text.matches(".*\\b(historic|heritage|monument|monuments|archaeological|memorial|memorials|world heritage)\\b.*")) {
            return "Historic";
        }
        return null;
    }

    private String wikipediaUrl(String title) {
        if (title == null || title.isBlank()) {
            return null;
        }
        return "https://en.wikipedia.org/wiki/"
                + URLEncoder.encode(title.replace(' ', '_'), StandardCharsets.UTF_8)
                .replace("+", "%20");
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
