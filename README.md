# TripPilot — Smart Worldwide Tour Planner

**"Your Trip, Perfectly Planned Anywhere in the World."**

TripPilot is a client-ready, full-stack smart travel planning platform built with **React + Vite** (frontend) and **Spring Boot + MongoDB Atlas** (backend). It allows travelers to discover authentic attractions and generate tailored, cluster-optimized day-by-day itineraries for **any destination across the globe**, complete with real Leaflet maps, distance-based travel time estimates, and transparent multi-currency budget breakdowns.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 18, Vite, React Router 6, Leaflet & React-Leaflet, Axios, Lucide Icons |
| **Backend** | Java 17/21, Spring Boot 3.2, Spring Data MongoDB, Jakarta Validation |
| **External Real Data** | OpenStreetMap (Overpass API), Nominatim Geocoding, Wikipedia GeoSearch & Summaries, Wikimedia Commons |
| **Database & Cache** | MongoDB Atlas (Trips collection + 7-day DiscoverCache) |
| **Typography & Theme** | Playfair Display + Plus Jakarta Sans; Forest Green (#173D32), Warm Cream (#FAF8F5), Antique Gold (#C69239) |

---

## Key Features

1. **Global Itinerary Generation (Worldwide Coverage)**:
   - Generates realistic, day-by-day itineraries for any city or region across the world (e.g. Paris, Tokyo, Bali, Rome, Dubai, Munnar, New York, Cairo).
   - Uses the real-data pipeline: Nominatim geocoding, Wikipedia GeoSearch, OpenStreetMap Overpass attractions, and Wikimedia Commons imagery.
   - Fallback and inspiration support for classic destinations.

2. **Intelligent Geographic Clustering**:
   - Attractions are clustered geographically using Haversine distance calculations so each day stays within a localized geographic radius.
   - Intra-day nearest-neighbour routing minimizes zigzagging.
   - Realistic travel time estimates between consecutive stops (e.g., `~15 min walk (estimate)` or `~25 min drive (estimate)`).

3. **Interactive Leaflet Route Maps**:
   - Real interactive maps powered by OpenStreetMap tiles and Leaflet.
   - Day filter pills ("All Days", "Day 1", "Day 2", etc.) to view specific days or the entire journey.
   - Custom numbered marker pins (`1`, `2`, `3`...) matching each day's stop schedule.
   - Styled route polylines connecting consecutive stops.
   - Informative popups with attraction photos, timing, address, and opening hours.

4. **Multi-Currency Budgeting & Cost Breakdown**:
   - Supports 10 international currencies: USD ($), EUR (€), GBP (£), INR (₹), AED (AED), JPY (¥), AUD (A$), CAD (C$), SGD (S$), CHF (CHF).
   - Visual breakdown bar chart across Accommodation, Food & Dining, Local Transport, and Activities.
   - Budget indicator comparing estimated costs against user budget (`on_budget`, `under_budget`, `over_budget`).

5. **Full Trip CRUD & Edit Flow**:
   - **Save Trip**: Persists itineraries directly to MongoDB Atlas.
   - **Edit Trip**: Loads saved trips back into the planning form, regenerates fresh itineraries, and updates the existing document via `PUT /api/trips/{id}`.
   - **Delete Trip**: Confirmation modal with instant deletion and toast feedback.

6. **Client-Ready UI/UX Polish**:
   - Skeleton shimmer loaders for all cards, attraction lists, and itinerary days.
   - React Error Boundary preventing blank white screens.
   - Custom 404 page for unmatched routes.
   - Toast notifications for trip saving and deletion.
   - Fully responsive on desktop, tablet, and mobile devices with collapsible navigation.

---

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| **POST** | `/api/trips/generate` | Generate global itinerary (does not auto-save) |
| **POST** | `/api/trips` | Save a trip to MongoDB Atlas |
| **GET** | `/api/trips` | List all saved trips |
| **GET** | `/api/trips/{id}` | Get a saved trip by ID |
| **PUT** | `/api/trips/{id}` | Update an existing saved trip |
| **DELETE** | `/api/trips/{id}` | Delete a saved trip by ID |
| **GET** | `/api/discover?q={query}` | Search worldwide destination & attractions |
| **GET** | `/api/discover/suggest?q={q}` | Autocomplete suggestions for global places |
| **GET** | `/api/destinations` | List curated destinations |
| **GET** | `/api/places` | List tourist places |

### Itinerary Generation Request Format (`POST /api/trips/generate`)

```json
{
  "destinationName": "Paris",
  "destinationCountry": "France",
  "startingLocation": "Charles de Gaulle Airport",
  "startDate": "2026-12-15",
  "numDays": 3,
  "numTravelers": 2,
  "budget": 1500,
  "currency": "EUR",
  "travelStyle": "Comfort",
  "transport": "flexible",
  "interests": ["Culture", "Food", "History"]
}
```

*Backward compatibility:* Legacy fields `destinationId` and `budgetINR` are still supported if passed.

---

## User Ownership & Authentication Approach

In this version, authentication is not enforced to allow frictionless client walkthroughs and immediate testing.
- The `Trip` model and database schema include a nullable `userId` field ready for future JWT/OAuth integration.
- All saved trips persist to MongoDB Atlas and can be retrieved, edited, and deleted across sessions.

---

## Environment Variables

| Variable | Location | Description | Default |
| --- | --- | --- | --- |
| `MONGODB_URI` | `backend/.env` | MongoDB Atlas connection string | Required |
| `VITE_API_URL` | `frontend/.env` | Backend API base URL | `http://localhost:8080/api` |

> **Security Note:** Real database credentials should NEVER be committed to version control. Always maintain `.env` in `.gitignore` and distribute `.env.example` with placeholders only.

---

## Setup & Running the Project

### Prerequisites
- Node.js 18+ and npm
- Java JDK 17 or 21
- Maven (or use the included wrapper script)

### 1. Backend Setup

```bash
cd backend
# Verify backend/.env contains your rotated MONGODB_URI
# Run clean compile and test
.\mvn.cmd clean test

# Start the Spring Boot application
.\mvn.cmd spring-boot:run
```

The backend server starts at **`http://localhost:8080`**.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run build
npm run dev
```

The frontend development server starts at **`http://localhost:5173`** (or `http://localhost:3000`).

---

## Testing & Verification

- **Backend Unit Tests**: Run `.\backend\mvn.cmd test` to execute all 13 unit tests covering 1-day, 2-day, and 5-day scheduling, geographic clustering, cost calculations, Trip CRUD endpoints, and bean validation.
- **Frontend Production Build**: Run `cd frontend && npm run build` to verify all chunks compile with zero TypeScript/JSX warnings.
