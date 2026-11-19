package com.fileshare.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Render's free plan puts the app to sleep after 15 minutes without traffic.
 * This service calls the app's own public URL every 10 minutes so it stays awake.
 * Render sets RENDER_EXTERNAL_URL automatically; locally it is empty, so nothing happens.
 */
@Service
public class KeepAliveService {

    private static final Logger log = LoggerFactory.getLogger(KeepAliveService.class);

    private final String healthUrl;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();

    public KeepAliveService(@Value("${RENDER_EXTERNAL_URL:}") String publicUrl) {
        this.healthUrl = publicUrl.isBlank() ? "" : publicUrl.replaceAll("/+$", "") + "/api/health";
        if (healthUrl.isEmpty()) {
            log.info("Keep-alive disabled (no public URL, running locally)");
        } else {
            log.info("Keep-alive enabled, pinging {} every 10 minutes", healthUrl);
        }
    }

    @Scheduled(fixedRate = 600_000, initialDelay = 120_000)
    public void ping() {
        if (healthUrl.isEmpty()) {
            return;
        }
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(healthUrl))
                    .timeout(Duration.ofSeconds(30)).GET().build();
            HttpResponse<Void> res = http.send(req, HttpResponse.BodyHandlers.discarding());
            log.info("Keep-alive ping: HTTP {}", res.statusCode());
        } catch (Exception e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("Keep-alive ping failed: {}", e.getMessage());
        }
    }
}
