package com.example.booking.service.impl;

import com.example.booking.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    private final String postmarkApiToken;
    private final String fromEmail;
    private final String fromName;
    private final String resetPasswordUrl;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public EmailServiceImpl(
            @Value("${postmark.api-token:}") String apiToken,
            @Value("${postmark.from-email:nigerianapartments@apartifyafrica.site}") String fromEmail,
            @Value("${postmark.from-name:Nigerian Apartments}") String fromName,
            @Value("${app.reset-password.url:nigerianapartments://reset-password}") String resetPasswordUrl,
            ObjectMapper objectMapper) {
        
        this.postmarkApiToken = apiToken;
        this.fromEmail = fromEmail;
        this.fromName = fromName;
        this.resetPasswordUrl = resetPasswordUrl;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        if (this.postmarkApiToken == null || this.postmarkApiToken.trim().isEmpty()) {
            log.warn("⚠️ Postmark API token is not configured. Email sending will fail.");
        } else {
            log.info("✅ EmailServiceImpl initialized with Postmark - From: {} <{}>", this.fromName, this.fromEmail);
        }
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        try {
            if (postmarkApiToken == null || postmarkApiToken.trim().isEmpty()) {
                throw new IllegalStateException("Postmark API token is not configured");
            }

            // Create deep link with token
            String resetLink = resetPasswordUrl + "?token=" + resetToken;
            log.info("🔐 PASSWORD RESET LINK: {}", resetLink);

            String htmlContent = buildPasswordResetEmailHtml(resetLink);
            
            // Build JSON payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("From", String.format("%s <%s>", fromName, fromEmail));
            payload.put("To", toEmail);
            payload.put("Subject", "Reset Your Password");
            payload.put("HtmlBody", htmlContent);
            payload.put("MessageStream", "outbound");

            String jsonBody = objectMapper.writeValueAsString(payload);
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.postmarkapp.com/email"))
                    .header("Content-Type", "application/json")
                    .header("X-Postmark-Server-Token", postmarkApiToken)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();
            
            log.info("📧 Sending password reset email via Postmark to: {}", toEmail);
            
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("✅ Password reset email sent successfully via Postmark. Status: {}", response.statusCode());
            } else {
                log.error("❌ Failed to send email via Postmark. Status: {}, Body: {}", response.statusCode(), response.body());
                throw new RuntimeException("Postmark API error: " + response.statusCode() + " - " + response.body());
            }

        } catch (IOException | InterruptedException e) {
            log.error("❌ Error sending password reset email to: {}. Error: {}", toEmail, e.getMessage(), e);
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }

    private String buildPasswordResetEmailHtml(String resetLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Your Password</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
                    <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
                    <p>Hello,</p>
                    <p>We received a request to reset your password. If you made this request, please click the link below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s" style="background-color: #FFD700; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #666; font-size: 12px;">%s</p>
                    <p><strong>This link will expire in 15 minutes.</strong></p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">
                        <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email. 
                        Your password will remain unchanged. If you continue to receive these emails, please contact our support team.
                    </p>
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            </body>
            </html>
            """.formatted(resetLink, resetLink);
    }
}
