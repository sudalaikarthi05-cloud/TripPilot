package com.trippilot.client;

public record SpotCandidate(
        String id,
        String name,
        String category,
        String description,
        String image,
        String wikipediaUrl,
        String wikidataId,
        double lat,
        double lng,
        double distanceKm,
        boolean categorySearchHit,
        String openingHours,
        String address
) {

    public SpotCandidate(
            String id,
            String name,
            String category,
            String description,
            String image,
            String wikipediaUrl,
            String wikidataId,
            double lat,
            double lng,
            double distanceKm,
            boolean categorySearchHit
    ) {
        this(id, name, category, description, image, wikipediaUrl,
                wikidataId, lat, lng, distanceKm, categorySearchHit, null, null);
    }

    public SpotCandidate withImage(String newImage) {
        return new SpotCandidate(id, name, category, description, newImage, wikipediaUrl,
                wikidataId, lat, lng, distanceKm, categorySearchHit, openingHours, address);
    }

    public SpotCandidate withDescription(String newDescription) {
        return new SpotCandidate(id, name, category, newDescription, image,
                wikipediaUrl, wikidataId, lat, lng, distanceKm, categorySearchHit, openingHours, address);
    }

    public SpotCandidate withOpeningHours(String newOpeningHours) {
        return new SpotCandidate(id, name, category, description, image,
                wikipediaUrl, wikidataId, lat, lng, distanceKm, categorySearchHit, newOpeningHours, address);
    }

    public SpotCandidate withAddress(String newAddress) {
        return new SpotCandidate(id, name, category, description, image,
                wikipediaUrl, wikidataId, lat, lng, distanceKm, categorySearchHit, openingHours, newAddress);
    }

    public int rankScore() {
        int score = 0;
        if (image != null && !image.isBlank()) {
            score += 4;
        }
        if (wikipediaUrl != null && !wikipediaUrl.isBlank()) {
            score += 3;
        }
        if (wikidataId != null && !wikidataId.isBlank()) {
            score += 1;
        }
        return score;
    }
}
