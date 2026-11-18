package com.fileshare.exception;

public class ShareNotFoundException extends RuntimeException {
    public ShareNotFoundException(String token) {
        super("No file found for link: " + token);
    }
}
