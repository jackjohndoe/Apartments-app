package com.example.booking.repository;

import com.example.booking.entity.Listing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {

    @Query("""
            SELECT l FROM Listing l
            WHERE LOWER(l.title) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(l.location) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(COALESCE(l.hostName, '')) LIKE LOWER(CONCAT('%', :q, '%'))
            """)
    Page<Listing> search(@Param("q") String q, Pageable pageable);
}
