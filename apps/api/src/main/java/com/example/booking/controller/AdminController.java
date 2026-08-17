package com.example.booking.controller;

import com.example.booking.dto.admin.*;
import com.example.booking.dto.common.PageResponse;
import com.example.booking.dto.listing.ListingRequest;
import com.example.booking.dto.listing.ListingResponse;
import com.example.booking.entity.*;
import com.example.booking.exception.BadRequestException;
import com.example.booking.exception.ResourceNotFoundException;
import com.example.booking.repository.*;
import com.example.booking.service.AdminUserService;
import com.example.booking.service.AuditService;
import com.example.booking.service.BookingService;
import com.example.booking.service.ListingService;
import com.example.booking.service.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin-only endpoints for dashboard and management")
public class AdminController {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final BookingRepository bookingRepository;
    private final ListingPhotoRepository listingPhotoRepository;
    private final TransactionRepository transactionRepository;
    private final AuditLogRepository auditLogRepository;
    private final FavoriteRepository favoriteRepository;
    private final ReviewRepository reviewRepository;
    private final WalletRepository walletRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final AdminUserService adminUserService;
    private final ListingService listingService;
    private final BookingService bookingService;
    private final StorageService storageService;

    public AdminController(UserRepository userRepository,
                           ListingRepository listingRepository,
                           BookingRepository bookingRepository,
                           ListingPhotoRepository listingPhotoRepository,
                           TransactionRepository transactionRepository,
                           AuditLogRepository auditLogRepository,
                           FavoriteRepository favoriteRepository,
                           ReviewRepository reviewRepository,
                           WalletRepository walletRepository,
                           PasswordResetTokenRepository passwordResetTokenRepository,
                           AdminUserService adminUserService,
                           ListingService listingService,
                           BookingService bookingService,
                           StorageService storageService) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.bookingRepository = bookingRepository;
        this.listingPhotoRepository = listingPhotoRepository;
        this.transactionRepository = transactionRepository;
        this.auditLogRepository = auditLogRepository;
        this.favoriteRepository = favoriteRepository;
        this.reviewRepository = reviewRepository;
        this.walletRepository = walletRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.adminUserService = adminUserService;
        this.listingService = listingService;
        this.bookingService = bookingService;
        this.storageService = storageService;
    }

    @Operation(summary = "Get platform statistics")
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        long totalUsers = userRepository.count();
        long totalListings = listingRepository.count();
        long totalBookings = bookingRepository.count();
        long totalPhotos = listingPhotoRepository.count();

        long hosts = userRepository.countByRole(User.Role.HOST);
        long guests = totalUsers - hosts;

        BigDecimal revenue = transactionRepository.findAll().stream()
                .filter(t -> t.getStatus() == Transaction.Status.COMPLETED)
                .filter(t -> t.getType() == Transaction.Type.BOOKING_PAYMENT || t.getType() == Transaction.Type.ESCROW_RELEASE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDate today = LocalDate.now();
        long completedBookings = bookingRepository.countByEndDateBefore(today);
        long activeBookings = bookingRepository.countByStartDateLessThanEqualAndEndDateGreaterThanEqual(today, today);

        return ResponseEntity.ok(AdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalHosts(hosts)
                .totalGuests(guests)
                .totalListings(totalListings)
                .totalBookings(totalBookings)
                .totalPhotos(totalPhotos)
                .totalRevenue(revenue)
                .activeBookings(activeBookings)
                .completedBookings(completedBookings)
                .build());
    }

    @Operation(summary = "List all users (guests and hosts)")
    @GetMapping("/users")
    public ResponseEntity<PageResponse<AdminUserResponse>> getUsers(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "role", required = false) String role,
            @RequestParam(name = "q", required = false) String search) {
        Pageable pageable = PageRequest.of(page, size);
        String query = search == null ? "" : search.trim();

        User.Role parsedRole = null;
        if (role != null && !role.isBlank()) {
            try {
                parsedRole = User.Role.valueOf(role.toUpperCase());
            } catch (IllegalArgumentException ignored) {
            }
        }

        Page<User> users;
        if (!query.isEmpty()) {
            users = userRepository.search(query, parsedRole, pageable);
        } else if (parsedRole != null) {
            users = userRepository.findByRole(parsedRole, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        Page<AdminUserResponse> response = users.map(u -> AdminUserResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .role(u.getRole().name())
                .avatarUrl(u.getAvatarUrl())
                .location(u.getLocation())
                .listingCount(u.getListings() != null ? u.getListings().size() : 0)
                .bookingCount(bookingRepository.findByUserId(u.getId(), PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements())
                .createdAt(null)
                .kycLevel(u.getKycLevel() != null ? u.getKycLevel().name() : null)
                .kycDocumentType(u.getKycDocumentType())
                .kycDocumentNumberMasked(u.getKycDocumentNumberMasked())
                .boundBankCode(u.getBoundBankCode())
                .boundBankAccountNumber(u.getBoundBankAccountNumber())
                .boundBankAccountName(u.getBoundBankAccountName())
                .boundBankVerifiedAt(u.getBoundBankVerifiedAt())
                .build());

        return ResponseEntity.ok(PageResponse.from(response));
    }

    @Operation(summary = "Get user details by ID")
    @GetMapping("/users/{id}")
    public ResponseEntity<AdminUserResponse> getUser(@PathVariable Long id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        return ResponseEntity.ok(AdminUserResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .role(u.getRole().name())
                .avatarUrl(u.getAvatarUrl())
                .location(u.getLocation())
                .listingCount(u.getListings() != null ? u.getListings().size() : 0)
                .bookingCount(bookingRepository.findByUserId(u.getId(), PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements())
                .createdAt(null)
                .kycLevel(u.getKycLevel() != null ? u.getKycLevel().name() : null)
                .kycDocumentType(u.getKycDocumentType())
                .kycDocumentNumberMasked(u.getKycDocumentNumberMasked())
                .boundBankCode(u.getBoundBankCode())
                .boundBankAccountNumber(u.getBoundBankAccountNumber())
                .boundBankAccountName(u.getBoundBankAccountName())
                .boundBankVerifiedAt(u.getBoundBankVerifiedAt())
                .build());
    }

    @Operation(summary = "Update user role")
    @PutMapping("/users/{id}/role")
    public ResponseEntity<AdminUserResponse> updateUserRole(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        String newRole = body.get("role");
        if (newRole == null || newRole.isBlank()) {
            throw new BadRequestException("Role is required.");
        }

        try {
            user.setRole(User.Role.valueOf(newRole.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + newRole + ". Allowed: GUEST, HOST");
        }

        userRepository.save(user);

        return ResponseEntity.ok(AdminUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .avatarUrl(user.getAvatarUrl())
                .location(user.getLocation())
                .kycLevel(user.getKycLevel() != null ? user.getKycLevel().name() : null)
                .kycDocumentType(user.getKycDocumentType())
                .kycDocumentNumberMasked(user.getKycDocumentNumberMasked())
                .boundBankCode(user.getBoundBankCode())
                .boundBankAccountNumber(user.getBoundBankAccountNumber())
                .boundBankAccountName(user.getBoundBankAccountName())
                .boundBankVerifiedAt(user.getBoundBankVerifiedAt())
                .build());
    }

    @Operation(summary = "Delete a user and all related data (listings, bookings, transactions, wallet)")
    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        user.getListings().forEach(listing ->
                listing.getPhotos().forEach(photo -> storageService.delete(photo.getPath())));
        user.getListings().forEach(listing -> favoriteRepository.deleteByListingId(listing.getId()));

        passwordResetTokenRepository.deleteByUser(user);
        reviewRepository.deleteByUserId(id);
        transactionRepository.deleteByUserId(id);
        bookingRepository.deleteByUserId(id);
        favoriteRepository.deleteByUserId(id);
        auditLogRepository.deleteByUserId(id);
        walletRepository.findByUserId(id).ifPresent(walletRepository::delete);

        userRepository.delete(user);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "List all admin users")
    @GetMapping("/admins")
    public ResponseEntity<PageResponse<AdminAdminUserResponse>> getAdmins(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(PageResponse.from(adminUserService.listAll(pageable)));
    }

    @Operation(summary = "Get admin user details by ID")
    @GetMapping("/admins/{id}")
    public ResponseEntity<AdminAdminUserResponse> getAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.getById(id));
    }

    @Operation(summary = "Update admin user")
    @PutMapping("/admins/{id}")
    public ResponseEntity<AdminAdminUserResponse> updateAdmin(
            @PathVariable Long id,
            @RequestBody AdminUpdateRequest request) {
        return ResponseEntity.ok(adminUserService.update(id, request));
    }

    @Operation(summary = "Update admin user status")
    @PatchMapping("/admins/{id}/status")
    public ResponseEntity<AdminAdminUserResponse> updateAdminStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            throw new BadRequestException("Status is required.");
        }
        return ResponseEntity.ok(adminUserService.updateStatus(id, status));
    }

    @Operation(summary = "List all bookings (admin view)")
    @GetMapping("/bookings")
    public ResponseEntity<PageResponse<AdminBookingResponse>> getBookings(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "q", required = false) String search) {
        Pageable pageable = PageRequest.of(page, size);
        String query = search == null ? "" : search.trim();

        Page<Booking> bookings;
        if (!query.isEmpty()) {
            Long idMatch = null;
            try {
                idMatch = Long.parseLong(query);
            } catch (NumberFormatException ignored) {
            }
            bookings = bookingRepository.search(query, idMatch == null ? -1L : idMatch, pageable);
        } else {
            bookings = bookingRepository.findAll(pageable);
        }

        LocalDate today = LocalDate.now();
        Page<AdminBookingResponse> response = bookings.map(b -> {
            String status;
            if (b.getEndDate().isBefore(today)) status = "COMPLETED";
            else if (b.getStartDate().isAfter(today)) status = "UPCOMING";
            else status = "ACTIVE";

            return AdminBookingResponse.builder()
                    .id(b.getId())
                    .listingId(b.getListing().getId())
                    .listingTitle(b.getListing().getTitle())
                    .userId(b.getUser().getId())
                    .userName(b.getUser().getName())
                    .userEmail(b.getUser().getEmail())
                    .hostName(b.getListing().getHost() != null ? b.getListing().getHost().getName() : "Unknown")
                    .hostEmail(b.getListing().getHost() != null ? b.getListing().getHost().getEmail() : "Unknown")
                    .startDate(b.getStartDate())
                    .endDate(b.getEndDate())
                    .totalPrice(b.getTotalPrice())
                    .status(status)
                    .createdAt(null)
                    .build();
        });

        return ResponseEntity.ok(PageResponse.from(response));
    }

    @Operation(summary = "Cancel a booking (admin override)")
    @DeleteMapping("/bookings/{id}")
    @Transactional
    public ResponseEntity<Void> cancelBooking(@PathVariable Long id) {
        bookingService.cancelBooking(id, bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id))
                .getUser());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Complete a booking and release escrow to host (admin override)")
    @PostMapping("/bookings/{id}/complete")
    @Transactional
    public ResponseEntity<Void> completeBooking(@PathVariable Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));
        User actor = booking.getListing().getHost() != null
                ? booking.getListing().getHost()
                : booking.getUser();
        bookingService.completeBooking(id, actor);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "List all listings (admin view)")
    @GetMapping("/listings")
    public ResponseEntity<PageResponse<AdminListingResponse>> getListings(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "q", required = false) String search) {
        Pageable pageable = PageRequest.of(page, size);
        String query = search == null ? "" : search.trim();

        Page<Listing> listings;
        if (!query.isEmpty()) {
            listings = listingRepository.search(query, pageable);
        } else {
            listings = listingRepository.findAll(pageable);
        }

        Page<AdminListingResponse> response = listings.map(l -> {
            long bookingCount = bookingRepository.findByListingId(l.getId()) != null
                    ? bookingRepository.findByListingId(l.getId()).size() : 0;

            return AdminListingResponse.builder()
                    .id(l.getId())
                    .title(l.getTitle())
                    .location(l.getLocation())
                    .price(l.getPrice())
                    .hostName(l.getHost() != null ? l.getHost().getName() : "Unknown")
                    .hostEmail(l.getHost() != null ? l.getHost().getEmail() : "Unknown")
                    .averageRating(l.getAverageRating())
                    .reviewCount(l.getReviewCount())
                    .photoCount(l.getPhotos() != null ? l.getPhotos().size() : 0)
                    .bookingCount(bookingCount)
                    .createdAt(l.getCreatedAt())
                    .build();
        });

        return ResponseEntity.ok(PageResponse.from(response));
    }

    @Operation(summary = "Create a listing on behalf of a host (admin)")
    @PostMapping("/listings")
    public ResponseEntity<ListingResponse> createListing(@RequestBody ListingRequest request) {
        return ResponseEntity.ok(listingService.createListing(request, null));
    }

    @Operation(summary = "Delete a listing (admin override)")
    @DeleteMapping("/listings/{id}")
    @Transactional
    public ResponseEntity<Void> deleteListing(@PathVariable Long id) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with ID: " + id));

        listing.getBookings().forEach(booking -> transactionRepository.deleteByBookingId(booking.getId()));
        listing.getPhotos().forEach(photo -> storageService.delete(photo.getPath()));
        favoriteRepository.deleteByListingId(id);
        listingRepository.delete(listing);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "List all transactions (admin view)")
    @GetMapping("/transactions")
    public ResponseEntity<PageResponse<AdminTransactionResponse>> getTransactions(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Transaction> transactions = transactionRepository.findAll(pageable);

        Page<AdminTransactionResponse> response = transactions.map(t -> AdminTransactionResponse.builder()
                .id(t.getId())
                .userId(t.getUser() != null ? t.getUser().getId() : null)
                .userName(t.getUser() != null ? t.getUser().getName() : "Unknown")
                .userEmail(t.getUser() != null ? t.getUser().getEmail() : "Unknown")
                .bookingId(t.getBooking() != null ? t.getBooking().getId() : null)
                .type(t.getType().name())
                .status(t.getStatus().name())
                .amount(t.getAmount())
                .currency(t.getCurrency())
                .description(t.getDescription())
                .reference(t.getReference())
                .createdAt(t.getCreatedAt())
                .processedAt(t.getProcessedAt())
                .build());

        return ResponseEntity.ok(PageResponse.from(response));
    }

    @Operation(summary = "Get audit logs")
    @GetMapping("/audit-logs")
    public ResponseEntity<PageResponse<AdminAuditLogResponse>> getAuditLogs(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLog> logs = auditLogRepository.findAll(pageable);

        Page<AdminAuditLogResponse> response = logs.map(a -> AdminAuditLogResponse.builder()
                .id(a.getId())
                .userId(a.getUser().getId())
                .userName(a.getUser().getName())
                .userEmail(a.getUser().getEmail())
                .action(a.getAction())
                .resourceType(a.getResourceType())
                .resourceId(a.getResourceId())
                .description(a.getDescription())
                .ipAddress(a.getIpAddress())
                .createdAt(a.getCreatedAt())
                .build());

        return ResponseEntity.ok(PageResponse.from(response));
    }
}
