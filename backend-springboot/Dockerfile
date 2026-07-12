# --- Stage 1: Compilation Engine ---
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy the build manifest first to cache dependency layers
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy the standard Maven src directory (contains both java source and resources)
COPY src ./src

# Compile the final executable archive
RUN mvn clean package -DskipTests

# --- Stage 2: Minimal Production Runtime ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Locate the generated jar from the target pool
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8000

ENTRYPOINT ["java", "-jar", "app.jar"]