package com.trippilot.client;

import com.trippilot.exception.ExternalServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Component
public class ExternalHttpClient {

    private static final Logger log = LoggerFactory.getLogger(ExternalHttpClient.class);
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(8);
    private static final String USER_AGENT = "TripPilot/1.0";

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(CONNECT_TIMEOUT)
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    public String get(String url) {
        return get(url, 2);
    }

    public String get(String url, int attempts) {
        return executeWithRetry("GET " + url, attempts, () -> HttpRequest.newBuilder(URI.create(url))
                .timeout(READ_TIMEOUT)
                .header("User-Agent", USER_AGENT)
                .header("Accept", "application/json")
                .GET()
                .build());
    }

    public String postForm(String url, String formBody) {
        return postForm(url, formBody, 2);
    }

    public String postForm(String url, String formBody, int attempts) {
        return executeWithRetry("POST " + url, attempts, () -> HttpRequest.newBuilder(URI.create(url))
                .timeout(READ_TIMEOUT)
                .header("User-Agent", USER_AGENT)
                .header("Accept", "application/json")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(formBody))
                .build());
    }

    private String executeWithRetry(String label, int attempts, RequestFactory factory) {
        int totalAttempts = Math.max(1, attempts);
        RuntimeException lastFailure = null;

        for (int attempt = 1; attempt <= totalAttempts; attempt++) {
            try {
                HttpResponse<String> response = client.send(factory.create(), HttpResponse.BodyHandlers.ofString());
                int status = response.statusCode();
                if (status >= 200 && status < 300) {
                    return response.body();
                }

                lastFailure = new ExternalServiceException("External service returned HTTP " + status);
                if (status < 500 && status != 429) {
                    break;
                }
                log.warn("{} failed with HTTP {} (attempt {}/{})", label, status, attempt, totalAttempts);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                throw new ExternalServiceException("External request was interrupted", ex);
            } catch (IOException | IllegalArgumentException ex) {
                lastFailure = new ExternalServiceException("External request failed", ex);
                log.warn("{} failed: {} (attempt {}/{})", label, ex.getMessage(), attempt, totalAttempts);
            }

            if (attempt < totalAttempts) {
                sleepBeforeRetry();
            }
        }

        throw lastFailure == null
                ? new ExternalServiceException("External request failed")
                : lastFailure;
    }

    private void sleepBeforeRetry() {
        try {
            Thread.sleep(400);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ExternalServiceException("Retry was interrupted", ex);
        }
    }

    @FunctionalInterface
    private interface RequestFactory {
        HttpRequest create();
    }
}
