package com.trippilot.util;

import java.text.Normalizer;
import java.util.Locale;

public final class TextUtils {

    private TextUtils() {
    }

    public static String normalize(String input) {
        if (input == null) {
            return "";
        }
        String value = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
        return value;
    }

    public static String cleanText(String input) {
        if (input == null) {
            return "";
        }
        return input.replaceAll("\\s+", " ").trim();
    }

    public static String truncateAtWord(String input, int maxLength) {
        String text = cleanText(input);
        if (text.length() <= maxLength) {
            return text;
        }
        int cut = text.lastIndexOf(' ', maxLength);
        if (cut < maxLength / 2) {
            cut = maxLength;
        }
        return text.substring(0, cut).trim() + "...";
    }

    public static double similarity(String left, String right) {
        String a = normalize(left);
        String b = normalize(right);
        if (a.isEmpty() || b.isEmpty()) {
            return 0;
        }
        if (a.equals(b)) {
            return 1;
        }
        int distance = levenshtein(a, b);
        return 1.0 - ((double) distance / Math.max(a.length(), b.length()));
    }

    public static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double latDelta = Math.toRadians(lat2 - lat1);
        double lngDelta = Math.toRadians(lng2 - lng1);
        double a = Math.pow(Math.sin(latDelta / 2), 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.pow(Math.sin(lngDelta / 2), 2);
        return 2 * 6371.0 * Math.asin(Math.sqrt(a));
    }

    private static int levenshtein(String a, String b) {
        int[] previous = new int[b.length() + 1];
        int[] current = new int[b.length() + 1];

        for (int j = 0; j <= b.length(); j++) {
            previous[j] = j;
        }

        for (int i = 1; i <= a.length(); i++) {
            current[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                current[j] = Math.min(
                        Math.min(current[j - 1] + 1, previous[j] + 1),
                        previous[j - 1] + cost
                );
            }
            int[] swap = previous;
            previous = current;
            current = swap;
        }

        return previous[b.length()];
    }
}
