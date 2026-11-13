package com.trippilot.security;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Minimal HS256 JWT helper (no external library).
 * Secret comes from JWT_SECRET. If it is missing, a random secret is generated
 * at startup (tokens stop working after a restart).
 */
public class JwtUtil {
    private static final Pattern SUB = Pattern.compile("\"sub\":\"([^\"]+)\"");
    private static final Pattern EXP = Pattern.compile("\"exp\":(\\d+)");
    private static final Base64.Encoder ENC = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DEC = Base64.getUrlDecoder();

    private final byte[] key;
    private final boolean ephemeral;

    public JwtUtil(String secret) {
        if (secret == null || secret.isBlank()) {
            key = new byte[48];
            new SecureRandom().nextBytes(key);
            ephemeral = true;
        } else {
            key = secret.getBytes(StandardCharsets.UTF_8);
            ephemeral = false;
        }
    }

    public boolean isEphemeral() {
        return ephemeral;
    }

    public String create(String userId, String name, long ttlSeconds) {
        long now = Instant.now().getEpochSecond();
        String header = ENC.encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String json = "{\"sub\":\"" + esc(userId) + "\",\"name\":\"" + esc(name)
                + "\",\"iat\":" + now + ",\"exp\":" + (now + ttlSeconds) + "}";
        String payload = ENC.encodeToString(json.getBytes(StandardCharsets.UTF_8));
        String data = header + "." + payload;
        return data + "." + ENC.encodeToString(hmac(data));
    }

    /** Returns the user id (subject) if the token is valid and not expired, otherwise null. */
    public String verifySubject(String token) {
        try {
            if (token == null) return null;
            String[] p = token.split("\\.");
            if (p.length != 3) return null;
            byte[] expected = hmac(p[0] + "." + p[1]);
            byte[] given = DEC.decode(p[2]);
            if (!MessageDigest.isEqual(expected, given)) return null;
            String json = new String(DEC.decode(p[1]), StandardCharsets.UTF_8);
            Matcher e = EXP.matcher(json);
            if (!e.find() || Long.parseLong(e.group(1)) < Instant.now().getEpochSecond()) return null;
            Matcher s = SUB.matcher(json);
            return s.find() ? s.group(1) : null;
        } catch (Exception ex) {
            return null;
        }
    }

    private byte[] hmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            throw new IllegalStateException("Could not sign token", ex);
        }
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replaceAll("\\p{Cntrl}", "").replace("\\", "\\\\").replace("\"", "\\\"");
    }
}