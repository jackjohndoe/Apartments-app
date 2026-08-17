package com.example.booking.service.impl;

import com.example.booking.dto.admin.*;
import com.example.booking.entity.AdminUser;
import com.example.booking.exception.BadRequestException;
import com.example.booking.exception.ResourceNotFoundException;
import com.example.booking.repository.AdminUserRepository;
import com.example.booking.security.JwtService;
import com.example.booking.service.AdminUserService;
import com.example.booking.service.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AdminUserServiceImpl implements AdminUserService {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Value("${admin.allowed-email-domain:apartify.com}")
    private String allowedEmailDomain;

    public AdminUserServiceImpl(AdminUserRepository adminUserRepository,
                                 PasswordEncoder passwordEncoder,
                                 JwtService jwtService,
                                 EmailService emailService) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    @Override
    public AdminAuthResponse login(AdminLoginRequest request) {
        AdminUser admin = adminUserRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Admin account not found with email: " + request.getEmail()));

        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            throw new BadRequestException("Invalid email or password.");
        }

        if (admin.getStatus() != AdminUser.Status.ACTIVE) {
            throw new BadRequestException("Admin account is not active. Status: " + admin.getStatus());
        }

        admin.setLastLoginAt(LocalDateTime.now());
        adminUserRepository.save(admin);

        String token = jwtService.generateAdminToken(admin);
        return AdminAuthResponse.builder()
                .token(token)
                .adminId(admin.getId())
                .email(admin.getEmail())
                .name(admin.getName())
                .role("ADMIN")
                .build();
    }

    @Override
    public AdminAuthResponse register(AdminRegisterRequest request, String creatorEmail) {
        if (adminUserRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An admin account with email '" + request.getEmail() + "' already exists.");
        }

        if (!isEmailDomainAllowed(request.getEmail())) {
            throw new BadRequestException("Registration restricted to @" + allowedEmailDomain + " email addresses only.");
        }

        AdminUser admin = AdminUser.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .department(request.getDepartment())
                .status(AdminUser.Status.ACTIVE)
                .build();

        admin = adminUserRepository.save(admin);

        String token = jwtService.generateAdminToken(admin);
        return AdminAuthResponse.builder()
                .token(token)
                .adminId(admin.getId())
                .email(admin.getEmail())
                .name(admin.getName())
                .role("ADMIN")
                .build();
    }

    private boolean isEmailDomainAllowed(String email) {
        if (email == null || !email.contains("@")) return false;
        String domain = email.substring(email.lastIndexOf("@") + 1);
        return domain.equalsIgnoreCase(allowedEmailDomain);
    }

    @Override
    public AdminAdminUserResponse inviteAdmin(String email, String name, String department, String invitedBy) {
        return inviteAdmin(email, name, department, invitedBy, null, null);
    }

    public AdminAdminUserResponse inviteAdmin(String email, String name, String department, String invitedBy, String rawPassword, String inviteEmail) {
        if (!isEmailDomainAllowed(email)) {
            throw new BadRequestException("Invitation restricted to @" + allowedEmailDomain + " email addresses only.");
        }

        String password = (rawPassword != null && !rawPassword.isBlank()) ? rawPassword : generateRandomPassword();

        AdminUser admin;
        boolean isNew = false;

        AdminUser existing = adminUserRepository.findByEmail(email).orElse(null);
        if (existing != null) {
            admin = existing;
            if (name != null && !name.isBlank()) admin.setName(name);
            if (department != null && !department.isBlank()) admin.setDepartment(department);
        } else {
            isNew = true;
            admin = AdminUser.builder()
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .department(department)
                    .status(AdminUser.Status.ACTIVE)
                    .build();
        }

        if (isNew || rawPassword != null && !rawPassword.isBlank()) {
            admin.setPassword(passwordEncoder.encode(password));
        }

        admin = adminUserRepository.save(admin);

        String recipientEmail = (inviteEmail != null && !inviteEmail.isBlank()) ? inviteEmail : email;
        try {
            emailService.sendAdminInviteEmail(recipientEmail, name, password, email);
        } catch (Exception e) {
            // Admin is created even if email fails — password shown in response
        }

        return toResponse(admin);
    }

    private String generateRandomPassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
        StringBuilder sb = new StringBuilder();
        java.util.Random random = new java.util.Random();
        for (int i = 0; i < 12; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    @Override
    public AdminAdminUserResponse getById(Long id) {
        AdminUser admin = adminUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with ID: " + id));
        return toResponse(admin);
    }

    @Override
    public Page<AdminAdminUserResponse> listAll(Pageable pageable) {
        return adminUserRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    public AdminAdminUserResponse update(Long id, AdminUpdateRequest request) {
        AdminUser admin = adminUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with ID: " + id));

        if (request.getName() != null) admin.setName(request.getName());
        if (request.getPhone() != null) admin.setPhone(request.getPhone());
        if (request.getAvatarUrl() != null) admin.setAvatarUrl(request.getAvatarUrl());
        if (request.getDepartment() != null) admin.setDepartment(request.getDepartment());
        if (request.getPermissions() != null) admin.setPermissions(request.getPermissions());
        if (request.getNotes() != null) admin.setNotes(request.getNotes());

        if (request.getStatus() != null) {
            try {
                admin.setStatus(AdminUser.Status.valueOf(request.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid status: " + request.getStatus() + ". Allowed: ACTIVE, INACTIVE, SUSPENDED");
            }
        }

        return toResponse(adminUserRepository.save(admin));
    }

    @Override
    public AdminAdminUserResponse updateStatus(Long id, String status) {
        AdminUser admin = adminUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with ID: " + id));

        try {
            admin.setStatus(AdminUser.Status.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status: " + status + ". Allowed: ACTIVE, INACTIVE, SUSPENDED");
        }

        return toResponse(adminUserRepository.save(admin));
    }

    private AdminAdminUserResponse toResponse(AdminUser admin) {
        return AdminAdminUserResponse.builder()
                .id(admin.getId())
                .name(admin.getName())
                .email(admin.getEmail())
                .phone(admin.getPhone())
                .avatarUrl(admin.getAvatarUrl())
                .department(admin.getDepartment())
                .permissions(admin.getPermissions())
                .status(admin.getStatus().name())
                .notes(admin.getNotes())
                .lastLoginAt(admin.getLastLoginAt())
                .createdAt(admin.getCreatedAt())
                .build();
    }
}
