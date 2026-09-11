FROM gradle:8.5-jdk17 AS build
WORKDIR /app
COPY --chown=gradle:gradle . .
RUN gradle --no-daemon test bootWar

FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
RUN groupadd --system ergg && useradd --system --gid ergg --home-dir /app ergg
COPY --from=build --chown=ergg:ergg /app/build/libs/ergg.war /app/ergg.war
USER ergg
ENV SPRING_PROFILES_ACTIVE=render
EXPOSE 10000
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=60.0", "-jar", "/app/ergg.war"]
