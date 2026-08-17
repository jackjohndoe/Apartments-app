package com.example.booking.repository;

import com.example.booking.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    long countByRole(User.Role role);

    Page<User> findByRole(User.Role role, Pageable pageable);

    @Query("""
            SELECT u FROM User u
            WHERE (:role IS NULL OR u.role = :role)
              AND (LOWER(u.name) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(u.phone, '')) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<User> search(@Param("q") String q, @Param("role") User.Role role, Pageable pageable);

    Page<User> findByKycLevel(User.KycLevel kycLevel, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.kycLevel IS NOT NULL AND u.kycLevel <> 'UNVERIFIED'")
    Page<User> findByKycLevelNotUnverified(Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u WHERE u.kycLevel IS NOT NULL AND u.kycLevel = 'PENDING'")
    long countPendingKyc();
}
