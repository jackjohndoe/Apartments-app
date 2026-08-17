package com.example.booking.config;

import com.example.booking.entity.AdminUser;
import com.example.booking.entity.User;
import com.example.booking.repository.AdminUserRepository;
import com.example.booking.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final AdminUserRepository adminUserRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(AdminUserRepository adminUserRepository,
                      UserRepository userRepository,
                      PasswordEncoder passwordEncoder) {
        this.adminUserRepository = adminUserRepository;
        this.userRepository = userRepository;
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

        seedRegularUser("Test Guest", "test@example.com", "Test@1234", User.Role.GUEST);
        seedRegularUser("Test Host", "host@example.com", "Test@1234", User.Role.HOST);
    }

    private void seedRegularUser(String name, String email, String rawPassword, User.Role role) {
        userRepository.findByEmail(email).ifPresentOrElse(
            user -> {
                if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
                    user.setPassword(passwordEncoder.encode(rawPassword));
                    userRepository.save(user);
                    System.out.println("✅ Test user password reset: " + email);
                }
            },
            () -> {
                User user = User.builder()
                        .name(name)
                        .email(email)
                        .password(passwordEncoder.encode(rawPassword))
                        .role(role)
                        .kycLevel(User.KycLevel.UNVERIFIED)
                        .build();
                userRepository.save(user);
                System.out.println("✅ Test user created: " + email + " / " + rawPassword);
            }
        );
    }
}
