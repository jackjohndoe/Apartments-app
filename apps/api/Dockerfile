# Multi-stage build for Spring Boot application
# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create a non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the built JAR from build stage
COPY --from=build /app/target/booking-0.0.1-SNAPSHOT.jar booking-0.0.1-SNAPSHOT.jar

# Expose port (adjust if your app uses a different port)
EXPOSE 8080

# Health check (Increased start period for slow DB connections)
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=5 \
  CMD ["sh", "-c", "wget --no-verbose --tries=1 --spider http://localhost:${PORT:-8084}/api/health || exit 1"]

# Set default environment variable
ENV SPRING_PROFILES_ACTIVE=staging

# Run the application
ENTRYPOINT ["java", "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE}", "-jar", "booking-0.0.1-SNAPSHOT.jar"]

