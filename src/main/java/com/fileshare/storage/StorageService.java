package com.fileshare.storage;

import java.io.IOException;

/**
 * Abstraction over "where the file bytes are kept".
 * Locally we use the disk, in the cloud we use Supabase Storage.
 */
public interface StorageService {

    void store(String key, byte[] data, String contentType) throws IOException;

    byte[] load(String key) throws IOException;

    void delete(String key) throws IOException;
}
