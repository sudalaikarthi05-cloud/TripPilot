package com.trippilot.service;

import com.trippilot.dto.AuthResponse;
import com.trippilot.dto.LoginRequest;
import com.trippilot.dto.RegisterRequest;
import com.trippilot.dto.UserDto;
import com.trippilot.exception.AuthException;
import com.trippilot.model.User;
import com.trippilot.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final byte[] secretKeyBytes;

    public AuthService(
            UserRepository userRepository,
            @Value("${trippilot.jwt.secret:TripPilotSecretKey2026TouristBusLuxuryTravelTokenHMACSignature}") String secret
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.secretKeyBytes = secret.getBytes(StandardCharsets.UTF_8);
    }

    public AuthResponse register(RegisterRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        String cleanName = request.getName().trim();

        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            throw new IllegalArgumentException("An account with this email already exists. Please log in.");
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword().trim());
        User user = new User(cleanName, cleanEmail, hashedPassword);
        User saved = userRepository.save(user);

        log.info("Registered new user: {} ({})", saved.getName(), saved.getEmail());

        // 7 days token for new registration
        String token = createToken(saved.getId(), 7L * 24 * 3600 * 1000);
        return new AuthResponse(token, UserDto.fromUser(saved), "Account created successfully! Welcome aboard.");
    }

    public AuthResponse login(LoginRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
                .orElseThrow(() -> new AuthException("Invalid email or password. Please try again."));

        if (!passwordEncoder.matches(request.getPassword().trim(), user.getPasswordHash())) {
            throw new AuthException("Invalid email or password. Please try again.");
        }

        long durationMs = request.isRememberMe()
                ? (30L * 24 * 3600 * 1000) // 30 days if remember me
                : (24L * 3600 * 1000);      // 1 day default

        String token = createToken(user.getId(), durationMs);
        log.info("User logged in: {} ({})", user.getName(), user.getEmail());

        return new AuthResponse(token, UserDto.fromUser(user), "Welcome back to TripPilot!");
    }

    public UserDto getUserFromAuthHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new AuthException("Missing or malformed Authorization header.");
        }
        String token = authHeader.substring(7).trim();
        return getUserFromToken(token);
    }

    public UserDto getUserFromToken(String token) {
        if (token == null || token.isBlank()) {
            throw new AuthException("Authentication token is required.");
        }

        try {
            byte[] decoded = Base64.getUrlDecoder().decode(token);
            String payload = new String(decoded, StandardCharsets.UTF_8);
            String[] parts = payload.split(":");
            if (parts.length != 3) {
                throw new AuthException("Malformed authentication token.");
            }

            String userId = parts[0];
            long expiresAt = Long.parseLong(parts[1]);
            String signature = parts[2];

            if (System.currentTimeMillis() > expiresAt) {
                throw new AuthException("Session expired. Please log in again.");
            }

            String expectedSig = sign(userId + ":" + expiresAt);
            if (!MessageDigest.isEqual(expectedSig.getBytes(StandardCharsets.UTF_8), signature.getBytes(StandardCharsets.UTF_8))) {
                throw new AuthException("Invalid token signature.");
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new AuthException("User not found."));

            return UserDto.fromUser(user);
        } catch (AuthException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Token validation failed: {}", e.getMessage());
            throw new AuthException("Invalid session. Please log in again.");
        }
    }

    private String createToken(String userId, long durationMs) {
        long expiresAt = System.currentTimeMillis() + durationMs;
        String data = userId + ":" + expiresAt;
        String signature = sign(data);
        String tokenPayload = data + ":" + signature;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenPayload.getBytes(StandardCharsets.UTF_8));
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretKeyBytes, "HmacSHA256"));
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : rawHmac) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error signing token", e);
        }
    }
}

