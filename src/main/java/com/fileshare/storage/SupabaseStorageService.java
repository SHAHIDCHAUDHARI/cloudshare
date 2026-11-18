package com.fileshare.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/** Stores files in a (private) Supabase Storage bucket using its REST API. Used in the cloud. */
@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "supabase")
public class SupabaseStorageService implements StorageService {

    private final HttpClient http = HttpClient.newHttpClient();
    private final String baseUrl;
    private final String serviceKey;

    public SupabaseStorageService(@Value("${supabase.url}") String url,
                                  @Value("${supabase.key}") String serviceKey,
                                  @Value("${supabase.bucket}") String bucket) {
        this.baseUrl = url.replaceAll("/+$", "") + "/storage/v1/object/" + bucket + "/";
        this.serviceKey = serviceKey;
    }

    @Override
    public void store(String key, byte[] data, String contentType) throws IOException {
        HttpRequest req = base(key)
                .header("Content-Type", contentType == null ? "application/octet-stream" : contentType)
                .POST(HttpRequest.BodyPublishers.ofByteArray(data))
                .build();
        HttpResponse<String> res = send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() >= 300) {
            throw new IOException("Supabase upload failed: " + res.statusCode() + " " + res.body());
        }
    }

    @Override
    public byte[] load(String key) throws IOException {
        HttpResponse<byte[]> res = send(base(key).GET().build(), HttpResponse.BodyHandlers.ofByteArray());
        if (res.statusCode() >= 300) {
            throw new IOException("Supabase download failed: " + res.statusCode());
        }
        return res.body();
    }

    @Override
    public void delete(String key) throws IOException {
        send(base(key).DELETE().build(), HttpResponse.BodyHandlers.discarding());
    }

    private HttpRequest.Builder base(String key) {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(baseUrl + key))
                .header("apikey", serviceKey);
        // Old-style service_role keys are JWTs and go in Authorization too.
        // New sb_secret_ keys are not JWTs, so they are sent only in the apikey header.
        if (serviceKey.startsWith("eyJ")) {
            b.header("Authorization", "Bearer " + serviceKey);
        }
        return b;
    }

    private <T> HttpResponse<T> send(HttpRequest req, HttpResponse.BodyHandler<T> handler) throws IOException {
        try {
            return http.send(req, handler);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Storage request interrupted", e);
        }
    }
}
