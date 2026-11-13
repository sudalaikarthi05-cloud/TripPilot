package com.trippilot.client;

public record WikiSummary(
        String title,
        String extract,
        String image,
        String wikipediaUrl
) {

    public static WikiSummary empty() {
        return new WikiSummary(null, null, null, null);
    }
}
