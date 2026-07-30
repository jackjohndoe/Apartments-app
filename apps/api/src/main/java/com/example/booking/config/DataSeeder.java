package com.example.booking.config;

import com.example.booking.entity.AdminUser;
import com.example.booking.repository.AdminUserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(AdminUserRepository adminUserRepository, PasswordEncoder passwordEncoder) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        adminUserRepository.findByEmail("admin@example.com").ifPresentOrElse(
            admin -> {
                if (!passwordEncoder.matches("admin123", admin.getPassword())) {
                    admin.setPassword(passwordEncoder.encode("admin123"));
                    adminUserRepository.save(admin);
                    System.out.println("✅ Default admin password reset: admin@example.com / admin123");
                }
            },
            () -> {
                AdminUser admin = AdminUser.builder()
                        .name("Admin User")
                        .email("admin@example.com")
                        .password(passwordEncoder.encode("admin123"))
                        .department("Management")
                        .permissions("MANAGE_USERS,MANAGE_LISTINGS,VIEW_ANALYTICS")
                        .status(AdminUser.Status.ACTIVE)
                        .build();
                adminUserRepository.save(admin);
                System.out.println("✅ Default admin user created: admin@example.com / admin123");
            }
        );
    }
}
