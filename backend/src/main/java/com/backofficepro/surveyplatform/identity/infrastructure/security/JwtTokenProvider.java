package com.backofficepro.surveyplatform.identity.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * JWT token provider for creating and validating JSON Web Tokens.
 *
 * <p>Handles token generation, validation, and claims extraction for
 * the Spring Security authentication pipeline.</p>
 *
 * @author BackOffice Pro
 */
@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${app.security.jwt.secret}")
    private String jwtSecret;

    @Value("${app.security.jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${app.security.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    @Value("${app.security.jwt.issuer}")
    private String jwtIssuer;

    /**
     * Generates an access token for the authenticated user.
     *
     * @param userDetails the authenticated user details
     * @return the signed JWT access token
     */
    public String generateAccessToken(final UserDetails userDetails) {
        final Map<String, Object> claims = new HashMap<>();
        claims.put("roles", userDetails.getAuthorities().stream()
                .map(Object::toString)
                .collect(Collectors.toList()));
        claims.put("type", "access");
        return buildToken(claims, userDetails.getUsername(), accessTokenExpiration);
    }

    /**
     * Generates a refresh token for the authenticated user.
     *
     * @param userDetails the authenticated user details
     * @return the signed JWT refresh token
     */
    public String generateRefreshToken(final UserDetails userDetails) {
        final Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        return buildToken(claims, userDetails.getUsername(), refreshTokenExpiration);
    }

    /**
     * Extracts the username (subject) from a JWT token.
     *
     * @param token the JWT token
     * @return the username
     */
    public String getUsernameFromToken(final String token) {
        final Claims claims = parseToken(token);
        return claims.getSubject();
    }

    /**
     * Validates a JWT token.
     *
     * @param token the JWT token to validate
     * @return true if the token is valid and not expired
     */
    public boolean validateToken(final String token) {
        try {
            parseToken(token);
            return true;
        } catch (final SecurityException e) {
            log.error("Invalid JWT signature: {}", e.getMessage());
        } catch (final MalformedJwtException e) {
            log.error("Malformed JWT token: {}", e.getMessage());
        } catch (final ExpiredJwtException e) {
            log.error("Expired JWT token: {}", e.getMessage());
        } catch (final UnsupportedJwtException e) {
            log.error("Unsupported JWT token: {}", e.getMessage());
        } catch (final IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Returns the access token expiration time in milliseconds.
     *
     * @return the expiration time
     */
    public long getAccessTokenExpiration() {
        return accessTokenExpiration;
    }

    private String buildToken(final Map<String, Object> claims,
                              final String subject,
                              final long expiration) {
        final Date now = new Date();
        final Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuer(jwtIssuer)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    private Claims parseToken(final String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Key getSigningKey() {
        final byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
