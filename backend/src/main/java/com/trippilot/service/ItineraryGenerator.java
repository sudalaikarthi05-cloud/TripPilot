package com.trippilot.service;

import com.trippilot.dto.DiscoverPlace;
import com.trippilot.dto.DiscoverResponse;
import com.trippilot.dto.DiscoverSpot;
import com.trippilot.dto.TripRequest;
import com.trippilot.model.Destination;
import com.trippilot.model.TouristPlace;
import com.trippilot.model.Trip;
import com.trippilot.model.Trip.ActivityItem;
import com.trippilot.model.Trip.CostBreakdown;
import com.trippilot.model.Trip.ItineraryDay;
import com.trippilot.model.Trip.Meals;
import com.trippilot.model.Trip.TimeSlot;
import com.trippilot.model.Trip.TripDestination;
import com.trippilot.util.TextUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Global rule-based itinerary generator.
 * Uses real travel data from DiscoverService (Nominatim, Wikipedia, Overpass, Wikimedia)
 * with geographic clustering, interest ranking, and realistic cost breakdown.
 */
@Service
public class ItineraryGenerator {

    private static final Logger log = LoggerFactory.getLogger(ItineraryGenerator.class);
    private static final String DEFAULT_PLACE_IMAGE = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80";

    private final DiscoverService discoverService;
    private final DestinationService destinationService;
    private final PlaceService placeService;

    public ItineraryGenerator(DiscoverService discoverService,
                              DestinationService destinationService,
                              PlaceService placeService) {
        this.discoverService = discoverService;
        this.destinationService = destinationService;
        this.placeService = placeService;
    }

    public Trip generate(TripRequest req) {
        String destQuery = req.getResolvedDestinationName();
        if (destQuery.isBlank()) {
            throw new IllegalArgumentException("Destination is required");
        }

        double userBudget = req.getResolvedBudget();
        String currency = req.getResolvedCurrency();
        int numDays = Math.max(1, Math.min(10, req.getNumDays()));
        int travelers = Math.max(1, Math.min(20, req.getNumTravelers()));
        String travelStyle = req.getTravelStyle() != null ? capitalise(req.getTravelStyle()) : "Comfort";

        // 1. Fetch real attraction data via DiscoverService pipeline (cached in MongoDB)
        DiscoverResponse discover = null;
        try {
            discover = discoverService.discover(destQuery);
        } catch (Exception ex) {
            log.warn("Discover pipeline encountered issue for '{}': {}", destQuery, ex.getMessage());
        }

        // Fallback / legacy check: check if it's a seeded Kerala destination
        Optional<Destination> keralaDest = destinationService.findById(destQuery)
                .or(() -> destinationService.findBySlug(destQuery))
                .or(() -> destinationService.findAll().stream()
                        .filter(d -> d.getName().equalsIgnoreCase(destQuery))
                        .findFirst());

        DiscoverPlace placeSummary;
        List<DiscoverSpot> spots = new ArrayList<>();

        if (discover != null && discover.place() != null) {
            placeSummary = discover.place();
            if (discover.spots() != null && !discover.spots().isEmpty()) {
                spots.addAll(discover.spots());
            }
        } else if (keralaDest.isPresent()) {
            Destination kd = keralaDest.get();
            placeSummary = new DiscoverPlace(
                    kd.getName(),
                    "India",
                    kd.getLat() != 0 ? kd.getLat() : 10.0,
                    kd.getLng() != 0 ? kd.getLng() : 76.5,
                    kd.getDescription(),
                    kd.getCoverImage() != null ? kd.getCoverImage() : kd.getImage()
            );
            List<TouristPlace> seededPlaces = placeService.findByDestinationId(kd.getId());
            if (seededPlaces.isEmpty()) {
                seededPlaces = placeService.findByDestinationId(kd.getSlug());
            }
            for (TouristPlace tp : seededPlaces) {
                spots.add(new DiscoverSpot(
                        tp.getId(),
                        tp.getName(),
                        tp.getCategory(),
                        tp.getDescription(),
                        tp.getImage(),
                        tp.getLat() != 0 ? tp.getLat() : placeSummary.lat(),
                        tp.getLng() != 0 ? tp.getLng() : placeSummary.lng(),
                        1.5,
                        null,
                        null,
                        kd.getName() + ", Kerala"
                ));
            }
        } else {
            throw new IllegalArgumentException("Could not find travel information for: " + destQuery);
        }

        // Build Trip shell
        Trip trip = new Trip();
        trip.setDestinationName(placeSummary.name());
        trip.setDestinationCountry(placeSummary.country());
        trip.setDestinationLat(placeSummary.lat());
        trip.setDestinationLng(placeSummary.lng());
        trip.setDestinationId(keralaDest.map(Destination::getId).orElse(destQuery));

        TripDestination td = new TripDestination();
        td.setName(placeSummary.name());
        td.setRegion(placeSummary.country());
        td.setCountry(placeSummary.country());
        td.setDescription(placeSummary.summary());
        td.setImage(placeSummary.image() != null && !placeSummary.image().isBlank()
                ? placeSummary.image()
                : DEFAULT_PLACE_IMAGE);
        td.setLat(placeSummary.lat());
        td.setLng(placeSummary.lng());
        trip.setDestination(td);

        trip.setStartingLocation(req.getStartingLocation());
        trip.setStartDate(req.getStartDate());
        trip.setNumDays(numDays);
        trip.setNumTravelers(travelers);
        trip.setBudget(userBudget);
        trip.setCurrency(currency);
        trip.setTravelStyle(travelStyle);
        trip.setTransport(req.getTransport());
        trip.setInterests(req.getInterests());

        LocalDate start = LocalDate.parse(req.getStartDate(), DateTimeFormatter.ISO_LOCAL_DATE);
        LocalDate end = start.plusDays(numDays - 1);
        trip.setEndDate(end.toString());

        // 2. Rank spots by relevance and interests
        List<DiscoverSpot> rankedSpots = rankAndScoreSpots(spots, req.getInterests(), placeSummary);

        // 3. Cluster and schedule spots across days
        List<ItineraryDay> days = scheduleDays(rankedSpots, placeSummary, numDays, start, userBudget, currency, travelStyle, travelers);
        trip.setDays(days);

        // 4. Overall trip cost breakdown
        CostBreakdown overallCost = calculateCostBreakdown(userBudget, currency, travelStyle, travelers, numDays);
        trip.setCostBreakdown(overallCost);

        trip.setCreatedAt(java.time.Instant.now().toString());
        return trip;
    }

    // =========================================================================
    // SCHEDULING & CLUSTERING LOGIC
    // =========================================================================

    private List<ItineraryDay> scheduleDays(List<DiscoverSpot> spots,
                                            DiscoverPlace center,
                                            int numDays,
                                            LocalDate startDate,
                                            double totalBudget,
                                            String currency,
                                            String travelStyle,
                                            int travelers) {
        List<ItineraryDay> days = new ArrayList<>();
        double dailyBudget = totalBudget / numDays;

        // Determine targets per day:
        // 1 day -> 3-4 stops
        // 2 days -> 3-4 stops/day
        // 3+ days -> 3-4 stops/day, last day lighter (2 stops)
        int[] targetCounts = new int[numDays];
        for (int d = 0; d < numDays; d++) {
            if (numDays == 1) {
                targetCounts[d] = Math.min(spots.size(), 4);
            } else if (d == numDays - 1 && numDays >= 3) {
                targetCounts[d] = 2; // Lighter last day for packing / leisure / departure
            } else {
                targetCounts[d] = 3;
            }
        }

        int totalNeeded = 0;
        for (int c : targetCounts) totalNeeded += c;

        List<DiscoverSpot> candidatePool = new ArrayList<>(spots.stream().limit(Math.max(totalNeeded, spots.size())).toList());

        // If spots pool is smaller than needed, create sensible city exploration stops
        if (candidatePool.isEmpty()) {
            candidatePool.add(new DiscoverSpot(
                    "gen-1",
                    center.name() + " Historic Center",
                    "Historic",
                    "Explore the vibrant heart, iconic architecture, and cultural landmarks of " + center.name() + ".",
                    center.image(),
                    center.lat(),
                    center.lng(),
                    0.0,
                    null,
                    null,
                    center.name()
            ));
        }

        // Cluster spots into days by geographic proximity
        List<List<DiscoverSpot>> dayBuckets = clusterSpotsIntoDays(candidatePool, numDays, targetCounts, center);

        for (int d = 0; d < numDays; d++) {
            int dayNum = d + 1;
            LocalDate dayDate = startDate.plusDays(d);
            List<DiscoverSpot> daySpots = dayBuckets.get(d);

            // Sort spots within the day using nearest-neighbour routing
            daySpots = routeNearestNeighbour(daySpots, center.lat(), center.lng());

            ItineraryDay day = new ItineraryDay();
            day.setDayNumber(dayNum);
            day.setDate(dayDate.toString());
            day.setDailyBudget(Math.round(dailyBudget));

            if (dayNum == 1) {
                day.setTitle("Arrive & Explore " + center.name());
            } else if (dayNum == numDays && numDays > 1) {
                day.setTitle("Final Day & Highlights in " + center.name());
            } else {
                day.setTitle("Discovering " + center.name() + " — Day " + dayNum);
            }

            // Build activities
            List<ActivityItem> activities = new ArrayList<>();
            double prevLat = center.lat();
            double prevLng = center.lng();
            boolean isFirstStop = true;

            String[] slotTimes = {"09:00 AM", "01:30 PM", "04:30 PM", "07:00 PM"};
            String[] slotTypes = {"morning", "afternoon", "evening", "evening"};
            String[] durations = {"2–3 hours", "1.5–2 hours", "1.5–2 hours", "1–1.5 hours"};

            for (int s = 0; s < daySpots.size(); s++) {
                DiscoverSpot spot = daySpots.get(s);
                String time = s < slotTimes.length ? slotTimes[s] : "05:00 PM";
                String slotType = s < slotTypes.length ? slotTypes[s] : "evening";
                String duration = s < durations.length ? durations[s] : "1–2 hours";

                // Travel time calculation
                double distKm = TextUtils.haversineKm(prevLat, prevLng, spot.lat(), spot.lng());
                String travelTimeStr;
                if (isFirstStop) {
                    if (distKm < 0.6) {
                        travelTimeStr = "~5 min walk (estimate)";
                    } else if (distKm < 2.0) {
                        travelTimeStr = "~15 min walk (estimate)";
                    } else {
                        int min = (int) Math.max(10, Math.round((distKm / 25.0) * 60));
                        travelTimeStr = "~" + min + " min (estimate)";
                    }
                    isFirstStop = false;
                } else {
                    if (distKm < 0.6) {
                        travelTimeStr = "~5 min walk (estimate)";
                    } else if (distKm < 1.5) {
                        int min = (int) Math.max(8, Math.round(distKm * 12));
                        travelTimeStr = "~" + min + " min walk (estimate)";
                    } else {
                        int min = (int) Math.max(12, Math.round((distKm / 25.0) * 60));
                        travelTimeStr = "~" + min + " min drive (estimate)";
                    }
                }
                prevLat = spot.lat();
                prevLng = spot.lng();

                ActivityItem act = new ActivityItem();
                act.setTime(time);
                act.setSlotType(slotType);
                act.setPlaceName(spot.name());
                act.setImage(spot.image() != null && !spot.image().isBlank() ? spot.image() : center.image());
                act.setDescription(spot.description() != null && !spot.description().isBlank()
                        ? spot.description()
                        : "Discover one of the most prominent highlights in " + center.name() + ".");
                act.setSuggestedDuration(duration);
                act.setLat(spot.lat());
                act.setLng(spot.lng());
                act.setAddress(spot.address() != null ? spot.address() : center.name() + ", " + center.country());
                act.setEstimatedTravelTimeFromPrevious(travelTimeStr);
                act.setOpeningHours(spot.openingHours()); // Null if not available in OSM
                act.setTip(generateTip(spot, s));

                activities.add(act);
            }

            day.setActivities(activities);

            // Populate legacy morning/afternoon/evening slots for full backwards compatibility
            if (!activities.isEmpty()) {
                day.setMorning(toTimeSlot(activities.get(0)));
            }
            if (activities.size() > 1) {
                day.setAfternoon(toTimeSlot(activities.get(1)));
            }
            if (activities.size() > 2) {
                day.setEvening(toTimeSlot(activities.get(2)));
            } else if (activities.size() == 2 && dayNum == numDays) {
                TimeSlot eve = new TimeSlot();
                eve.setTime("06:30 PM");
                eve.setActivity("Farewell Dinner & Evening Stroll");
                eve.setDescription("Enjoy dinner at a local bistro and take a relaxed stroll through " + center.name() + ".");
                eve.setDuration("1.5–2 hours");
                eve.setImage(center.image());
                eve.setTip("Celebrate the culmination of your journey with authentic regional dining.");
                day.setEvening(eve);
            }

            // Meals (strictly generic, no hardcoded Kerala food)
            Meals meals = new Meals();
            meals.setBreakfast("Morning breakfast at a popular cafe or bakery near your hotel in " + center.name());
            meals.setLunch("Lunch at a well-reviewed restaurant serving traditional regional specialties");
            meals.setDinner("Dinner featuring local seasonal dishes and evening dining atmosphere");
            day.setMeals(meals);

            // Accommodation
            double accomCost = dailyBudget * 0.40;
            day.setAccommodation(travelStyle + " accommodation in central " + center.name()
                    + " (~" + currency + " " + Math.round(accomCost) + " / night est.)");

            // Cost breakdown for day
            CostBreakdown dayCost = calculateCostBreakdown(dailyBudget, currency, travelStyle, travelers, 1);
            day.setCostBreakdown(dayCost);

            days.add(day);
        }

        return days;
    }

    private List<List<DiscoverSpot>> clusterSpotsIntoDays(List<DiscoverSpot> spots,
                                                          int numDays,
                                                          int[] targetCounts,
                                                          DiscoverPlace center) {
        List<List<DiscoverSpot>> buckets = new ArrayList<>();
        for (int i = 0; i < numDays; i++) {
            buckets.add(new ArrayList<>());
        }

        if (spots.isEmpty()) {
            return buckets;
        }

        if (numDays == 1) {
            buckets.get(0).addAll(spots.stream().limit(targetCounts[0]).toList());
            return buckets;
        }

        // K-means style seeding: pick distant seeds to distribute different geographic areas across days
        List<DiscoverSpot> seeds = new ArrayList<>();
        seeds.add(spots.get(0));

        List<DiscoverSpot> unassigned = new ArrayList<>(spots);
        unassigned.remove(0);

        while (seeds.size() < numDays && !unassigned.isEmpty()) {
            DiscoverSpot furthest = null;
            double maxMinDist = -1;
            for (DiscoverSpot candidate : unassigned) {
                double minDist = Double.MAX_VALUE;
                for (DiscoverSpot seed : seeds) {
                    double dist = TextUtils.haversineKm(candidate.lat(), candidate.lng(), seed.lat(), seed.lng());
                    if (dist < minDist) minDist = dist;
                }
                if (minDist > maxMinDist) {
                    maxMinDist = minDist;
                    furthest = candidate;
                }
            }
            if (furthest != null) {
                seeds.add(furthest);
                unassigned.remove(furthest);
            } else {
                break;
            }
        }

        // Initialize buckets with seeds
        for (int d = 0; d < seeds.size(); d++) {
            buckets.get(d).add(seeds.get(d));
        }

        // Assign remaining spots to the closest day bucket that has remaining capacity
        for (DiscoverSpot spot : unassigned) {
            int bestDay = -1;
            double bestDist = Double.MAX_VALUE;
            for (int d = 0; d < numDays; d++) {
                if (buckets.get(d).size() >= targetCounts[d]) {
                    continue; // Bucket full
                }
                // Calculate distance to current day centroid
                double dayLat = buckets.get(d).stream().mapToDouble(DiscoverSpot::lat).average().orElse(center.lat());
                double dayLng = buckets.get(d).stream().mapToDouble(DiscoverSpot::lng).average().orElse(center.lng());
                double dist = TextUtils.haversineKm(spot.lat(), spot.lng(), dayLat, dayLng);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestDay = d;
                }
            }
            if (bestDay != -1) {
                buckets.get(bestDay).add(spot);
            } else {
                // If all buckets reached target, add to least populated day (max 4)
                int minIdx = 0;
                for (int d = 1; d < numDays; d++) {
                    if (buckets.get(d).size() < buckets.get(minIdx).size()) {
                        minIdx = d;
                    }
                }
                if (buckets.get(minIdx).size() < 4) {
                    buckets.get(minIdx).add(spot);
                }
            }
        }

        // Ensure every day has at least 1 spot if spots are available
        for (int d = 0; d < numDays; d++) {
            if (buckets.get(d).isEmpty()) {
                // Borrow from largest bucket
                int maxIdx = -1;
                for (int m = 0; m < numDays; m++) {
                    if (buckets.get(m).size() > 1 && (maxIdx == -1 || buckets.get(m).size() > buckets.get(maxIdx).size())) {
                        maxIdx = m;
                    }
                }
                if (maxIdx != -1) {
                    buckets.get(d).add(buckets.get(maxIdx).remove(buckets.get(maxIdx).size() - 1));
                }
            }
        }

        return buckets;
    }

    private List<DiscoverSpot> routeNearestNeighbour(List<DiscoverSpot> spots, double startLat, double startLng) {
        if (spots.size() <= 1) return spots;

        List<DiscoverSpot> remaining = new ArrayList<>(spots);
        List<DiscoverSpot> ordered = new ArrayList<>();

        double currentLat = startLat;
        double currentLng = startLng;

        while (!remaining.isEmpty()) {
            int nearestIdx = 0;
            double nearestDist = Double.MAX_VALUE;
            for (int i = 0; i < remaining.size(); i++) {
                DiscoverSpot s = remaining.get(i);
                double d = TextUtils.haversineKm(currentLat, currentLng, s.lat(), s.lng());
                if (d < nearestDist) {
                    nearestDist = d;
                    nearestIdx = i;
                }
            }
            DiscoverSpot next = remaining.remove(nearestIdx);
            ordered.add(next);
            currentLat = next.lat();
            currentLng = next.lng();
        }

        return ordered;
    }

    // =========================================================================
    // RANKING & INTEREST MATCHING
    // =========================================================================

    private List<DiscoverSpot> rankAndScoreSpots(List<DiscoverSpot> spots, List<String> interests, DiscoverPlace center) {
        if (spots == null || spots.isEmpty()) return List.of();

        Set<String> userInterests = interests != null
                ? interests.stream().map(String::toLowerCase).collect(Collectors.toSet())
                : Set.of();

        record ScoredSpot(DiscoverSpot spot, double score) {}

        List<ScoredSpot> scored = new ArrayList<>();
        for (DiscoverSpot s : spots) {
            double score = 0.0;

            // Popularity signals: image presence and wikipedia
            if (s.image() != null && !s.image().isBlank()) score += 5.0;
            if (s.wikipediaUrl() != null && !s.wikipediaUrl().isBlank()) score += 4.0;
            if (s.description() != null && s.description().length() > 50) score += 2.0;

            // Proximity to city center bonus (within 15km)
            double distFromCenter = s.distanceKm();
            if (distFromCenter < 5.0) score += 3.0;
            else if (distFromCenter < 15.0) score += 1.5;

            // Interest matching bonus
            String cat = s.category() != null ? s.category().toLowerCase() : "";
            String desc = s.description() != null ? s.description().toLowerCase() : "";
            String name = s.name().toLowerCase();

            for (String interest : userInterests) {
                if (matchesInterest(interest, cat, desc, name)) {
                    score += 8.0;
                }
            }

            scored.add(new ScoredSpot(s, score));
        }

        scored.sort((a, b) -> Double.compare(b.score, a.score));

        return scored.stream().map(ScoredSpot::spot).collect(Collectors.toList());
    }

    private boolean matchesInterest(String interest, String cat, String desc, String name) {
        String haystack = cat + " " + desc + " " + name;
        return switch (interest) {
            case "nature" -> haystack.contains("nature") || haystack.contains("park") || haystack.contains("waterfall")
                    || haystack.contains("mountain") || haystack.contains("lake") || haystack.contains("garden");
            case "beach" -> haystack.contains("beach") || haystack.contains("coast") || haystack.contains("sea")
                    || haystack.contains("island") || haystack.contains("bay");
            case "adventure" -> haystack.contains("adventure") || haystack.contains("hiking") || haystack.contains("trek")
                    || haystack.contains("safari") || haystack.contains("peak") || haystack.contains("climb");
            case "food" -> haystack.contains("food") || haystack.contains("market") || haystack.contains("restaurant")
                    || haystack.contains("cuisine") || haystack.contains("culinary");
            case "history" -> haystack.contains("historic") || haystack.contains("history") || haystack.contains("monument")
                    || haystack.contains("heritage") || haystack.contains("fort") || haystack.contains("palace")
                    || haystack.contains("castle") || haystack.contains("ruin");
            case "culture" -> haystack.contains("culture") || haystack.contains("museum") || haystack.contains("art")
                    || haystack.contains("temple") || haystack.contains("church") || haystack.contains("cathedral")
                    || haystack.contains("mosque") || haystack.contains("theater");
            case "shopping" -> haystack.contains("shop") || haystack.contains("market") || haystack.contains("bazaar")
                    || haystack.contains("mall") || haystack.contains("souk");
            case "relaxation" -> haystack.contains("relax") || haystack.contains("spa") || haystack.contains("garden")
                    || haystack.contains("lake") || haystack.contains("viewpoint") || haystack.contains("promenade");
            default -> haystack.contains(interest);
        };
    }

    // =========================================================================
    // COST CALCULATION
    // =========================================================================

    public CostBreakdown calculateCostBreakdown(double budget, String currency, String travelStyle, int travelers, int days) {
        CostBreakdown cost = new CostBreakdown();
        cost.setUserBudget(budget);
        cost.setCurrency(currency != null ? currency.toUpperCase() : "USD");

        // Percentage distributions based on travel style
        double accomRate;
        double foodRate;
        double transportRate;
        double activitiesRate;

        String style = travelStyle.toLowerCase();
        if (style.contains("luxury")) {
            accomRate = 0.45;
            foodRate = 0.25;
            transportRate = 0.18;
            activitiesRate = 0.12;
        } else if (style.contains("budget")) {
            accomRate = 0.35;
            foodRate = 0.25;
            transportRate = 0.20;
            activitiesRate = 0.20;
        } else { // Comfort / Default
            accomRate = 0.40;
            foodRate = 0.25;
            transportRate = 0.20;
            activitiesRate = 0.15;
        }

        double accom = Math.round(budget * accomRate * 100.0) / 100.0;
        double food = Math.round(budget * foodRate * 100.0) / 100.0;
        double transport = Math.round(budget * transportRate * 100.0) / 100.0;
        double activities = Math.round(budget * activitiesRate * 100.0) / 100.0;
        double totalEstimated = Math.round((accom + food + transport + activities) * 100.0) / 100.0;

        cost.setAccommodation(accom);
        cost.setFood(food);
        cost.setTransport(transport);
        cost.setActivities(activities);
        cost.setTotalEstimated(totalEstimated);

        if (totalEstimated <= budget * 1.02) {
            cost.setStatus("on_budget");
        } else if (totalEstimated < budget * 0.90) {
            cost.setStatus("under_budget");
        } else {
            cost.setStatus("over_budget");
        }

        return cost;
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private TimeSlot toTimeSlot(ActivityItem act) {
        TimeSlot slot = new TimeSlot();
        slot.setTime(act.getTime());
        slot.setActivity(act.getPlaceName());
        slot.setDescription(act.getDescription());
        slot.setDuration(act.getSuggestedDuration());
        slot.setImage(act.getImage());
        slot.setTip(act.getTip());
        slot.setLat(act.getLat());
        slot.setLng(act.getLng());
        slot.setAddress(act.getAddress());
        slot.setEstimatedTravelTimeFromPrevious(act.getEstimatedTravelTimeFromPrevious());
        slot.setOpeningHours(act.getOpeningHours());
        return slot;
    }

    private String generateTip(DiscoverSpot spot, int orderIndex) {
        String cat = spot.category() != null ? spot.category().toLowerCase() : "";
        if (orderIndex == 0) {
            return "Arrive early to enjoy peaceful morning ambiance and optimal lighting for photos.";
        }
        if (cat.contains("museum") || cat.contains("gallery")) {
            return "Check online for audio guides or skip-the-line admissions during peak hours.";
        }
        if (cat.contains("beach") || cat.contains("viewpoint")) {
            return "Wear comfortable footwear and bring sun protection and drinking water.";
        }
        if (cat.contains("temple") || cat.contains("church") || cat.contains("mosque")) {
            return "Respect local dress codes (modest attire covering shoulders and knees is recommended).";
        }
        if (cat.contains("market")) {
            return "Keep small currency denominations handy for local artisan stalls and street food.";
        }
        return "Plan around 1.5 to 2 hours here to fully experience the atmosphere without rushing.";
    }

    private String capitalise(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
    }
}
