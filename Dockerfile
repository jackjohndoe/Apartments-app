# Multi-stage build for Spring Boot application
# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml and download dependencies
# Note: Using paths relative to the repository root
COPY booking-backend/pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY booking-backend/src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create a non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the built JAR from build stage
# The JAR name should match what's in booking-backend/pom.xml
COPY --from=build /app/target/booking-0.0.1-SNAPSHOT.jar booking-0.0.1-SNAPSHOT.jar

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "booking-0.0.1-SNAPSHOT.jar"]

