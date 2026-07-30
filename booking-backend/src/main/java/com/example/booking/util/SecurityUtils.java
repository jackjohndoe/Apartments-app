package com.example.booking.util;

import com.example.booking.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utility class for security and role-based access control
 */
public class SecurityUtils {

    /**
     * Checks if the current authenticated user has ADMIN role
     */
    public static boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    /**
     * Checks if a user has HOST role
     */
    public static boolean isHost(User user) {
        return user != null && user.getRole() == User.Role.HOST;
    }

    /**
     * Checks if a user has HOST role
     */
    public static boolean isHost() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_HOST"));
    }

    /**
     * Checks if the current user is admin or the given user is a host
     */
    public static boolean isAdminOrHost(User user) {
        return isAdmin() || isHost(user);
    }

    /**
     * Checks if the current user can bypass ownership checks (ADMIN can bypass)
     */
    public static boolean canBypassOwnership() {
        return isAdmin();
    }
}
