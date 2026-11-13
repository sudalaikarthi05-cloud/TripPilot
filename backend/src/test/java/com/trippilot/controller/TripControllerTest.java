package com.trippilot.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trippilot.dto.TripRequest;
import com.trippilot.exception.GlobalExceptionHandler;
import com.trippilot.exception.TripNotFoundException;
import com.trippilot.model.Trip;
import com.trippilot.service.ItineraryGenerator;
import com.trippilot.service.TripService;
import org.springframework.dao.DataAccessResourceFailureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class TripControllerTest {

    private MockMvc mockMvc;
    private TripService tripService;
    private ItineraryGenerator generator;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        tripService = Mockito.mock(TripService.class);
        generator = Mockito.mock(ItineraryGenerator.class);
        objectMapper = new ObjectMapper();

        TripController controller = new TripController(tripService, generator);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void testGenerateSuccess() throws Exception {
        TripRequest req = new TripRequest();
        req.setDestinationName("Paris");
        req.setStartDate("2026-12-01");
        req.setNumDays(3);
        req.setNumTravelers(2);
        req.setBudget(1500.0);
        req.setCurrency("EUR");
        req.setTravelStyle("Comfort");
        req.setInterests(List.of("Culture", "Food"));

        Trip mockTrip = new Trip();
        mockTrip.setId("trip-123");
        mockTrip.setDestinationName("Paris");
        mockTrip.setBudget(1500.0);
        mockTrip.setCurrency("EUR");

        when(generator.generate(any(TripRequest.class))).thenReturn(mockTrip);

        mockMvc.perform(post("/api/trips/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("trip-123"))
                .andExpect(jsonPath("$.destinationName").value("Paris"))
                .andExpect(jsonPath("$.currency").value("EUR"));
    }

    @Test
    void testGenerateValidationFailure_MissingDestination() throws Exception {
        TripRequest req = new TripRequest();
        req.setDestinationName(""); // Missing destination
        req.setStartDate("2026-12-01");
        req.setNumDays(3);
        req.setBudget(1000.0);
        req.setInterests(List.of("Nature"));

        mockMvc.perform(post("/api/trips/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"));
    }

    @Test
    void testSaveTrip() throws Exception {
        Trip trip = new Trip();
        trip.setDestinationName("Rome");
        trip.setBudget(1200.0);
        trip.setCurrency("EUR");

        Trip saved = new Trip();
        saved.setId("saved-999");
        saved.setDestinationName("Rome");
        saved.setBudget(1200.0);
        saved.setCurrency("EUR");

        when(tripService.save(any(Trip.class))).thenReturn(saved);

        mockMvc.perform(post("/api/trips")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(trip)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("saved-999"))
                .andExpect(jsonPath("$.destinationName").value("Rome"));
    }

    @Test
    void testGetTripByIdFound() throws Exception {
        Trip trip = new Trip();
        trip.setId("t-1");
        trip.setDestinationName("Kyoto");

        when(tripService.findById("t-1")).thenReturn(Optional.of(trip));

        mockMvc.perform(get("/api/trips/t-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("t-1"))
                .andExpect(jsonPath("$.destinationName").value("Kyoto"));
    }

    @Test
    void testGetTripByIdNotFound() throws Exception {
        when(tripService.findById("non-existent")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/trips/non-existent"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testGetAllTripsReturnsServiceUnavailableWhenDatabaseIsDown() throws Exception {
        when(tripService.findAll()).thenThrow(new DataAccessResourceFailureException("database unavailable"));

        mockMvc.perform(get("/api/trips"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value(
                        "Database unavailable. Check the MongoDB Atlas connection and try again."));
    }

    @Test
    void testUpdateTripSuccess() throws Exception {
        Trip updateReq = new Trip();
        updateReq.setDestinationName("Sydney");
        updateReq.setBudget(3000.0);

        Trip updated = new Trip();
        updated.setId("t-2");
        updated.setDestinationName("Sydney");
        updated.setBudget(3000.0);

        when(tripService.update(eq("t-2"), any(Trip.class))).thenReturn(updated);

        mockMvc.perform(put("/api/trips/t-2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("t-2"))
                .andExpect(jsonPath("$.destinationName").value("Sydney"));
    }

    @Test
    void testUpdateTripNotFoundThrows404() throws Exception {
        Trip updateReq = new Trip();
        updateReq.setDestinationName("Sydney");

        when(tripService.update(eq("missing-id"), any(Trip.class)))
                .thenThrow(new TripNotFoundException("Trip not found: missing-id"));

        mockMvc.perform(put("/api/trips/missing-id")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Trip not found: missing-id"));
    }

    @Test
    void testDeleteTripSuccess() throws Exception {
        doNothing().when(tripService).delete("t-3");

        mockMvc.perform(delete("/api/trips/t-3"))
                .andExpect(status().isNoContent());

        verify(tripService, times(1)).delete("t-3");
    }

    @Test
    void testDeleteTripNotFoundThrows404() throws Exception {
        doThrow(new TripNotFoundException("Trip not found: not-here")).when(tripService).delete("not-here");

        mockMvc.perform(delete("/api/trips/not-here"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Trip not found: not-here"));
    }
}
