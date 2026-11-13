package com.trippilot.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class TripRequest {

    private String destinationName;
    private String destinationId; // For backward compatibility
    private Double destinationLat;
    private Double destinationLng;
    private String country;

    private String startingLocation;

    @NotBlank(message = "Start date is required")
    private String startDate;

    @Min(value = 1, message = "At least 1 day required")
    @Max(value = 10, message = "Maximum 10 days allowed")
    private int numDays = 3;

    @Min(value = 1, message = "At least 1 traveler required")
    @Max(value = 20, message = "Maximum 20 travelers allowed")
    private int numTravelers = 2;

    private Double budget;
    private Long budgetINR; // Backward compatibility

    private String currency = "USD";

    @NotBlank(message = "Travel style is required")
    private String travelStyle = "Comfort";

    private String transport; // Optional

    @NotEmpty(message = "At least one interest is required")
    private List<String> interests;

    @AssertTrue(message = "Destination is required")
    public boolean isDestinationPresent() {
        return (destinationName != null && !destinationName.isBlank())
                || (destinationId != null && !destinationId.isBlank());
    }

    @AssertTrue(message = "Budget must be greater than 0")
    public boolean isBudgetValid() {
        return (budget != null && budget > 0) || (budgetINR != null && budgetINR > 0);
    }

    // Resolved getters
    public String getResolvedDestinationName() {
        if (destinationName != null && !destinationName.isBlank()) {
            return destinationName.trim();
        }
        return destinationId != null ? destinationId.trim() : "";
    }

    public double getResolvedBudget() {
        if (budget != null && budget > 0) {
            return budget;
        }
        if (budgetINR != null && budgetINR > 0) {
            return budgetINR.doubleValue();
        }
        return 0.0;
    }

    public String getResolvedCurrency() {
        if (currency != null && !currency.isBlank()) {
            return currency.trim().toUpperCase();
        }
        return "USD";
    }

    // Getters and Setters
    public String getDestinationName() { return destinationName; }
    public void setDestinationName(String destinationName) { this.destinationName = destinationName; }

    public String getDestinationId() { return destinationId; }
    public void setDestinationId(String destinationId) { this.destinationId = destinationId; }

    public Double getDestinationLat() { return destinationLat; }
    public void setDestinationLat(Double destinationLat) { this.destinationLat = destinationLat; }

    public Double getDestinationLng() { return destinationLng; }
    public void setDestinationLng(Double destinationLng) { this.destinationLng = destinationLng; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getStartingLocation() { return startingLocation; }
    public void setStartingLocation(String startingLocation) { this.startingLocation = startingLocation; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public int getNumDays() { return numDays; }
    public void setNumDays(int numDays) { this.numDays = numDays; }

    public int getNumTravelers() { return numTravelers; }
    public void setNumTravelers(int numTravelers) { this.numTravelers = numTravelers; }

    public Double getBudget() { return budget; }
    public void setBudget(Double budget) { this.budget = budget; }

    public Long getBudgetINR() { return budgetINR; }
    public void setBudgetINR(Long budgetINR) { this.budgetINR = budgetINR; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getTravelStyle() { return travelStyle; }
    public void setTravelStyle(String travelStyle) { this.travelStyle = travelStyle; }

    public String getTransport() { return transport; }
    public void setTransport(String transport) { this.transport = transport; }

    public List<String> getInterests() { return interests; }
    public void setInterests(List<String> interests) { this.interests = interests; }
}
