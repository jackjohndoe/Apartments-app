package com.example.booking.repository;

import com.example.booking.entity.ComplianceFlag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplianceFlagRepository extends JpaRepository<ComplianceFlag, Long> {

    Page<ComplianceFlag> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<ComplianceFlag> findByResolvedOrderByCreatedAtDesc(boolean resolved, Pageable pageable);

    long countByResolved(boolean resolved);

    long countByUserIdAndResolved(Long userId, boolean resolved);
}
