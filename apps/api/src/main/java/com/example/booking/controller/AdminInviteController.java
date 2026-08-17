package com.example.booking.controller;

import com.example.booking.dto.admin.AdminAdminUserResponse;
import com.example.booking.dto.admin.InviteAdminRequest;
import com.example.booking.security.AdminUserDetails;
import com.example.booking.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/invite")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Invite", description = "Invite new admin users with email credentials")
public class AdminInviteController {

    private final AdminUserService adminUserService;

    public AdminInviteController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @Operation(summary = "Invite a new admin user", description = "Creates an admin account and sends login credentials via email")
    @PostMapping
    public ResponseEntity<AdminAdminUserResponse> inviteAdmin(
            @Valid @RequestBody InviteAdminRequest request,
            @AuthenticationPrincipal AdminUserDetails admin) {
        String inviterEmail = admin != null ? admin.getAdminUser().getEmail() : "system";
        return ResponseEntity.ok(adminUserService.inviteAdmin(
                request.getEmail(), request.getName(), request.getDepartment(), inviterEmail, request.getPassword(), request.getInviteEmail()));
    }
}
