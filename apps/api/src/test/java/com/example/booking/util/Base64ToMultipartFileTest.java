package com.example.booking.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class Base64ToMultipartFileTest {

    private static final String PNG_1x1_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    @Test
    @DisplayName("Parses standard data URI (PNG)")
    void parsesStandardDataUri() {
        String dataUri = "data:image/png;base64," + PNG_1x1_BASE64;
        Base64ToMultipartFile file = new Base64ToMultipartFile(dataUri);
        assertThat(file.getContentType()).isEqualTo("image/png");
        assertThat(file.isEmpty()).isFalse();
        assertThat(file.getSize()).isGreaterThan(0);
        assertThat(file.getOriginalFilename()).endsWith(".png");
    }

    @Test
    @DisplayName("Parses base64 without header (defaults to image/jpeg)")
    void parsesBase64WithoutHeader() {
        Base64ToMultipartFile file = new Base64ToMultipartFile(PNG_1x1_BASE64);
        assertThat(file.getContentType()).isEqualTo("image/jpeg");
        assertThat(file.isEmpty()).isFalse();
        assertThat(file.getSize()).isGreaterThan(0);
        assertThat(file.getOriginalFilename()).endsWith(".jpg");
    }

    @Test
    @DisplayName("Parses header with ;base64 and no comma")
    void parsesHeaderWithoutComma() {
        String input = "data:image/png;base64" + PNG_1x1_BASE64;
        Base64ToMultipartFile file = new Base64ToMultipartFile(input);
        assertThat(file.getContentType()).isEqualTo("image/png");
        assertThat(file.isEmpty()).isFalse();
        assertThat(file.getOriginalFilename()).endsWith(".png");
    }

    @Test
    @DisplayName("Parses URL-safe base64")
    void parsesUrlSafeBase64() {
        byte[] bytes = "hello world?".getBytes(StandardCharsets.UTF_8);
        String urlSafe = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Base64ToMultipartFile file = new Base64ToMultipartFile(urlSafe);
        assertThat(file.isEmpty()).isFalse();
        assertThat(file.getSize()).isEqualTo(bytes.length);
        assertThat(file.getOriginalFilename()).endsWith(".jpg");
    }

    @Test
    @DisplayName("Handles whitespace in base64")
    void handlesWhitespace() {
        String spaced = "data:image/png;base64," + "iVBORw0K GgoAAA ANSUhEUgAAAAEA AAABCAYA AAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGA WjR9awAAAABJ RU5ErkJggg==\n";
        Base64ToMultipartFile file = new Base64ToMultipartFile(spaced);
        assertThat(file.getContentType()).isEqualTo("image/png");
        assertThat(file.isEmpty()).isFalse();
        assertThat(file.getSize()).isGreaterThan(0);
    }

    @Test
    @DisplayName("Rejects invalid strings")
    void rejectsInvalid() {
        assertThatThrownBy(() -> new Base64ToMultipartFile("not-a-base64"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}

