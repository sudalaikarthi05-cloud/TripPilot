package com.trippilot.dto;

public record DiscoverSpot(
        String id,
        String name,
        String category,
        String description,
        String image,
        double lat,
        double lng,
        double distanceKm,
        String wikipediaUrl,
        String openingHours,
        String address
) {
    public DiscoverSpot(
            String id,
            String name,
            String category,
            String description,
            String image,
            double lat,
            double lng,
            double distanceKm,
            String wikipediaUrl
    ) {
        this(id, name, category, description, image, lat, lng, distanceKm, wikipediaUrl, null, null);
    }
}
