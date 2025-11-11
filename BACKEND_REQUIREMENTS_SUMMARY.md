# Backend Requirements - Zone Configuration API

**Project:** Dhamaka v2 - FreightCompare
**Feature:** Zone Configuration Management
**Date:** 2025-01-11

---

## 🎯 What We Need

Create 5 new REST API endpoints to save and manage zone configurations from the ZonePriceMatrix page.

**Requirements:**
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ User-scoped only (users can only access their own data)
- ✅ JWT Bearer token authentication required
- ✅ Store zone definitions + price matrix in MongoDB

---

## 📊 Database Schema

### Collection: `zone_configurations`

```javascript
{
  _id: ObjectId,
  customerID: String,           // User ID (required, indexed)
  configName: String,           // Unique per user (required, max 100 chars)
  description: String,          // Optional (max 500 chars)

  zones: [                      // Array of zone definitions (1-28 items)
    {
      zoneCode: String,         // e.g., "N1", "S2" (must match: ^(N|S|E|W|NE|C)[1-6]$)
      zoneName: String,         // Display name
      region: String,           // "North"|"South"|"East"|"West"|"Northeast"|"Central"
      selectedStates: [String],
      selectedCities: [String], // Format: "City||State"
      isComplete: Boolean
    }
  ],

  priceMatrix: [                // Zone-to-zone pricing
    {
      fromZone: String,         // Must exist in zones array
      toZone: String,           // Must exist in zones array
      price: Number             // Can be null, max 3 decimals, >= 0
    }
  ],

  status: String,               // "active" | "archived"
  version: Number,              // Increment on update
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
```javascript
db.zone_configurations.createIndex({ customerID: 1 })
db.zone_configurations.createIndex({ customerID: 1, configName: 1 }, { unique: true })
db.zone_configurations.createIndex({ createdAt: -1 })
db.zone_configurations.createIndex({ status: 1 })
```

---

## 🔌 API Endpoints

### Base URL: `/api/zones`

---

### 1. Create Configuration
```
POST /api/zones/configuration
```

**Request:**
```json
{
  "customerID": "507f1f77bcf86cd799439011",
  "configName": "North-South Routes",
  "description": "Primary zones for express delivery",
  "zones": [
    {
      "zoneCode": "N1",
      "zoneName": "North Zone 1",
      "region": "North",
      "selectedStates": ["Delhi", "Haryana"],
      "selectedCities": ["Delhi||Delhi", "Gurgaon||Haryana"],
      "isComplete": true
    }
  ],
  "priceMatrix": [
    {
      "fromZone": "N1",
      "toZone": "S1",
      "price": 125.50
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Zone configuration created successfully",
  "data": { /* full configuration with _id, timestamps */ }
}
```

**Validation:**
- customerID must match JWT token
- configName must be unique per user
- zones: 1-28 items
- zoneCode must match: `^(N|S|E|W|NE|C)[1-6]$`
- Valid zones: N1-N6, S1-S6, E1-E4, W1-W4, NE1-NE4, C1-C4
- price: null or number >= 0 with max 3 decimals

---

### 2. Get All Configurations
```
GET /api/zones/configurations?customerID={id}&status=active&limit=50&offset=0
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    { /* configuration 1 */ },
    { /* configuration 2 */ }
  ],
  "pagination": {
    "total": 15,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

**Query Params:**
- `customerID` (required)
- `status` (optional): "active" | "archived"
- `limit` (optional): default 50, max 100
- `offset` (optional): default 0
- `sort` (optional): default "createdAt"
- `order` (optional): "asc" | "desc"

---

### 3. Get Single Configuration
```
GET /api/zones/configuration/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* full configuration */ }
}
```

---

### 4. Update Configuration
```
PUT /api/zones/configuration/:id
```

**Request:** Same as POST (all fields optional, send only what changes)

**Response (200):**
```json
{
  "success": true,
  "message": "Zone configuration updated successfully",
  "data": { /* updated configuration with version++ */ }
}
```

**Action:** Increment `version` field, update `updatedAt` timestamp

---

### 5. Delete Configuration
```
DELETE /api/zones/configuration/:id
DELETE /api/zones/configuration/:id?hard=true
```

**Default (Soft Delete):** Set `status = "archived"`

**With ?hard=true:** Permanently delete from database

**Response (200):**
```json
{
  "success": true,
  "message": "Zone configuration archived successfully"
}
```

---

## 🔐 Authentication

All endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

**Token Validation:**
1. Extract JWT from Authorization header
2. Verify signature and expiration
3. Extract customerID from token payload
4. Match against request customerID or document owner
5. Users can ONLY access their own configurations

**Token Payload Example:**
```json
{
  "customer": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com"
  },
  "iat": 1704974400,
  "exp": 1705060800
}
```

---

## ✅ Validation Rules

### Zone Codes
Valid: `N1-N6`, `S1-S6`, `E1-E4`, `W1-W4`, `NE1-NE4`, `C1-C4`
Regex: `^(N|S|E|W|NE|C)[1-6]$`

### Regions
Valid: `North`, `South`, `East`, `West`, `Northeast`, `Central`

### Prices
- Type: Number or null
- If number: >= 0, max 3 decimals
- Max value: 999999.999

### Config Name
- Required: Yes
- Length: 1-100 characters
- Unique: Per customer
- Pattern: `^[a-zA-Z0-9 _-]{1,100}$`

### Arrays
- `zones`: min 1, max 28
- `priceMatrix`: no limit
- `selectedStates`: no limit
- `selectedCities`: no limit

---

## 🚨 Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "configName": "Name already exists",
    "zones[0].zoneCode": "Invalid zone code"
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You can only access your own configurations"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Zone configuration not found"
}
```

**409 Conflict:**
```json
{
  "success": false,
  "message": "Configuration name already exists"
}
```

---

## 🧪 Test Cases

### Must Test:
1. ✅ Create valid configuration → 201
2. ✅ Create duplicate name → 409 Conflict
3. ✅ Create with invalid zone code → 400 Bad Request
4. ✅ Get all for user → 200 with array
5. ✅ Get single by ID → 200 with data
6. ✅ Get non-existent ID → 404
7. ✅ Update own config → 200 with version++
8. ✅ Delete (soft) → 200, status="archived"
9. ✅ Delete (hard) → 200, document removed
10. ❌ Access other user's config → 403 Forbidden
11. ❌ No auth token → 401 Unauthorized
12. ❌ Expired token → 401 Unauthorized
13. ❌ Invalid customerID → 403 Forbidden
14. ❌ Negative price → 400 Bad Request
15. ❌ > 28 zones → 400 Bad Request

---

## 📦 Implementation Checklist

### Database
- [ ] Create `zone_configurations` collection
- [ ] Add 4 indexes
- [ ] Add schema validation (optional but recommended)

### Routes
- [ ] POST /api/zones/configuration
- [ ] GET /api/zones/configurations
- [ ] GET /api/zones/configuration/:id
- [ ] PUT /api/zones/configuration/:id
- [ ] DELETE /api/zones/configuration/:id

### Middleware
- [ ] JWT authentication
- [ ] customerID verification
- [ ] Request validation
- [ ] Error handling

### Controllers
- [ ] create() - with duplicate name check
- [ ] getAll() - with pagination
- [ ] getOne() - with ownership check
- [ ] update() - with version increment
- [ ] delete() - with soft/hard delete

### Testing
- [ ] Unit tests for validation
- [ ] Integration tests for all endpoints
- [ ] Authentication tests
- [ ] Authorization tests
- [ ] Edge cases

---

## ⏱️ Timeline

**Estimated:** 3-5 days

- Day 1: Database + POST + GET endpoints
- Day 2: PUT + DELETE endpoints
- Day 3: Testing + error handling
- Day 4-5: Integration testing + documentation

---

## 📝 Example: Node.js/Express Implementation

```javascript
// routes/zoneConfiguration.routes.js
const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const zoneConfigController = require('../controllers/zoneConfiguration');

router.post('/configuration', authenticateToken, zoneConfigController.create);
router.get('/configurations', authenticateToken, zoneConfigController.getAll);
router.get('/configuration/:id', authenticateToken, zoneConfigController.getOne);
router.put('/configuration/:id', authenticateToken, zoneConfigController.update);
router.delete('/configuration/:id', authenticateToken, zoneConfigController.delete);

module.exports = router;
```

```javascript
// controllers/zoneConfiguration.js
const ZoneConfig = require('../models/ZoneConfiguration');

exports.create = async (req, res) => {
  try {
    // Verify customerID matches token
    if (req.body.customerID !== req.user.customer._id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const config = new ZoneConfig({
      ...req.body,
      status: 'active',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await config.save();
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Name exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { customerID, status = 'active', limit = 50, offset = 0 } = req.query;

    if (customerID !== req.user.customer._id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const configs = await ZoneConfig
      .find({ customerID, status })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await ZoneConfig.countDocuments({ customerID, status });

    res.json({
      success: true,
      data: configs,
      pagination: { total, limit, offset, hasMore: total > offset + configs.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ... similar for getOne, update, delete
```

---

## 🎯 Success Criteria

- [ ] All 5 CRUD endpoints working
- [ ] Authentication on all endpoints
- [ ] User can only access own data
- [ ] Validation prevents invalid data
- [ ] Tests passing (unit + integration)
- [ ] Response time < 200ms (p95)
- [ ] API documentation complete

---

## 📚 Full Documentation

See `BACKEND_SPECIFICATION.md` for complete details including:
- Full request/response examples
- All error cases
- Performance considerations
- Monitoring requirements
- Complete code examples

---

**Status:** Ready to implement
**Priority:** Medium (optional enhancement)
**Complexity:** Medium
**Estimated Effort:** 3-5 days
