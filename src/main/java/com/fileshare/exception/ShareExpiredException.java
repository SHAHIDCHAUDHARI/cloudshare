package com.fileshare.exception;

public class ShareExpiredException extends RuntimeException {
    public ShareExpiredException() {
        super("This link has expired and the file was removed.");
    }
}
