package com.example.booking.service;

public interface EmailService {
    void sendPasswordResetEmail(String toEmail, String resetToken);
    void sendAdminInviteEmail(String toEmail, String name, String password);
}

