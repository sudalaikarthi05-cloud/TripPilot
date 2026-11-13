package com.trippilot.client;

import java.util.Locale;

public record GeocodedPlace(
        String name,
        String displayName,
        String region,
        String country,
        double lat,
        double lng,
        String type,
        String addresstype,
        int placeRank,
        double importance,
        String wikipediaTag
) {

    public boolean isBroadArea() {
        String kind = ((type == null ? "" : type) + " " + (addresstype == null ? "" : addresstype))
                .toLowerCase(Locale.ROOT);
        return kind.contains("country")
                || kind.contains("state")
                || kind.contains("province")
                || kind.contains("region");
    }

    public boolean isCountry() {
        return "country".equalsIgnoreCase(addresstype) || "country".equalsIgnoreCase(type);
    }

    public double searchRadiusMeters() {
        if (isCountry()) {
            return 80000;
        }
        if (isBroadArea()) {
            return 60000;
        }
        if (type != null && type.toLowerCase(Locale.ROOT).contains("island")) {
            return 50000;
        }
        return 25000;
    }

    public double geoSearchOffsetDegrees() {
        if (isCountry()) {
            return 0.30;
        }
        return isBroadArea() ? 0.18 : 0.055;
    }
}
