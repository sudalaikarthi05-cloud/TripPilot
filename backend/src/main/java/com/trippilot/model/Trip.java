package com.trippilot.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "trips")
public class Trip {
    @Id
    private String id;
    private String userId; // Ready for future authentication, nullable for now
    private String destinationId;
    private String destinationName;
    private String destinationCountry;
    private Double destinationLat;
    private Double destinationLng;
    private TripDestination destination;
    private String startingLocation;
    private String startDate;
    private String endDate;
    private int numDays;
    private int numTravelers;
    private Double budget = 0.0;
    private long budgetINR; // Backward compatibility
    private String currency = "USD";
    private String travelStyle;
    private String transport;
    private List<String> interests;
    private CostBreakdown costBreakdown;
    private List<ItineraryDay> days = new ArrayList<>();
    private String createdAt;

    // Cost Breakdown
    public static class CostBreakdown {
        private double transport;
        private double accommodation;
        private double food;
        private double activities;
        private double totalEstimated;
        private double userBudget;
        private String currency;
        private String status; // under_budget, on_budget, over_budget

        public double getTransport() { return transport; }
        public void setTransport(double transport) { this.transport = transport; }
        public double getAccommodation() { return accommodation; }
        public void setAccommodation(double accommodation) { this.accommodation = accommodation; }
        public double getFood() { return food; }
        public void setFood(double food) { this.food = food; }
        public double getActivities() { return activities; }
        public void setActivities(double activities) { this.activities = activities; }
        public double getTotalEstimated() { return totalEstimated; }
        public void setTotalEstimated(double totalEstimated) { this.totalEstimated = totalEstimated; }
        public double getUserBudget() { return userBudget; }
        public void setUserBudget(double userBudget) { this.userBudget = userBudget; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    // Nested destination summary
    public static class TripDestination {
        private String name;
        private String region;
        private String country;
        private String image;
        private String description;
        private Double lat;
        private Double lng;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getRegion() { return region; }
        public void setRegion(String region) { this.region = region; }
        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }
        public String getImage() { return image; }
        public void setImage(String image) { this.image = image; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Double getLat() { return lat; }
        public void setLat(Double lat) { this.lat = lat; }
        public Double getLng() { return lng; }
        public void setLng(Double lng) { this.lng = lng; }
    }

    // Activity Item
    public static class ActivityItem {
        private String time;
        private String slotType; // morning, afternoon, evening
        private String placeName;
        private String image;
        private String description;
        private String suggestedDuration;
        private Double lat;
        private Double lng;
        private String address;
        private String estimatedTravelTimeFromPrevious;
        private String openingHours;
        private String tip;

        public String getTime() { return time; }
        public void setTime(String time) { this.time = time; }
        public String getSlotType() { return slotType; }
        public void setSlotType(String slotType) { this.slotType = slotType; }
        public String getPlaceName() { return placeName; }
        public void setPlaceName(String placeName) { this.placeName = placeName; }
        public String getImage() { return image; }
        public void setImage(String image) { this.image = image; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getSuggestedDuration() { return suggestedDuration; }
        public void setSuggestedDuration(String suggestedDuration) { this.suggestedDuration = suggestedDuration; }
        public Double getLat() { return lat; }
        public void setLat(Double lat) { this.lat = lat; }
        public Double getLng() { return lng; }
        public void setLng(Double lng) { this.lng = lng; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getEstimatedTravelTimeFromPrevious() { return estimatedTravelTimeFromPrevious; }
        public void setEstimatedTravelTimeFromPrevious(String estimatedTravelTimeFromPrevious) {
            this.estimatedTravelTimeFromPrevious = estimatedTravelTimeFromPrevious;
        }
        public String getOpeningHours() { return openingHours; }
        public void setOpeningHours(String openingHours) { this.openingHours = openingHours; }
        public String getTip() { return tip; }
        public void setTip(String tip) { this.tip = tip; }
    }

    // Itinerary day
    public static class ItineraryDay {
        private int dayNumber;
        private String title;
        private String date;
        private TimeSlot morning;
        private TimeSlot afternoon;
        private TimeSlot evening;
        private List<ActivityItem> activities = new ArrayList<>();
        private Meals meals;
        private String accommodation;
        private long dailyBudget;
        private CostBreakdown costBreakdown;

        public int getDayNumber() { return dayNumber; }
        public void setDayNumber(int dayNumber) { this.dayNumber = dayNumber; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public TimeSlot getMorning() { return morning; }
        public void setMorning(TimeSlot morning) { this.morning = morning; }
        public TimeSlot getAfternoon() { return afternoon; }
        public void setAfternoon(TimeSlot afternoon) { this.afternoon = afternoon; }
        public TimeSlot getEvening() { return evening; }
        public void setEvening(TimeSlot evening) { this.evening = evening; }
        public List<ActivityItem> getActivities() { return activities; }
        public void setActivities(List<ActivityItem> activities) { this.activities = activities; }
        public Meals getMeals() { return meals; }
        public void setMeals(Meals meals) { this.meals = meals; }
        public String getAccommodation() { return accommodation; }
        public void setAccommodation(String accommodation) { this.accommodation = accommodation; }
        public long getDailyBudget() { return dailyBudget; }
        public void setDailyBudget(long dailyBudget) { this.dailyBudget = dailyBudget; }
        public CostBreakdown getCostBreakdown() { return costBreakdown; }
        public void setCostBreakdown(CostBreakdown costBreakdown) { this.costBreakdown = costBreakdown; }
    }

    // Time slot (backward compatible with enhanced fields)
    public static class TimeSlot {
        private String time;
        private String activity;
        private String description;
        private String duration;
        private String image;
        private String tip;
        private Double lat;
        private Double lng;
        private String address;
        private String estimatedTravelTimeFromPrevious;
        private String openingHours;

        public String getTime() { return time; }
        public void setTime(String time) { this.time = time; }
        public String getActivity() { return activity; }
        public void setActivity(String activity) { this.activity = activity; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getDuration() { return duration; }
        public void setDuration(String duration) { this.duration = duration; }
        public String getImage() { return image; }
        public void setImage(String image) { this.image = image; }
        public String getTip() { return tip; }
        public void setTip(String tip) { this.tip = tip; }
        public Double getLat() { return lat; }
        public void setLat(Double lat) { this.lat = lat; }
        public Double getLng() { return lng; }
        public void setLng(Double lng) { this.lng = lng; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getEstimatedTravelTimeFromPrevious() { return estimatedTravelTimeFromPrevious; }
        public void setEstimatedTravelTimeFromPrevious(String estimatedTravelTimeFromPrevious) {
            this.estimatedTravelTimeFromPrevious = estimatedTravelTimeFromPrevious;
        }
        public String getOpeningHours() { return openingHours; }
        public void setOpeningHours(String openingHours) { this.openingHours = openingHours; }
    }

    // Meals
    public static class Meals {
        private String breakfast;
        private String lunch;
        private String dinner;

        public String getBreakfast() { return breakfast; }
        public void setBreakfast(String breakfast) { this.breakfast = breakfast; }
        public String getLunch() { return lunch; }
        public void setLunch(String lunch) { this.lunch = lunch; }
        public String getDinner() { return dinner; }
        public void setDinner(String dinner) { this.dinner = dinner; }
    }

    // Getters and Setters for Trip
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getDestinationId() { return destinationId; }
    public void setDestinationId(String destinationId) { this.destinationId = destinationId; }

    public String getDestinationName() { return destinationName; }
    public void setDestinationName(String destinationName) { this.destinationName = destinationName; }

    public String getDestinationCountry() { return destinationCountry; }
    public void setDestinationCountry(String destinationCountry) { this.destinationCountry = destinationCountry; }

    public Double getDestinationLat() { return destinationLat; }
    public void setDestinationLat(Double destinationLat) { this.destinationLat = destinationLat; }

    public Double getDestinationLng() { return destinationLng; }
    public void setDestinationLng(Double destinationLng) { this.destinationLng = destinationLng; }

    public TripDestination getDestination() { return destination; }
    public void setDestination(TripDestination destination) { this.destination = destination; }

    public String getStartingLocation() { return startingLocation; }
    public void setStartingLocation(String startingLocation) { this.startingLocation = startingLocation; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public int getNumDays() { return numDays; }
    public void setNumDays(int numDays) { this.numDays = numDays; }

    public int getNumTravelers() { return numTravelers; }
    public void setNumTravelers(int numTravelers) { this.numTravelers = numTravelers; }

    public Double getBudget() { return budget != null && budget > 0 ? budget : (double) budgetINR; }
    public void setBudget(Double budget) {
        this.budget = budget;
        if (budget != null) {
            this.budgetINR = budget.longValue();
        }
    }

    public long getBudgetINR() {
        return budgetINR > 0 ? budgetINR : (budget != null ? budget.longValue() : 0);
    }
    public void setBudgetINR(long budgetINR) {
        this.budgetINR = budgetINR;
        if (this.budget == null || this.budget <= 0) this.budget = (double) budgetINR;
    }

    public String getCurrency() { return currency != null ? currency : "USD"; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getTravelStyle() { return travelStyle; }
    public void setTravelStyle(String travelStyle) { this.travelStyle = travelStyle; }

    public String getTransport() { return transport; }
    public void setTransport(String transport) { this.transport = transport; }

    public List<String> getInterests() { return interests; }
    public void setInterests(List<String> interests) { this.interests = interests; }

    public CostBreakdown getCostBreakdown() { return costBreakdown; }
    public void setCostBreakdown(CostBreakdown costBreakdown) { this.costBreakdown = costBreakdown; }

    public List<ItineraryDay> getDays() { return days; }
    public void setDays(List<ItineraryDay> days) { this.days = days; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
