package com.trippilot.config;

import com.trippilot.model.Destination;
import com.trippilot.model.TouristPlace;
import com.trippilot.repository.DestinationRepository;
import com.trippilot.repository.PlaceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Seeds the database with sample Kerala destination and place data
 * on first run (if the destinations collection is empty).
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final DestinationRepository destRepo;
    private final PlaceRepository placeRepo;

    public DataSeeder(DestinationRepository destRepo, PlaceRepository placeRepo) {
        this.destRepo = destRepo;
        this.placeRepo = placeRepo;
    }

    @Override
    public void run(String... args) {
        if (destRepo.count() > 0) {
            log.info("Database already seeded — {} destinations found.", destRepo.count());
            return;
        }

        log.info("Seeding database with Kerala destinations...");

        // ---- KOCHI ----
        Destination kochi = makeDest("kochi", "Kochi", "Ernakulam, Kerala",
                "Where History Meets the Sea",
                "A vibrant port city layered with Dutch, Portuguese, and British heritage.",
                "Kochi (Cochin) is Kerala's most cosmopolitan city — an archipelago where fishermen work ancient Chinese fishing nets at the waterfront while art galleries and boutique restaurants buzz nearby. Fort Kochi holds whitewashed colonial churches, spice warehouses, and the famous Jew Town antique bazaar.",
                "2–3 Days", "Heritage & Culture",
                Arrays.asList("Heritage", "Beaches", "Seafood", "Art"),
                "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=900&q=80",
                "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1600&q=80",
                Arrays.asList("Chinese Fishing Nets", "Fort Kochi Walk", "Mattancherry Palace", "Jew Town", "Marine Drive"),
                "October – March", 9.9312, 76.2673);
        destRepo.save(kochi);

        savePlaces(kochi.getId(), Arrays.asList(
                makePlace(kochi.getId(), "Chinese Fishing Nets", "Iconic cantilevered fishing nets silhouetted against the setting sun.", "Landmark", "1 hour", "Free",
                        "https://images.unsplash.com/photo-1526698424521-87ba49e09e1c?w=600&q=80"),
                makePlace(kochi.getId(), "Mattancherry Palace", "Portuguese-built palace renowned for stunning Kerala murals.", "Museum", "1–2 hours", "₹5 (est.)",
                        "https://images.unsplash.com/photo-1601823984263-5e5e4b1c0a15?w=600&q=80"),
                makePlace(kochi.getId(), "St. Francis Church", "India's oldest European church, where Vasco da Gama was once buried.", "Heritage", "45 min", "Free",
                        "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=80"),
                makePlace(kochi.getId(), "Marine Drive", "A scenic promenade along Kochi's backwaters, perfect for evening strolls.", "Promenade", "1 hour", "Free",
                        "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80"),
                makePlace(kochi.getId(), "Jew Town & Paradesi Synagogue", "Historic spice trading quarter with antique shops and a 450-year-old synagogue.", "Heritage", "1–2 hours", "₹5 (est.)",
                        "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=80")
        ));

        // ---- MUNNAR ----
        Destination munnar = makeDest("munnar", "Munnar", "Idukki, Kerala",
                "Where the Clouds Touch the Earth",
                "Endless emerald tea gardens cascading down mist-wrapped hills at 1,600 m altitude.",
                "Munnar sits at the confluence of three mountain streams in the Western Ghats, blanketed by the world's highest tea plantations. Beyond the tea estates, the region hides rare Neelakurinji flowers, the endangered Nilgiri Tahr, and pristine shola forests.",
                "3–4 Days", "Nature & Mountains",
                Arrays.asList("Tea Gardens", "Mountains", "Wildlife", "Trekking"),
                "https://images.unsplash.com/photo-1591457822096-a2de55693cce?w=900&q=80",
                "https://images.unsplash.com/photo-1591457822096-a2de55693cce?w=1600&q=80",
                Arrays.asList("Tea Plantations", "Eravikulam NP", "Top Station", "Mattupetty Dam", "Attukal Waterfalls"),
                "September – May", 10.0889, 77.0595);
        destRepo.save(munnar);

        savePlaces(munnar.getId(), Arrays.asList(
                makePlace(munnar.getId(), "Eravikulam National Park", "Home to the endangered Nilgiri Tahr and stunning grassland landscapes.", "Wildlife", "2–3 hours", "₹125 (est.)",
                        "https://images.unsplash.com/photo-1616164744857-87de12aa4e1b?w=600&q=80"),
                makePlace(munnar.getId(), "Top Station", "The highest point in Munnar with breathtaking panoramic views.", "Viewpoint", "1 hour", "Free",
                        "https://images.unsplash.com/photo-1503649967086-f93edf04e3e3?w=600&q=80"),
                makePlace(munnar.getId(), "Tata Tea Museum", "Understand the journey of a tea leaf from pluck to cup.", "Museum", "1 hour", "₹75 (est.)",
                        "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=600&q=80"),
                makePlace(munnar.getId(), "Mattupetty Dam", "Scenic dam surrounded by hills — popular for boating and picnics.", "Dam / Lake", "1–2 hours", "₹20 (est.)",
                        "https://images.unsplash.com/photo-1591457822096-a2de55693cce?w=600&q=80"),
                makePlace(munnar.getId(), "Attukal Waterfalls", "A beautiful waterfall set among rocky terrain and lush greenery.", "Waterfall", "1 hour", "Free",
                        "https://images.unsplash.com/photo-1503649967086-f93edf04e3e3?w=600&q=80")
        ));

        // ---- ALLEPPEY ----
        Destination alleppey = makeDest("alleppey", "Alleppey", "Alappuzha, Kerala",
                "The Venice of the East",
                "A labyrinth of peaceful backwater canals, rice fields, and coconut groves.",
                "Alappuzha is the gateway to Kerala's legendary backwater network. The signature experience is a night aboard a kettuvallam (houseboat), drifting past paddy fields while a private cook serves fresh fish curry.",
                "2–3 Days", "Backwaters",
                Arrays.asList("Houseboats", "Backwaters", "Canals", "Kerala Cuisine"),
                "https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?w=900&q=80",
                "https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?w=1600&q=80",
                Arrays.asList("Houseboat Stay", "Vembanad Lake", "Alappuzha Beach", "Kuttanad", "Snake Boat Race"),
                "November – February", 9.4981, 76.3388);
        destRepo.save(alleppey);

        savePlaces(alleppey.getId(), Arrays.asList(
                makePlace(alleppey.getId(), "Vembanad Lake", "Kerala's largest lake — the stage for the famous Nehru Trophy Boat Race.", "Lake", "2–4 hours", "Free (boat hire extra)",
                        "https://images.unsplash.com/photo-1580289142548-bcd08573b3fc?w=600&q=80"),
                makePlace(alleppey.getId(), "Alappuzha Beach", "A long sandy beach with a 19th-century pier.", "Beach", "1–2 hours", "Free",
                        "https://images.unsplash.com/photo-1596786232430-dad20c3bf487?w=600&q=80"),
                makePlace(alleppey.getId(), "Punnamada Lake Houseboat", "Serene lake where houseboats anchor overnight under a canopy of stars.", "Lake", "Overnight", "₹8,000–₹15,000/night (est.)",
                        "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&q=80"),
                makePlace(alleppey.getId(), "Kuttanad Backwaters", "The rice bowl of Kerala — explore canals through lush paddy fields.", "Backwaters", "3–4 hours", "₹500–₹1500 (boat est.)",
                        "https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?w=600&q=80")
        ));

        // ---- WAYANAD ----
        Destination wayanad = makeDest("wayanad", "Wayanad", "Wayanad, Kerala",
                "The Green Crown of Kerala",
                "Ancient tribal villages, mist-veiled forests, and prehistoric rock shelters.",
                "Wayanad district, nestled in the Western Ghats at 700–2,100 m elevation, is one of Kerala's least-crowded highland retreats. Edakkal Caves hold Neolithic carvings 6,000 years old and Chembra Peak offers a heart-shaped lake at its summit.",
                "2–3 Days", "Nature & Adventure",
                Arrays.asList("Forest", "Trekking", "Wildlife", "Tribal Culture"),
                "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=900&q=80",
                "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1600&q=80",
                Arrays.asList("Edakkal Caves", "Chembra Peak", "Banasura Dam", "Pookode Lake", "Wayanad WLS"),
                "October – May", 11.6854, 76.1320);
        destRepo.save(wayanad);

        savePlaces(wayanad.getId(), Arrays.asList(
                makePlace(wayanad.getId(), "Edakkal Caves", "Neolithic pictographs etched into cave walls — a glimpse into prehistoric Kerala.", "Heritage", "2 hours", "₹30 (est.)",
                        "https://images.unsplash.com/photo-1609766857568-5b2a4f80b5ab?w=600&q=80"),
                makePlace(wayanad.getId(), "Chembra Peak", "A 7 km trek to Wayanad's highest summit, passing a heart-shaped lake.", "Trekking", "5–6 hours", "₹300 (guide + permit est.)",
                        "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80"),
                makePlace(wayanad.getId(), "Banasura Sagar Dam", "India's largest earth dam, surrounded by lush hills.", "Dam / Lake", "1–2 hours", "₹50 (est.)",
                        "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&q=80"),
                makePlace(wayanad.getId(), "Pookode Lake", "A freshwater lake nestled in the forest — ideal for pedal boating.", "Lake", "1–2 hours", "₹20 (est.)",
                        "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=80")
        ));

        // ---- THEKKADY ----
        Destination thekkady = makeDest("thekkady", "Thekkady", "Idukki, Kerala",
                "Wild at Heart",
                "Home to the legendary Periyar Wildlife Sanctuary — elephants, spices, and jungle trails.",
                "Thekkady is the gateway to the Periyar Tiger Reserve. A boat ride on Periyar Lake at dawn is among the most magical wildlife experiences in South India. Beyond the lake, spice gardens of cardamom, pepper, and vanilla perfume the hill air.",
                "2–3 Days", "Wildlife",
                Arrays.asList("Wildlife", "Elephants", "Spices", "Forest"),
                "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=900&q=80",
                "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1600&q=80",
                Arrays.asList("Periyar Boat Ride", "Spice Garden Tour", "Elephant Camps", "Tribal Trails", "Mangaladevi Temple"),
                "October – June", 9.5937, 77.1700);
        destRepo.save(thekkady);

        savePlaces(thekkady.getId(), Arrays.asList(
                makePlace(thekkady.getId(), "Periyar Lake Boat Cruise", "A dawn boat ride inside the tiger reserve — spot wild elephants and birds.", "Wildlife / Nature", "2 hours", "₹200–₹500 (est.)",
                        "https://images.unsplash.com/photo-1564596823821-79b7ea743f38?w=600&q=80"),
                makePlace(thekkady.getId(), "Spice Garden Tours", "Walk through fragrant plantations of cardamom, pepper, and clove.", "Agriculture / Culture", "1–2 hours", "₹100–₹200 (est.)",
                        "https://images.unsplash.com/photo-1587502537745-84b86da1204f?w=600&q=80"),
                makePlace(thekkady.getId(), "Tribal Eco-Walk", "Guided forest trek with the indigenous Mannan community.", "Eco-Tourism", "3–4 hours", "₹500 (est.)",
                        "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&q=80"),
                makePlace(thekkady.getId(), "Periyar Tiger Trail", "A 2-day jungle trek deep into the reserve with trained guides.", "Wildlife / Trekking", "Full day", "₹3,000–₹5,000 (est.)",
                        "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600&q=80")
        ));

        log.info("Seeded {} destinations and {} places.", destRepo.count(), placeRepo.count());
    }

    private void savePlaces(String destId, List<TouristPlace> places) {
        placeRepo.saveAll(places);
    }

    private Destination makeDest(String slug, String name, String region, String tagline,
                                  String desc, String longDesc, String duration, String category,
                                  List<String> tags, String image, String coverImage,
                                  List<String> highlights, String bestTime, double lat, double lng) {
        Destination d = new Destination();
        d.setSlug(slug);
        d.setName(name);
        d.setRegion(region);
        d.setTagline(tagline);
        d.setDescription(desc);
        d.setLongDescription(longDesc);
        d.setDuration(duration);
        d.setCategory(category);
        d.setTags(tags);
        d.setImage(image);
        d.setCoverImage(coverImage);
        d.setHighlights(highlights);
        d.setBestTime(bestTime);
        d.setLat(lat);
        d.setLng(lng);
        return d;
    }

    private TouristPlace makePlace(String destId, String name, String desc, String category,
                                    String visitDuration, String cost, String image) {
        TouristPlace p = new TouristPlace();
        p.setDestinationId(destId);
        p.setName(name);
        p.setDescription(desc);
        p.setCategory(category);
        p.setVisitDuration(visitDuration);
        p.setEstimatedCost(cost);
        p.setImage(image);
        return p;
    }
}

