package com.myfinance.auth;

import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.time.Instant;
import java.util.Set;

@ApplicationScoped
public class JwtService {

    @ConfigProperty(name = "mp.jwt.verify.issuer")
    String issuer;

    @ConfigProperty(name = "smallrye.jwt.new-token.lifespan")
    Long lifespanInSeconds;

    /**
     * Generates a JWT token for the given user with a 3-hour expiration.
     */
    public String generateToken(String userId, String email, String name) {
        return Jwt.issuer(issuer)
                .subject(userId)
                .claim("email", email)
                .claim("name", name)
                .groups(Set.of("User"))
                .expiresIn(Duration.ofSeconds(lifespanInSeconds))
                .sign();
    }
}
