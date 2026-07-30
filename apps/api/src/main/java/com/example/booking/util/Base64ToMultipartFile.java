package com.example.booking.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;

/**
 * Utility class to convert base64 data URIs to MultipartFile
 */
public class Base64ToMultipartFile implements MultipartFile {
    private final byte[] content;
    private final String name;
    private final String originalFilename;
    private final String contentType;

    public Base64ToMultipartFile(String base64DataUri) {
        if (base64DataUri == null || base64DataUri.trim().isEmpty()) {
            throw new IllegalArgumentException("Base64 data URI cannot be null or empty");
        }

        String cleaned = base64DataUri.replaceAll("\\s+", "");
        String header = null;
        String base64Data = null;

        if (cleaned.startsWith("data:")) {
            int commaIdx = cleaned.indexOf(',');
            if (commaIdx > 0) {
                header = cleaned.substring(0, commaIdx);
                base64Data = cleaned.substring(commaIdx + 1);
            } else {
                int base64TagIdx = cleaned.indexOf(";base64");
                if (base64TagIdx > 0) {
                    header = cleaned.substring(0, base64TagIdx);
                    base64Data = cleaned.substring(base64TagIdx + 8);
                } else {
                    throw new IllegalArgumentException("Invalid data URI format");
                }
            }
        } else {
            int tagIdx = cleaned.indexOf(";base64,");
            if (tagIdx > 0) {
                header = cleaned.substring(0, tagIdx);
                base64Data = cleaned.substring(tagIdx + 8);
                if (!header.startsWith("data:")) {
                    header = "data:image/jpeg";
                }
            } else if (cleaned.matches("^[A-Za-z0-9+/=_-]+$")) {
                header = "data:image/jpeg";
                base64Data = cleaned;
            } else {
                throw new IllegalArgumentException("Invalid base64 string");
            }
        }

        String ct = "image/jpeg";
        if (header != null && header.toLowerCase().startsWith("data:")) {
            String withoutPrefix = header.substring(5);
            int semiIdx = withoutPrefix.indexOf(';');
            int commaHeaderIdx = withoutPrefix.indexOf(',');
            String typePart;
            if (semiIdx >= 0) {
                typePart = withoutPrefix.substring(0, semiIdx);
            } else if (commaHeaderIdx >= 0) {
                typePart = withoutPrefix.substring(0, commaHeaderIdx);
            } else {
                typePart = withoutPrefix;
            }
            if (typePart != null && !typePart.isBlank()) {
                ct = typePart.trim();
            }
        }
        this.contentType = ct;

        String normalizedData = base64Data != null ? base64Data.replaceAll("\\s+", "") : "";
        byte[] decoded = null;
        try {
            decoded = Base64.getDecoder().decode(normalizedData);
        } catch (IllegalArgumentException e) {
            try {
                decoded = Base64.getUrlDecoder().decode(normalizedData);
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Invalid base64 data: " + ex.getMessage());
            }
        }
        this.content = decoded;

        // Generate filename
        String extension = getExtensionFromContentType(this.contentType);
        this.originalFilename = "image_" + System.currentTimeMillis() + extension;
        this.name = this.originalFilename;
    }

    private String getExtensionFromContentType(String contentType) {
        if (contentType == null) {
            return ".jpg";
        }
        if (contentType.contains("jpeg") || contentType.contains("jpg")) {
            return ".jpg";
        } else if (contentType.contains("png")) {
            return ".png";
        } else if (contentType.contains("gif")) {
            return ".gif";
        } else if (contentType.contains("webp")) {
            return ".webp";
        } else if (contentType.contains("heic")) {
            return ".heic";
        } else if (contentType.contains("heif")) {
            return ".heif";
        } else if (contentType.contains("bmp")) {
            return ".bmp";
        } else if (contentType.contains("tiff")) {
            return ".tiff";
        } else if (contentType.contains("svg")) {
            return ".svg";
        } else if (contentType.contains("avif")) {
            return ".avif";
        }
        return ".jpg"; // default
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public String getOriginalFilename() {
        return originalFilename;
    }

    @Override
    public String getContentType() {
        return contentType;
    }

    @Override
    public boolean isEmpty() {
        return content == null || content.length == 0;
    }

    @Override
    public long getSize() {
        return content != null ? content.length : 0;
    }

    @Override
    public byte[] getBytes() throws IOException {
        return content;
    }

    @Override
    public InputStream getInputStream() throws IOException {
        return new ByteArrayInputStream(content);
    }

    @Override
    public void transferTo(java.io.File dest) throws IOException, IllegalStateException {
        java.nio.file.Files.write(dest.toPath(), content);
    }
}

