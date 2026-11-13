package com.trippilot.dto;

public record DiscoverPlace(
        String name,
        String country,
        double lat,
        double lng,
        String summary,
        String image
) {
}
