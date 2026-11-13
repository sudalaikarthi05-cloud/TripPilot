package com.trippilot.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "places")
public class TouristPlace {
    @Id
    private String id;
    private String destinationId;
    private String name;
    private String description;
    private String category;
    private String visitDuration;
    private String estimatedCost;
    private String image;
    private double lat;
    private double lng;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDestinationId() { return destinationId; }
    public void setDestinationId(String destinationId) { this.destinationId = destinationId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getVisitDuration() { return visitDuration; }
    public void setVisitDuration(String visitDuration) { this.visitDuration = visitDuration; }

    public String getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(String estimatedCost) { this.estimatedCost = estimatedCost; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }

    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }
}

