package com.example.booking.service.impl;

import com.example.booking.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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

    private final String resendApiKey;
    private final String fromEmail;
    private final String fromName;
    private final String resetPasswordUrl;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public EmailServiceImpl(
            @Value("${resend.api-key:}") String apiKey,
            @Value("${resend.from-email:onboarding@resend.dev}") String fromEmail,
            @Value("${resend.from-name:Nigerian Apartments}") String fromName,
            @Value("${app.reset-password.url:myapp://reset-password}") String resetPasswordUrl) {
        
        this.resendApiKey = apiKey;
        this.fromEmail = fromEmail;
        this.fromName = fromName;
        this.resetPasswordUrl = resetPasswordUrl;
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();

        if (this.resendApiKey == null || this.resendApiKey.trim().isEmpty()) {
            log.warn("⚠️ Resend API key is not configured. Email sending will fail.");
        } else {
            log.info("✅ EmailServiceImpl initialized with Resend - From: {} <{}>", this.fromName, this.fromEmail);
        }
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        try {
            if (resendApiKey == null || resendApiKey.trim().isEmpty()) {
                throw new IllegalStateException("Resend API key is not configured");
            }

            // Create deep link with token
            String resetLink = resetPasswordUrl + "?token=" + resetToken;
            log.info("🔐 PASSWORD RESET LINK: {}", resetLink);

            String htmlContent = buildPasswordResetEmailHtml(resetLink);
            
            // Build JSON payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("from", String.format("%s <%s>", fromName, fromEmail));
            payload.put("to", toEmail);
            payload.put("subject", "Reset Your Password");
            payload.put("html", htmlContent);
            
            String jsonBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            log.info("📧 Sending password reset email via Resend to: {}", toEmail);
            
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("✅ Password reset email sent successfully via Resend. ID: {}", response.body());
            } else {
                log.error("❌ Failed to send email via Resend. Status: {}, Body: {}", response.statusCode(), response.body());
                throw new RuntimeException("Resend API error: " + response.statusCode() + " - " + response.body());
            }

        } catch (Exception e) {
            log.error("❌ Error sending password reset email to: {}. Error: {}", toEmail, e.getMessage(), e);
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
