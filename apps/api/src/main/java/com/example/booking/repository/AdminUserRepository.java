package com.example.booking.repository;

import com.example.booking.entity.AdminUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminUserRepository extends JpaRepository<AdminUser, Long> {
    Optional<AdminUser> findByEmail(String email);
    boolean existsByEmail(String email);
    Page<AdminUser> findByStatus(AdminUser.Status status, Pageable pageable);
}
