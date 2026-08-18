package com.example.booking.service;

import com.example.booking.dto.admin.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminUserService {
    AdminAuthResponse login(AdminLoginRequest request);
    AdminAuthResponse register(AdminRegisterRequest request, String creatorEmail);
    AdminAdminUserResponse inviteAdmin(String email, String name, String department, String invitedBy);
    AdminAdminUserResponse inviteAdmin(String email, String name, String department, String invitedBy, String rawPassword, String inviteEmail);
    AdminAdminUserResponse getById(Long id);
    Page<AdminAdminUserResponse> listAll(Pageable pageable);
    AdminAdminUserResponse update(Long id, AdminUpdateRequest request);
    AdminAdminUserResponse updateStatus(Long id, String status);
    void delete(Long id);
}
