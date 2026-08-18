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
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    private final String apiKey;
    private final String apiSecret;
    private final String fromEmail;
    private final String fromName;
    private final String resetPasswordUrl;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public EmailServiceImpl(
            @Value("${mailjet.api-key:}") String apiKey,
            @Value("${mailjet.api-secret:}") String apiSecret,
            @Value("${mailjet.from-email:nigerianapartments@apartifyafrica.site}") String fromEmail,
            @Value("${mailjet.from-name:Nigerian Apartments}") String fromName,
            @Value("${app.reset-password.url:nigerianapartments://reset-password}") String resetPasswordUrl,
            ObjectMapper objectMapper) {
        
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.fromEmail = fromEmail;
        this.fromName = fromName;
        this.resetPasswordUrl = resetPasswordUrl;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        if (this.apiKey == null || this.apiKey.trim().isEmpty() || this.apiSecret == null || this.apiSecret.trim().isEmpty()) {
            log.warn("⚠️ Mailjet API credentials are not configured. Email sending will fail.");
        } else {
            log.info("✅ EmailServiceImpl initialized with Mailjet - From: {} <{}>", this.fromName, this.fromEmail);
        }
    }

    private String getBasicAuthHeader() {
        String credentials = apiKey + ":" + apiSecret;
        return "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        try {
            if (apiKey == null || apiKey.trim().isEmpty() || apiSecret == null || apiSecret.trim().isEmpty()) {
                throw new IllegalStateException("Mailjet API credentials are not configured");
            }

            String resetLink = resetPasswordUrl + "?token=" + resetToken;
            log.info("🔐 PASSWORD RESET LINK: {}", resetLink);

            String htmlContent = buildPasswordResetEmailHtml(resetLink);
            
            Map<String, Object> message = new HashMap<>();
            message.put("From", Map.of("Email", fromEmail, "Name", fromName));
            message.put("To", List.of(Map.of("Email", toEmail)));
            message.put("Subject", "Reset Your Password");
            message.put("HTMLPart", htmlContent);

            Map<String, Object> payload = new HashMap<>();
            payload.put("Messages", List.of(message));

            String jsonBody = objectMapper.writeValueAsString(payload);
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.mailjet.com/v3.1/send"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", getBasicAuthHeader())
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();
            
            log.info("📧 Sending password reset email via Mailjet to: {}", toEmail);
            
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("✅ Password reset email sent successfully via Mailjet. Status: {}", response.statusCode());
            } else {
                log.error("❌ Failed to send email via Mailjet. Status: {}, Body: {}", response.statusCode(), response.body());
                throw new RuntimeException("Mailjet API error: " + response.statusCode() + " - " + response.body());
            }

        } catch (IOException | InterruptedException e) {
            log.error("❌ Error sending password reset email to: {}. Error: {}", toEmail, e.getMessage(), e);
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }

    @Override
    public void sendAdminInviteEmail(String toEmail, String name, String password, String loginEmail) {
        try {
            if (apiKey == null || apiKey.trim().isEmpty() || apiSecret == null || apiSecret.trim().isEmpty()) {
                throw new IllegalStateException("Mailjet API credentials are not configured");
            }

            String htmlContent = buildAdminInviteEmailHtml(name, loginEmail, password);

            Map<String, Object> message = new HashMap<>();
            message.put("From", Map.of("Email", fromEmail, "Name", fromName));
            message.put("To", List.of(Map.of("Email", toEmail)));
            message.put("Subject", "You've Been Invited to Apartify Africa Admin Panel");
            message.put("HTMLPart", htmlContent);

            Map<String, Object> payload = new HashMap<>();
            payload.put("Messages", List.of(message));

            String jsonBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.mailjet.com/v3.1/send"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", getBasicAuthHeader())
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            log.info("📧 Sending admin invite email via Mailjet to: {} (login: {})", toEmail, loginEmail);

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("✅ Admin invite email sent successfully via Mailjet. Status: {}", response.statusCode());
            } else {
                log.error("❌ Failed to send admin invite email via Mailjet. Status: {}, Body: {}", response.statusCode(), response.body());
                throw new RuntimeException("Mailjet API error: " + response.statusCode() + " - " + response.body());
            }

        } catch (IOException | InterruptedException e) {
            log.error("❌ Error sending admin invite email to: {}. Error: {}", toEmail, e.getMessage(), e);
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new RuntimeException("Failed to send admin invite email", e);
        }
    }

    private String buildAdminInviteEmailHtml(String name, String email, String password) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to Apartify Africa Admin</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f0f2f5; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #f59e0b 0%%, #d97706 100%%); padding: 40px 40px 32px; text-align: center;">
                                        <div style="width: 64px; height: 64px; background-color: rgba(255,255,255,0.2); border-radius: 16px; display: inline-block; line-height: 64px; font-size: 28px; margin-bottom: 16px;">🏠</div>
                                        <h1 style="color: #1a1a2e; font-size: 24px; font-weight: 700; margin: 0 0 4px;">Apartify Africa</h1>
                                        <p style="color: #44340a; font-size: 14px; margin: 0; opacity: 0.85;">Admin Panel Invitation</p>
                                    </td>
                                </tr>

                                <!-- Body -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <p style="font-size: 16px; color: #333; margin: 0 0 8px;">Hello <strong>%s</strong>,</p>
                                        <p style="font-size: 15px; color: #555; margin: 0 0 28px; line-height: 1.6;">
                                            You've been invited to join the <strong>Apartify Africa Admin Panel</strong>. We're excited to have you on the team! Below are your login credentials.
                                        </p>

                                        <!-- Credentials Card -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 28px;">
                                            <tr>
                                                <td style="padding: 4px 20px; background-color: #f59e0b; color: #1a1a2e; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                                                    Your Login Credentials
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 24px 20px;">
                                                    <table width="100%%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                                                                <span style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">Login Email</span><br>
                                                                <span style="font-size: 15px; color: #1a1a2e; font-weight: 600;">%s</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 10px 0;">
                                                                <span style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">Password</span><br>
                                                                <span style="font-size: 15px; color: #1a1a2e; font-weight: 600; font-family: 'Courier New', monospace; background-color: #f0f0f0; padding: 4px 10px; border-radius: 4px; display: inline-block; margin-top: 4px;">%s</span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- CTA Button -->
                                        <table width="100%%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" style="padding: 0 0 28px;">
                                                    <a href="https://dashboard-six-lac-95.vercel.app/login" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%%, #d97706 100%%); color: #1a1a2e; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 8px; letter-spacing: 0.3px;">
                                                        Login to Dashboard →
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Security Notice -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                                            <tr>
                                                <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 0 8px 8px 0;">
                                                    <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                                                        <strong>🔒 Security Tip:</strong> Please change your password immediately after your first login for account security.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e5e7eb; text-align: center;">
                                        <p style="font-size: 12px; color: #999; margin: 0 0 4px;">
                                            This is an automated message from Apartify Africa. Please do not reply.
                                        </p>
                                        <p style="font-size: 11px; color: #bbb; margin: 0;">
                                            © 2026 Apartify Africa · All rights reserved
                                        </p>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(name, email, password);
    }

    private String buildPasswordResetEmailHtml(String resetLink) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Your Password</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f0f2f5; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #f59e0b 0%%, #d97706 100%%); padding: 40px 40px 32px; text-align: center;">
                                        <div style="width: 64px; height: 64px; background-color: rgba(255,255,255,0.2); border-radius: 16px; display: inline-block; line-height: 64px; font-size: 28px; margin-bottom: 16px;">🔐</div>
                                        <h1 style="color: #1a1a2e; font-size: 24px; font-weight: 700; margin: 0 0 4px;">Password Reset</h1>
                                        <p style="color: #44340a; font-size: 14px; margin: 0; opacity: 0.85;">Apartify Africa</p>
                                    </td>
                                </tr>

                                <!-- Body -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <p style="font-size: 15px; color: #555; margin: 0 0 28px; line-height: 1.6;">
                                            We received a request to reset your password. Click the button below to create a new password.
                                        </p>

                                        <!-- CTA Button -->
                                        <table width="100%%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" style="padding: 0 0 28px;">
                                                    <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%%, #d97706 100%%); color: #1a1a2e; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 8px; letter-spacing: 0.3px;">
                                                        Reset My Password →
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Link fallback -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                                            <tr>
                                                <td style="background-color: #fafafa; border: 1px solid #e5e7eb; padding: 14px 16px; border-radius: 8px;">
                                                    <p style="margin: 0 0 6px; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">Or copy this link:</p>
                                                    <p style="margin: 0; font-size: 12px; color: #555; word-break: break-all; font-family: 'Courier New', monospace;">%s</p>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Expiry Notice -->
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                                            <tr>
                                                <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 0 8px 8px 0;">
                                                    <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                                                        <strong>⏱️ Note:</strong> This link will expire in <strong>15 minutes</strong>. If you didn't request a password reset, please ignore this email — your password will remain unchanged.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #e5e7eb; text-align: center;">
                                        <p style="font-size: 12px; color: #999; margin: 0 0 4px;">
                                            This is an automated message from Apartify Africa. Please do not reply.
                                        </p>
                                        <p style="font-size: 11px; color: #bbb; margin: 0;">
                                            © 2026 Apartify Africa · All rights reserved
                                        </p>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(resetLink, resetLink);
    }
}
