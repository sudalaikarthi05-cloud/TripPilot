package com.trippilot.service;

import com.trippilot.dto.AuthResponse;
import com.trippilot.dto.LoginRequest;
import com.trippilot.dto.RegisterRequest;
import com.trippilot.dto.UserDto;
import com.trippilot.exception.AuthException;
import com.trippilot.model.User;
import com.trippilot.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    private UserRepository userRepository;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        authService = new AuthService(userRepository, "TestSecretKeyForTestingAuthServiceHMACSignature2026");
    }

    @Test
    void testRegisterSuccess() {
        RegisterRequest req = new RegisterRequest("Alice Walker", "alice@example.com", "secret123");
        when(userRepository.existsByEmailIgnoreCase("alice@example.com")).thenReturn(false);

        User savedUser = new User("Alice Walker", "alice@example.com", "$2a$10$hashedpassword");
        savedUser.setId("user123");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        AuthResponse resp = authService.register(req);

        assertNotNull(resp);
        assertNotNull(resp.getToken());
        assertEquals("Alice Walker", resp.getUser().getName());
        assertEquals("alice@example.com", resp.getUser().getEmail());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User captured = captor.getValue();
        assertEquals("Alice Walker", captured.getName());
        assertEquals("alice@example.com", captured.getEmail());
        assertNotEquals("secret123", captured.getPasswordHash());
    }

    @Test
    void testRegisterDuplicateEmailThrows() {
        RegisterRequest req = new RegisterRequest("Alice", "existing@example.com", "password");
        when(userRepository.existsByEmailIgnoreCase("existing@example.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> authService.register(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testLoginSuccess() {
        // First register to get a valid hash or compute hash
        RegisterRequest regReq = new RegisterRequest("Bob", "bob@example.com", "mypassword");
        User user = new User("Bob", "bob@example.com", "");
        user.setId("bob1");

        when(userRepository.existsByEmailIgnoreCase("bob@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId("bob1");
            return u;
        });

        AuthResponse regResp = authService.register(regReq);

        // Mock findByEmail to return this user with the saved hash
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User savedUser = captor.getValue();

        when(userRepository.findByEmailIgnoreCase("bob@example.com")).thenReturn(Optional.of(savedUser));
        when(userRepository.findById("bob1")).thenReturn(Optional.of(savedUser));

        LoginRequest loginReq = new LoginRequest("bob@example.com", "mypassword");
        loginReq.setRememberMe(true);

        AuthResponse loginResp = authService.login(loginReq);
        assertNotNull(loginResp.getToken());
        assertEquals("Bob", loginResp.getUser().getName());

        // Test token validation
        UserDto dto = authService.getUserFromAuthHeader("Bearer " + loginResp.getToken());
        assertEquals("bob1", dto.getId());
        assertEquals("bob@example.com", dto.getEmail());
    }

    @Test
    void testLoginInvalidPasswordThrows() {
        User user = new User("Bob", "bob@example.com", "$2a$10$invalidsomethinghashed");
        when(userRepository.findByEmailIgnoreCase("bob@example.com")).thenReturn(Optional.of(user));

        LoginRequest req = new LoginRequest("bob@example.com", "wrongpassword");
        assertThrows(AuthException.class, () -> authService.login(req));
    }

    @Test
    void testLoginNonexistentUserThrows() {
        when(userRepository.findByEmailIgnoreCase("unknown@example.com")).thenReturn(Optional.empty());

        LoginRequest req = new LoginRequest("unknown@example.com", "any");
        assertThrows(AuthException.class, () -> authService.login(req));
    }
}
