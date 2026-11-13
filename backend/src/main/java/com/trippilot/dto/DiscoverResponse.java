package com.trippilot.dto;

import java.util.List;

public record DiscoverResponse(
        DiscoverPlace place,
        List<DiscoverSpot> spots
) {
}
