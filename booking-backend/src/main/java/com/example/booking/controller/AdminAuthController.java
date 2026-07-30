package com.example.booking.controller;

import com.example.booking.dto.admin.*;
import com.example.booking.security.AdminUserDetails;
import com.example.booking.security.BookingUserDetails;
import com.example.booking.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/auth")
@Tag(name = "Admin Auth", description = "Admin authentication endpoints")
public class AdminAuthController {

    private final AdminUserService adminUserService;

    public AdminAuthController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @Operation(summary = "Admin login")
    @PostMapping("/login")
    public ResponseEntity<AdminAuthResponse> login(@Valid @RequestBody AdminLoginRequest request) {
        return ResponseEntity.ok(adminUserService.login(request));
    }

    @Operation(summary = "Create new admin (requires existing admin)")
    @PostMapping("/register")
    public ResponseEntity<AdminAuthResponse> register(
            @Valid @RequestBody AdminRegisterRequest request,
            @AuthenticationPrincipal BookingUserDetails userDetails) {
        String creatorEmail = userDetails != null ? userDetails.getUsername() : "system";
        return ResponseEntity.ok(adminUserService.register(request, creatorEmail));
    }
}
