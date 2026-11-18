package com.fileshare.service;

import com.fileshare.exception.InvalidRequestException;
import com.fileshare.exception.ShareExpiredException;
import com.fileshare.exception.ShareNotFoundException;
import com.fileshare.model.SharedFile;
import com.fileshare.repository.SharedFileRepository;
import com.fileshare.storage.StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class FileService {

    private static final Logger log = LoggerFactory.getLogger(FileService.class);
    private static final String ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int TOKEN_LENGTH = 8;
    private static final int MAX_EXPIRY_HOURS = 168; // 7 days

    private final SharedFileRepository repository;
    private final StorageService storage;
    private final SecureRandom random = new SecureRandom();

    public FileService(SharedFileRepository repository, StorageService storage) {
        this.repository = repository;
        this.storage = storage;
    }

    /** Saves the file bytes in storage and its details in the database. */
    public SharedFile upload(MultipartFile file, int expiryHours) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("Please choose a file to upload.");
        }
        if (expiryHours < 1 || expiryHours > MAX_EXPIRY_HOURS) {
            throw new InvalidRequestException("Expiry must be between 1 hour and 7 days.");
        }

        String storageKey = UUID.randomUUID().toString();
        storage.store(storageKey, file.getBytes(), file.getContentType());

        SharedFile sf = new SharedFile();
        sf.setToken(generateToken());
        sf.setOriginalName(cleanName(file.getOriginalFilename()));
        sf.setContentType(file.getContentType());
        sf.setFileSize(file.getSize());
        sf.setStorageKey(storageKey);
        sf.setUploadedAt(LocalDateTime.now());
        sf.setExpiresAt(LocalDateTime.now().plusHours(expiryHours));
        return repository.save(sf);
    }

    /** Returns the file details if the link exists and has not expired. */
    public SharedFile getActive(String token) {
        SharedFile sf = repository.findByToken(token).orElseThrow(() -> new ShareNotFoundException(token));
        if (sf.isExpired()) {
            throw new ShareExpiredException();
        }
        return sf;
    }

    /** Counts the download and returns the file bytes. */
    @Transactional
    public byte[] download(SharedFile sf) throws IOException {
        byte[] data = storage.load(sf.getStorageKey());
        sf.setDownloadCount(sf.getDownloadCount() + 1);
        repository.save(sf);
        return data;
    }

    /** Runs every hour and removes expired files from storage and database. */
    @Scheduled(fixedRate = 3_600_000, initialDelay = 60_000)
    public void deleteExpiredFiles() {
        List<SharedFile> expired = repository.findByExpiresAtBefore(LocalDateTime.now());
        for (SharedFile sf : expired) {
            try {
                storage.delete(sf.getStorageKey());
                repository.delete(sf);
            } catch (IOException e) {
                log.warn("Could not delete {}: {}", sf.getToken(), e.getMessage());
            }
        }
        if (!expired.isEmpty()) {
            log.info("Cleanup removed {} expired file(s)", expired.size());
        }
    }

    private String generateToken() {
        String token;
        do {
            StringBuilder sb = new StringBuilder(TOKEN_LENGTH);
            for (int i = 0; i < TOKEN_LENGTH; i++) {
                sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
            }
            token = sb.toString();
        } while (repository.existsByToken(token));
        return token;
    }

    private String cleanName(String name) {
        if (name == null || name.isBlank()) {
            return "file";
        }
        // keep only the file name part, drop any folder path sent by the browser
        return name.replaceAll(".*[\\\\/]", "");
    }
}
