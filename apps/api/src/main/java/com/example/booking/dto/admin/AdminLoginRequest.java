package com.example.booking.dto.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Value;

@Value
public class AdminLoginRequest {
    @Email
    @NotBlank
    String email;

    @NotBlank
    String password;
}
