# 📡 API Documentation

Base URL: `http://localhost:3000/api`

## 🔐 Authentication
Most endpoints require a valid user session. Pass the `next-auth.session-token` cookie with requests.

---

## 🌍 Destinations

### Get All Destinations
Fetch a list of supported tourist spots and their live capacity status.

- **Endpoint:** `GET /destinations`
- **Response:**
  ```json
  [
    {
      "id": "dest_123",
      "name": "Rohtang Pass",
      "capacity": 1000,
      "current_occupancy": 850,
      "status": "High" // Low, Medium, High, Critical
    }
  ]