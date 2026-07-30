package com.example.booking.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${cors.allowed-origins:*}")
    private String allowedOrigins;

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        List<String> defaultOrigins = Arrays.asList(
            "http://localhost:8081",
            "http://localhost:19006",
            "http://localhost:3001",
            "http://127.0.0.1:8081",
            "http://127.0.0.1:19006",
            "http://127.0.0.1:3000"
        );

        if ("*".equals(allowedOrigins) || allowedOrigins == null || allowedOrigins.trim().isEmpty()) {
            for (String origin : defaultOrigins) {
                config.addAllowedOrigin(origin);
            }
            config.addAllowedOriginPattern("http://localhost:*");
            config.addAllowedOriginPattern("http://127.0.0.1:*");
        } else {
            List<String> origins = Arrays.asList(allowedOrigins.split(","));
            for (String origin : origins) {
                String trimmed = origin.trim();
                if (!trimmed.isEmpty()) {
                    config.addAllowedOrigin(trimmed);
                }
            }
        }

        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowCredentials(true);
        config.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Total-Count"));
        config.setMaxAge(3600L);

        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
