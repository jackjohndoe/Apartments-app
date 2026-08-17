package com.example.booking.controller;

import com.example.booking.dto.kyc.KycStatusResponse;
import com.example.booking.dto.kyc.KycSubmitRequest;
import com.example.booking.security.BookingUserDetails;
import com.example.booking.service.KycService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/kyc")
@Tag(name = "KYC", description = "Identity verification (KYC) endpoints for AML compliance")
public class KycController {

    private final KycService kycService;

    public KycController(KycService kycService) {
        this.kycService = kycService;
    }

    @Operation(summary = "Get KYC status", description = "Returns the authenticated user's verification level and any bound bank account")
    @ApiResponse(responseCode = "200", description = "KYC status retrieved",
            content = @Content(schema = @Schema(implementation = KycStatusResponse.class)))
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/status")
    public ResponseEntity<KycStatusResponse> getStatus(@AuthenticationPrincipal BookingUserDetails userDetails) {
        return ResponseEntity.ok(kycService.getStatus(userDetails.getUser()));
    }

    @Operation(summary = "Submit KYC documents", description = "Submits identity documents for review. Withdrawals are disabled until approved (Basic tier or higher).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "KYC submitted for review",
                    content = @Content(schema = @Schema(implementation = KycStatusResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid submission")
    })
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/submit")
    public ResponseEntity<KycStatusResponse> submit(@Valid @RequestBody KycSubmitRequest request,
                                                    @AuthenticationPrincipal BookingUserDetails userDetails) {
        return ResponseEntity.ok(kycService.submit(userDetails.getUser(), request));
    }
}
