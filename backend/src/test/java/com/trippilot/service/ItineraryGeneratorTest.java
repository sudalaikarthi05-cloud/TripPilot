package com.trippilot.service;

import com.trippilot.dto.DiscoverPlace;
import com.trippilot.dto.DiscoverResponse;
import com.trippilot.dto.DiscoverSpot;
import com.trippilot.dto.TripRequest;
import com.trippilot.model.Trip;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class ItineraryGeneratorTest {

    private DiscoverService discoverService;
    private DestinationService destinationService;
    private PlaceService placeService;
    private ItineraryGenerator generator;

    @BeforeEach
    void setUp() {
        discoverService = Mockito.mock(DiscoverService.class);
        destinationService = Mockito.mock(DestinationService.class);
        placeService = Mockito.mock(PlaceService.class);

        when(destinationService.findById(anyString())).thenReturn(Optional.empty());
        when(destinationService.findBySlug(anyString())).thenReturn(Optional.empty());

        generator = new ItineraryGenerator(discoverService, destinationService, placeService);
    }

    private DiscoverResponse mockTokyoResponse() {
        DiscoverPlace place = new DiscoverPlace(
                "Tokyo", "Japan", 35.6762, 139.6503,
                "Tokyo is the bustling capital of Japan.",
                "https://images.unsplash.com/tokyo.jpg"
        );

        List<DiscoverSpot> spots = new ArrayList<>();
        spots.add(new DiscoverSpot("s1", "Senso-ji Temple", "Temple", "Ancient Buddhist temple in Asakusa.",
                "https://images.unsplash.com/sensoji.jpg", 35.7148, 139.7967, 1.2, "https://en.wikipedia.org/wiki/Sens%C5%8D-ji", "06:00-17:00", "Asakusa, Tokyo"));
        spots.add(new DiscoverSpot("s2", "Tokyo Skytree", "Viewpoint", "Tallest tower with observation decks.",
                "https://images.unsplash.com/skytree.jpg", 35.7101, 139.8107, 2.5, "https://en.wikipedia.org/wiki/Tokyo_Skytree", "09:00-21:00", "Sumida, Tokyo"));
        spots.add(new DiscoverSpot("s3", "Meiji Shrine", "Temple", "Shinto shrine in lush forest.",
                "https://images.unsplash.com/meiji.jpg", 35.6764, 139.6993, 3.1, "https://en.wikipedia.org/wiki/Meiji_Shrine", "06:00-18:00", "Shibuya, Tokyo"));
        spots.add(new DiscoverSpot("s4", "Shibuya Crossing", "Landmark", "Famous pedestrian scramble intersection.",
                "https://images.unsplash.com/shibuya.jpg", 35.6595, 139.7005, 4.0, "https://en.wikipedia.org/wiki/Shibuya_Crossing", null, "Shibuya, Tokyo"));
        spots.add(new DiscoverSpot("s5", "Shinjuku Gyoen National Garden", "Park", "Large park with traditional gardens.",
                "https://images.unsplash.com/shinjuku.jpg", 35.6852, 139.7101, 3.5, "https://en.wikipedia.org/wiki/Shinjuku_Gyo-en", "09:00-16:30", "Shinjuku, Tokyo"));
        spots.add(new DiscoverSpot("s6", "Ueno Park & Zoo", "Park", "Spacious public park and cultural hub.",
                "https://images.unsplash.com/ueno.jpg", 35.7140, 139.7741, 2.8, "https://en.wikipedia.org/wiki/Ueno_Park", "05:00-23:00", "Taito, Tokyo"));
        spots.add(new DiscoverSpot("s7", "Akihabara Electric Town", "Shopping", "Hub for tech, anime, and games.",
                "https://images.unsplash.com/akiba.jpg", 35.6983, 139.7731, 2.0, "https://en.wikipedia.org/wiki/Akihabara", "10:00-20:00", "Chiyoda, Tokyo"));
        spots.add(new DiscoverSpot("s8", "Tsukiji Outer Market", "Food", "Historic market with fresh seafood and street food.",
                "https://images.unsplash.com/tsukiji.jpg", 35.6655, 139.7707, 3.2, "https://en.wikipedia.org/wiki/Tsukiji_Outer_Market", "08:00-14:00", "Chuo, Tokyo"));
        spots.add(new DiscoverSpot("s9", "Imperial Palace Gardens", "Historic", "Historic castle grounds and moat.",
                "https://images.unsplash.com/palace.jpg", 35.6852, 139.7528, 1.5, "https://en.wikipedia.org/wiki/Tokyo_Imperial_Palace", "09:00-17:00", "Chiyoda, Tokyo"));
        spots.add(new DiscoverSpot("s10", "Roppongi Hills Mori Art Museum", "Culture", "Contemporary art museum in Roppongi Hills.",
                "https://images.unsplash.com/mori.jpg", 35.6605, 139.7292, 4.2, "https://en.wikipedia.org/wiki/Mori_Art_Museum", "10:00-22:00", "Minato, Tokyo"));

        return new DiscoverResponse(place, spots);
    }

    @Test
    void testOneDayItineraryGeneration() {
        when(discoverService.discover("Tokyo")).thenReturn(mockTokyoResponse());

        TripRequest req = new TripRequest();
        req.setDestinationName("Tokyo");
        req.setStartDate(LocalDate.now().plusDays(7).toString());
        req.setNumDays(1);
        req.setNumTravelers(2);
        req.setBudget(1200.0);
        req.setCurrency("USD");
        req.setTravelStyle("Comfort");
        req.setInterests(List.of("Culture", "History"));

        Trip trip = generator.generate(req);

        assertNotNull(trip);
        assertEquals("Tokyo", trip.getDestinationName());
        assertEquals("Japan", trip.getDestinationCountry());
        assertEquals(1, trip.getNumDays());
        assertEquals(1, trip.getDays().size());

        Trip.ItineraryDay day1 = trip.getDays().get(0);
        assertEquals(1, day1.getDayNumber());
        assertTrue(day1.getActivities().size() >= 3, "1-day itinerary should have 3-4 stops");

        // Verify activity contains required fields
        Trip.ActivityItem first = day1.getActivities().get(0);
        assertNotNull(first.getPlaceName());
        assertNotNull(first.getImage());
        assertNotNull(first.getLat());
        assertNotNull(first.getLng());
        assertNotNull(first.getEstimatedTravelTimeFromPrevious());
        assertTrue(first.getEstimatedTravelTimeFromPrevious().contains("(estimate)"));

        // Cost verification
        assertNotNull(trip.getCostBreakdown());
        assertEquals("USD", trip.getCostBreakdown().getCurrency());
        assertEquals(1200.0, trip.getCostBreakdown().getUserBudget(), 0.01);
        assertEquals(1200.0, trip.getCostBreakdown().getTotalEstimated(), 1.0);
    }

    @Test
    void testTwoDayItineraryWithClustering() {
        when(discoverService.discover("Tokyo")).thenReturn(mockTokyoResponse());

        TripRequest req = new TripRequest();
        req.setDestinationName("Tokyo");
        req.setStartDate(LocalDate.now().plusDays(10).toString());
        req.setNumDays(2);
        req.setNumTravelers(2);
        req.setBudget(2500.0);
        req.setCurrency("EUR");
        req.setTravelStyle("Luxury");
        req.setInterests(List.of("Culture", "Shopping"));

        Trip trip = generator.generate(req);

        assertNotNull(trip);
        assertEquals(2, trip.getDays().size());
        assertEquals("EUR", trip.getCurrency());

        for (Trip.ItineraryDay day : trip.getDays()) {
            assertFalse(day.getActivities().isEmpty(), "Each day must have scheduled activities");
            // Check that stops within day have travel time estimates
            for (Trip.ActivityItem act : day.getActivities()) {
                assertNotNull(act.getEstimatedTravelTimeFromPrevious());
                assertTrue(act.getEstimatedTravelTimeFromPrevious().contains("(estimate)"));
            }
        }
    }

    @Test
    void testFiveDayItineraryWithLighterLastDayAndGenericMeals() {
        when(discoverService.discover("Tokyo")).thenReturn(mockTokyoResponse());

        TripRequest req = new TripRequest();
        req.setDestinationName("Tokyo");
        req.setStartDate(LocalDate.now().plusDays(14).toString());
        req.setNumDays(5);
        req.setNumTravelers(3);
        req.setBudget(500000.0);
        req.setCurrency("JPY");
        req.setTravelStyle("Budget");
        req.setInterests(List.of("Nature", "Food"));

        Trip trip = generator.generate(req);

        assertEquals(5, trip.getDays().size());

        // Lighter last day test (Day 5 should have fewer stops)
        Trip.ItineraryDay day5 = trip.getDays().get(4);
        assertTrue(day5.getActivities().size() <= 3, "Last day should be relaxed/lighter");

        // Verify NO Kerala food hardcoded anywhere
        for (Trip.ItineraryDay day : trip.getDays()) {
            assertNotNull(day.getMeals());
            String mealsText = (day.getMeals().getBreakfast() + " " + day.getMeals().getLunch() + " " + day.getMeals().getDinner()).toLowerCase();
            assertFalse(mealsText.contains("appam"), "Should not contain hardcoded Kerala meal: appam");
            assertFalse(mealsText.contains("puttu"), "Should not contain hardcoded Kerala meal: puttu");
            assertFalse(mealsText.contains("kerala thali"), "Should not contain hardcoded Kerala meal: kerala thali");
        }
    }

    @Test
    void testCostBreakdownPercentages() {
        Trip.CostBreakdown cost = generator.calculateCostBreakdown(1000.0, "USD", "Budget", 2, 3);
        assertEquals(350.0, cost.getAccommodation(), 1.0);
        assertEquals(250.0, cost.getFood(), 1.0);
        assertEquals(200.0, cost.getTransport(), 1.0);
        assertEquals(200.0, cost.getActivities(), 1.0);
        assertEquals(1000.0, cost.getTotalEstimated(), 1.0);
        assertEquals("on_budget", cost.getStatus());
    }
}

