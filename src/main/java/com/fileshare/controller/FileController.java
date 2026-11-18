package com.fileshare.controller;

import com.fileshare.model.SharedFile;
import com.fileshare.service.FileService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    public record UploadResponse(String token, String link, String fileName, long size, LocalDateTime expiresAt) {}

    public record FileInfo(String fileName, long size, LocalDateTime uploadedAt, LocalDateTime expiresAt, int downloads) {}

    @PostMapping("/upload")
    public UploadResponse upload(@RequestParam("file") MultipartFile file,
                                 @RequestParam(value = "expiryHours", defaultValue = "24") int expiryHours) throws IOException {
        SharedFile sf = fileService.upload(file, expiryHours);
        String link = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/f/").path(sf.getToken()).toUriString();
        return new UploadResponse(sf.getToken(), link, sf.getOriginalName(), sf.getFileSize(), sf.getExpiresAt());
    }

    @GetMapping("/files/{token}")
    public FileInfo info(@PathVariable String token) {
        SharedFile sf = fileService.getActive(token);
        return new FileInfo(sf.getOriginalName(), sf.getFileSize(), sf.getUploadedAt(), sf.getExpiresAt(), sf.getDownloadCount());
    }

    @GetMapping("/files/{token}/download")
    public ResponseEntity<byte[]> download(@PathVariable String token) throws IOException {
        SharedFile sf = fileService.getActive(token);
        byte[] data = fileService.download(sf);

        ContentDisposition cd = ContentDisposition.attachment()
                .filename(sf.getOriginalName(), StandardCharsets.UTF_8).build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(data.length)
                .body(data);
    }
}
