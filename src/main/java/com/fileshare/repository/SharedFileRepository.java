package com.fileshare.repository;

import com.fileshare.model.SharedFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SharedFileRepository extends JpaRepository<SharedFile, Long> {

    Optional<SharedFile> findByToken(String token);

    List<SharedFile> findByExpiresAtBefore(LocalDateTime time);

    boolean existsByToken(String token);
}
