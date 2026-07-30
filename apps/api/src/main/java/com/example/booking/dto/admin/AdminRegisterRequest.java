package com.example.booking.dto.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Value;

@Value
public class AdminRegisterRequest {
    @NotBlank
    String name;

    @Email
    @NotBlank
    String email;

    @NotBlank
    String password;

    String phone;

    String department;
}
