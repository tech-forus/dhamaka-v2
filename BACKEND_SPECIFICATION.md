# Backend API Specification - Zone Configuration Management

**Project:** Dhamaka v2 - FreightCompare
**Feature:** Zone Configuration & Price Matrix Management
**Date:** 2025-01-11
**Version:** 1.0

---

## 📋 Overview

This document specifies the backend API endpoints needed to support saving, managing, and retrieving zone configurations from the ZonePriceMatrix page.

### Requirements Summary
- ✅ Save zone configurations to database
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ User-scoped only (no sharing between users)
- ✅ Authentication required for all endpoints
- ✅ Validation of zone codes and price data

---

## 🗄️ Database Schema

### Collection: `zone_configurations`

```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  customerID: String,               // User ID from JWT token (required, indexed)
  configName: String,               // User-defined name (required, max 100 chars)
  description: String,              // Optional description (max 500 chars)

  // Zone definitions
  zones: [
    {
      zoneCode: String,             // e.g., "N1", "S2" (required)
      zoneName: String,             // e.g., "North Zone 1" (required)
      region: String,               // "North" | "South" | "East" | "West" | "Northeast" | "Central"
      selectedStates: [String],     // Array of state names
      selectedCities: [String],     // Array in format "City||State"
      isComplete: Boolean           // Whether zone is fully configured
    }
  ],

  // Price matrix
  priceMatrix: [
    {
      fromZone: String,             // Source zone code (required)
      toZone: String,               // Destination zone code (required)
      price: Number                 // Price value (can be null, max 3 decimals)
    }
  ],

  // Metadata
  status: String,                   // "active" | "archived" (default: "active")
  createdAt: Date,                  // Auto-generated timestamp
  updatedAt: Date,                  // Auto-updated timestamp
  version: Number                   // Version number (default: 1, increment on update)
}
```

### Indexes

```javascript
// Primary indexes
db.zone_configurations.createIndex({ customerID: 1 })
db.zone_configurations.createIndex({ customerID: 1, configName: 1 }, { unique: true })
db.zone_configurations.createIndex({ createdAt: -1 })
db.zone_configurations.createIndex({ status: 1 })

// Compound index for filtering
db.zone_configurations.createIndex({ customerID: 1, status: 1, createdAt: -1 })
```

---

## 🔌 API Endpoints

### Base URL
```
https://your-api-domain.com/api/zones
```

### Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 1️⃣ Create Zone Configuration

**Endpoint:** `POST /api/zones/configuration`

**Purpose:** Save a new zone configuration with price matrix

### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Request Body
```json
{
  "customerID": "507f1f77bcf86cd799439011",
  "configName": "North-South Express Routes",
  "description": "Primary zones for express delivery between North and South regions",
  "zones": [
    {
      "zoneCode": "N1",
      "zoneName": "North Zone 1",
      "region": "North",
      "selectedStates": ["Delhi", "Haryana", "Punjab"],
      "selectedCities": [
        "Delhi||Delhi",
        "Gurgaon||Haryana",
        "Chandigarh||Punjab"
      ],
      "isComplete": true
    },
    {
      "zoneCode": "S1",
      "zoneName": "South Zone 1",
      "region": "South",
      "selectedStates": ["Karnataka", "Tamil Nadu"],
      "selectedCities": [
        "Bangalore||Karnataka",
        "Chennai||Tamil Nadu"
      ],
      "isComplete": true
    }
  ],
  "priceMatrix": [
    {
      "fromZone": "N1",
      "toZone": "S1",
      "price": 125.50
    },
    {
      "fromZone": "S1",
      "toZone": "N1",
      "price": 130.75
    },
    {
      "fromZone": "N1",
      "toZone": "N1",
      "price": 50.00
    },
    {
      "fromZone": "S1",
      "toZone": "S1",
      "price": 45.00
    }
  ]
}
```

### Validation Rules
- `customerID`: Required, must match JWT token user ID
- `configName`: Required, 1-100 characters, must be unique per customer
- `description`: Optional, max 500 characters
- `zones`: Required, array with 1-28 zones
- `zones[].zoneCode`: Required, must match pattern: `^(N|S|E|W|NE|C)[1-6]$`
- `zones[].zoneName`: Required, 1-100 characters
- `zones[].region`: Required, must be one of: "North", "South", "East", "West", "Northeast", "Central"
- `zones[].selectedStates`: Optional array
- `zones[].selectedCities`: Optional array, format: "City||State"
- `zones[].isComplete`: Boolean
- `priceMatrix`: Required array
- `priceMatrix[].fromZone`: Required, must exist in zones array
- `priceMatrix[].toZone`: Required, must exist in zones array
- `priceMatrix[].price`: Number or null, if number: >= 0, max 3 decimal places

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Zone configuration created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "customerID": "507f1f77bcf86cd799439011",
    "configName": "North-South Express Routes",
    "description": "Primary zones for express delivery between North and South regions",
    "zones": [...],
    "priceMatrix": [...],
    "status": "active",
    "version": 1,
    "createdAt": "2025-01-11T10:30:00.000Z",
    "updatedAt": "2025-01-11T10:30:00.000Z"
  }
}
```

### Error Responses

**400 Bad Request - Validation Error**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "configName": "Configuration name already exists",
    "zones": "Must have at least one zone",
    "priceMatrix[0].price": "Price must be a positive number"
  }
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Authentication required. Please sign in."
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "Customer ID mismatch. You can only create configurations for yourself."
}
```

**409 Conflict**
```json
{
  "success": false,
  "message": "A configuration with this name already exists"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Failed to create zone configuration",
  "error": "Database connection error"
}
```

---

## 2️⃣ Get All Zone Configurations

**Endpoint:** `GET /api/zones/configurations`

**Purpose:** Retrieve all zone configurations for the authenticated user

### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
```

### Query Parameters
- `customerID` (required): String - User ID
- `status` (optional): String - Filter by status ("active" | "archived")
- `limit` (optional): Number - Results per page (default: 50, max: 100)
- `offset` (optional): Number - Skip N results (default: 0)
- `sort` (optional): String - Sort field (default: "createdAt")
- `order` (optional): String - Sort order ("asc" | "desc", default: "desc")

### Example Request
```
GET /api/zones/configurations?customerID=507f1f77bcf86cd799439011&status=active&limit=20&sort=createdAt&order=desc
```

### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "customerID": "507f1f77bcf86cd799439011",
      "configName": "North-South Express Routes",
      "description": "Primary zones for express delivery",
      "zones": [...],
      "priceMatrix": [...],
      "status": "active",
      "version": 1,
      "createdAt": "2025-01-11T10:30:00.000Z",
      "updatedAt": "2025-01-11T10:30:00.000Z"
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "customerID": "507f1f77bcf86cd799439011",
      "configName": "East-West Economy Routes",
      "description": "Budget-friendly routes for E-W",
      "zones": [...],
      "priceMatrix": [...],
      "status": "active",
      "version": 2,
      "createdAt": "2025-01-10T15:20:00.000Z",
      "updatedAt": "2025-01-11T09:15:00.000Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "message": "Missing required parameter: customerID"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "You can only access your own configurations"
}
```

---

## 3️⃣ Get Single Zone Configuration

**Endpoint:** `GET /api/zones/configuration/:id`

**Purpose:** Retrieve a specific zone configuration by ID

### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
```

### URL Parameters
- `id` (required): String - Configuration ID

### Example Request
```
GET /api/zones/configuration/65a1b2c3d4e5f6g7h8i9j0k1
```

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "customerID": "507f1f77bcf86cd799439011",
    "configName": "North-South Express Routes",
    "description": "Primary zones for express delivery between North and South regions",
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
    ],
    "status": "active",
    "version": 1,
    "createdAt": "2025-01-11T10:30:00.000Z",
    "updatedAt": "2025-01-11T10:30:00.000Z"
  }
}
```

### Error Responses

**404 Not Found**
```json
{
  "success": false,
  "message": "Zone configuration not found"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "You don't have permission to access this configuration"
}
```

---

## 4️⃣ Update Zone Configuration

**Endpoint:** `PUT /api/zones/configuration/:id`

**Purpose:** Update an existing zone configuration

### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### URL Parameters
- `id` (required): String - Configuration ID

### Request Body
Same structure as POST, all fields are optional (send only what needs to be updated):

```json
{
  "configName": "North-South Express Routes v2",
  "description": "Updated description",
  "zones": [...],
  "priceMatrix": [...]
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Zone configuration updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "customerID": "507f1f77bcf86cd799439011",
    "configName": "North-South Express Routes v2",
    "description": "Updated description",
    "zones": [...],
    "priceMatrix": [...],
    "status": "active",
    "version": 2,
    "createdAt": "2025-01-11T10:30:00.000Z",
    "updatedAt": "2025-01-11T14:20:00.000Z"
  }
}
```

### Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "configName": "Name already exists"
  }
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Zone configuration not found"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "You don't have permission to update this configuration"
}
```

---

## 5️⃣ Delete Zone Configuration

**Endpoint:** `DELETE /api/zones/configuration/:id`

**Purpose:** Delete a zone configuration (soft delete - sets status to 'archived')

### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
```

### URL Parameters
- `id` (required): String - Configuration ID

### Query Parameters
- `hard` (optional): Boolean - If true, permanently delete (default: false for soft delete)

### Example Request
```
DELETE /api/zones/configuration/65a1b2c3d4e5f6g7h8i9j0k1
DELETE /api/zones/configuration/65a1b2c3d4e5f6g7h8i9j0k1?hard=true
```

### Success Response (200 OK)

**Soft Delete:**
```json
{
  "success": true,
  "message": "Zone configuration archived successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "status": "archived",
    "updatedAt": "2025-01-11T15:00:00.000Z"
  }
}
```

**Hard Delete:**
```json
{
  "success": true,
  "message": "Zone configuration deleted permanently"
}
```

### Error Responses

**404 Not Found**
```json
{
  "success": false,
  "message": "Zone configuration not found"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "You don't have permission to delete this configuration"
}
```

---

## 🔐 Authentication & Authorization

### Token Validation
All endpoints must:
1. Extract JWT token from `Authorization: Bearer <token>` header
2. Verify token signature and expiration
3. Extract `customerID` from token payload
4. Match against request `customerID` (for GET list) or document owner (for single operations)

### Example Token Payload
```json
{
  "customer": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "iat": 1704974400,
  "exp": 1705060800
}
```

### Authorization Rules
- Users can ONLY access their own configurations
- `customerID` from token must match document's `customerID`
- No sharing or public configurations
- Admin role (if exists) can access all configurations

---

## ✅ Validation Rules

### Zone Code Validation
Valid zone codes: `N1-N6`, `S1-S6`, `E1-E4`, `W1-W4`, `NE1-NE4`, `C1-C4`

**Regex:** `^(N|S|E|W|NE|C)[1-6]$`

```javascript
// Valid examples
"N1", "N2", "N3", "N4", "N5", "N6"  // North
"S1", "S2", "S3", "S4", "S5", "S6"  // South
"E1", "E2", "E3", "E4"              // East
"W1", "W2", "W3", "W4"              // West
"NE1", "NE2", "NE3", "NE4"          // Northeast
"C1", "C2", "C3", "C4"              // Central

// Invalid examples
"N7", "N0", "N", "X1", "NE5"
```

### Region Validation
Valid regions: `North`, `South`, `East`, `West`, `Northeast`, `Central`

### Price Validation
- Type: Number or null
- If number:
  - Must be >= 0
  - Maximum 3 decimal places (e.g., 125.999)
  - Maximum value: 999999.999

### Configuration Name Validation
- Required
- Length: 1-100 characters
- Must be unique per customer
- Alphanumeric, spaces, hyphens, underscores allowed
- Regex: `^[a-zA-Z0-9 _-]{1,100}$`

### Description Validation
- Optional
- Maximum length: 500 characters

### Array Limits
- `zones`: Minimum 1, maximum 28
- `priceMatrix`: No specific limit, but should have N×N entries where N = number of zones
- `selectedStates`: No limit
- `selectedCities`: No limit (but reasonable backend limit recommended, e.g., 10,000)

---

## 🧪 Testing

### Test Cases

#### 1. Create Configuration
```bash
# Valid creation
curl -X POST https://api.example.com/api/zones/configuration \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "customerID": "507f1f77bcf86cd799439011",
    "configName": "Test Config",
    "zones": [{
      "zoneCode": "N1",
      "zoneName": "North 1",
      "region": "North",
      "selectedStates": ["Delhi"],
      "selectedCities": ["Delhi||Delhi"],
      "isComplete": true
    }],
    "priceMatrix": [{
      "fromZone": "N1",
      "toZone": "N1",
      "price": 50.00
    }]
  }'

# Expected: 201 Created with full data
```

#### 2. Get All Configurations
```bash
curl -X GET "https://api.example.com/api/zones/configurations?customerID=507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: 200 OK with array of configurations
```

#### 3. Get Single Configuration
```bash
curl -X GET "https://api.example.com/api/zones/configuration/65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: 200 OK with single configuration
```

#### 4. Update Configuration
```bash
curl -X PUT "https://api.example.com/api/zones/configuration/65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "configName": "Updated Name",
    "description": "New description"
  }'

# Expected: 200 OK with updated data, version incremented
```

#### 5. Delete Configuration
```bash
# Soft delete
curl -X DELETE "https://api.example.com/api/zones/configuration/65a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: 200 OK, status changed to "archived"

# Hard delete
curl -X DELETE "https://api.example.com/api/zones/configuration/65a1b2c3d4e5f6g7h8i9j0k1?hard=true" \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: 200 OK, document permanently deleted
```

### Edge Cases to Test
1. ❌ Creating with duplicate name → 409 Conflict
2. ❌ Accessing another user's config → 403 Forbidden
3. ❌ Invalid zone codes → 400 Bad Request
4. ❌ Negative prices → 400 Bad Request
5. ❌ More than 28 zones → 400 Bad Request
6. ❌ Missing required fields → 400 Bad Request
7. ❌ Invalid token → 401 Unauthorized
8. ❌ Expired token → 401 Unauthorized
9. ✅ Empty price matrix → 200 OK (allowed)
10. ✅ Null prices in matrix → 200 OK (allowed)

---

## 🚀 Implementation Guide

### Step 1: Database Setup (MongoDB)
```javascript
// Create collection
db.createCollection('zone_configurations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['customerID', 'configName', 'zones', 'priceMatrix', 'status'],
      properties: {
        customerID: { bsonType: 'string' },
        configName: { bsonType: 'string', minLength: 1, maxLength: 100 },
        description: { bsonType: 'string', maxLength: 500 },
        zones: {
          bsonType: 'array',
          minItems: 1,
          maxItems: 28,
          items: {
            bsonType: 'object',
            required: ['zoneCode', 'zoneName', 'region'],
            properties: {
              zoneCode: { bsonType: 'string', pattern: '^(N|S|E|W|NE|C)[1-6]$' },
              zoneName: { bsonType: 'string' },
              region: { enum: ['North', 'South', 'East', 'West', 'Northeast', 'Central'] },
              selectedStates: { bsonType: 'array' },
              selectedCities: { bsonType: 'array' },
              isComplete: { bsonType: 'bool' }
            }
          }
        },
        priceMatrix: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['fromZone', 'toZone'],
            properties: {
              fromZone: { bsonType: 'string' },
              toZone: { bsonType: 'string' },
              price: { bsonType: ['number', 'null'] }
            }
          }
        },
        status: { enum: ['active', 'archived'] },
        version: { bsonType: 'int', minimum: 1 },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

// Create indexes
db.zone_configurations.createIndex({ customerID: 1 });
db.zone_configurations.createIndex({ customerID: 1, configName: 1 }, { unique: true });
db.zone_configurations.createIndex({ createdAt: -1 });
db.zone_configurations.createIndex({ status: 1 });
```

### Step 2: Controller Structure (Node.js/Express Example)
```javascript
// routes/zoneConfiguration.routes.js
const express = require('express');
const router = express.Router();
const zoneConfigController = require('../controllers/zoneConfiguration.controller');
const { authenticateToken } = require('../middleware/auth');

router.post('/configuration', authenticateToken, zoneConfigController.create);
router.get('/configurations', authenticateToken, zoneConfigController.getAll);
router.get('/configuration/:id', authenticateToken, zoneConfigController.getOne);
router.put('/configuration/:id', authenticateToken, zoneConfigController.update);
router.delete('/configuration/:id', authenticateToken, zoneConfigController.delete);

module.exports = router;
```

### Step 3: Validation Middleware
```javascript
// middleware/validateZoneConfig.js
const validateZoneConfig = (req, res, next) => {
  const { customerID, configName, zones, priceMatrix } = req.body;

  // Validate customerID matches token
  if (customerID !== req.user.customer._id) {
    return res.status(403).json({
      success: false,
      message: 'Customer ID mismatch'
    });
  }

  // Validate configName
  if (!configName || configName.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Invalid configuration name'
    });
  }

  // Validate zones
  if (!Array.isArray(zones) || zones.length === 0 || zones.length > 28) {
    return res.status(400).json({
      success: false,
      message: 'Zones must be an array with 1-28 items'
    });
  }

  // Validate zone codes
  const validZonePattern = /^(N|S|E|W|NE|C)[1-6]$/;
  for (const zone of zones) {
    if (!validZonePattern.test(zone.zoneCode)) {
      return res.status(400).json({
        success: false,
        message: `Invalid zone code: ${zone.zoneCode}`
      });
    }
  }

  // Validate price matrix
  if (!Array.isArray(priceMatrix)) {
    return res.status(400).json({
      success: false,
      message: 'Price matrix must be an array'
    });
  }

  const zoneCodes = zones.map(z => z.zoneCode);
  for (const entry of priceMatrix) {
    if (!zoneCodes.includes(entry.fromZone) || !zoneCodes.includes(entry.toZone)) {
      return res.status(400).json({
        success: false,
        message: 'Price matrix references non-existent zones'
      });
    }

    if (entry.price !== null && (entry.price < 0 || entry.price > 999999.999)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price value'
      });
    }
  }

  next();
};

module.exports = validateZoneConfig;
```

### Step 4: Controller Implementation
```javascript
// controllers/zoneConfiguration.controller.js
const ZoneConfiguration = require('../models/ZoneConfiguration');

exports.create = async (req, res) => {
  try {
    const config = new ZoneConfiguration({
      ...req.body,
      status: 'active',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await config.save();

    res.status(201).json({
      success: true,
      message: 'Zone configuration created successfully',
      data: config
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Configuration name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create zone configuration',
      error: error.message
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { customerID, status = 'active', limit = 50, offset = 0, sort = 'createdAt', order = 'desc' } = req.query;

    // Verify customer ID matches token
    if (customerID !== req.user.customer._id) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own configurations'
      });
    }

    const query = { customerID };
    if (status) query.status = status;

    const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

    const configs = await ZoneConfiguration
      .find(query)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await ZoneConfiguration.countDocuments(query);

    res.status(200).json({
      success: true,
      data: configs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > (parseInt(offset) + configs.length)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch configurations',
      error: error.message
    });
  }
};

exports.getOne = async (req, res) => {
  try {
    const config = await ZoneConfiguration.findById(req.params.id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Zone configuration not found'
      });
    }

    // Verify ownership
    if (config.customerID !== req.user.customer._id) {
      return res.status(403).json({
        success: false,
        message: 'You don\'t have permission to access this configuration'
      });
    }

    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch configuration',
      error: error.message
    });
  }
};

exports.update = async (req, res) => {
  try {
    const config = await ZoneConfiguration.findById(req.params.id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Zone configuration not found'
      });
    }

    // Verify ownership
    if (config.customerID !== req.user.customer._id) {
      return res.status(403).json({
        success: false,
        message: 'You don\'t have permission to update this configuration'
      });
    }

    // Update fields
    Object.assign(config, req.body);
    config.version += 1;
    config.updatedAt = new Date();

    await config.save();

    res.status(200).json({
      success: true,
      message: 'Zone configuration updated successfully',
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update configuration',
      error: error.message
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const config = await ZoneConfiguration.findById(req.params.id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Zone configuration not found'
      });
    }

    // Verify ownership
    if (config.customerID !== req.user.customer._id) {
      return res.status(403).json({
        success: false,
        message: 'You don\'t have permission to delete this configuration'
      });
    }

    const hardDelete = req.query.hard === 'true';

    if (hardDelete) {
      await ZoneConfiguration.findByIdAndDelete(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Zone configuration deleted permanently'
      });
    } else {
      config.status = 'archived';
      config.updatedAt = new Date();
      await config.save();

      return res.status(200).json({
        success: true,
        message: 'Zone configuration archived successfully',
        data: {
          _id: config._id,
          status: config.status,
          updatedAt: config.updatedAt
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete configuration',
      error: error.message
    });
  }
};
```

---

## 📊 Performance Considerations

### Indexing Strategy
- Primary queries: By customerID (indexed)
- Unique constraint: customerID + configName (compound index)
- Sorting: createdAt (indexed)
- Filtering: status (indexed)

### Pagination
- Default limit: 50 configurations
- Maximum limit: 100 configurations
- Use offset-based pagination for simplicity
- Consider cursor-based pagination if dataset grows large

### Caching (Optional)
- Cache frequently accessed configurations (Redis)
- Cache key: `zone_config:${customerID}:${configId}`
- TTL: 5 minutes
- Invalidate on update/delete

---

## 🔍 Monitoring & Logging

### Metrics to Track
- API request count per endpoint
- Response times (p50, p95, p99)
- Error rates by status code
- Database query performance
- Configuration creation rate
- Active vs archived configurations ratio

### Logging Requirements
```javascript
// Log format
{
  timestamp: "2025-01-11T10:30:00.000Z",
  level: "info",
  endpoint: "POST /api/zones/configuration",
  customerID: "507f1f77bcf86cd799439011",
  action: "create_configuration",
  configName: "North-South Routes",
  duration: 150,
  status: 201
}
```

---

## 🚨 Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": {
    "field1": "Specific validation error",
    "field2": "Another validation error"
  },
  "code": "ERROR_CODE",
  "timestamp": "2025-01-11T10:30:00.000Z"
}
```

### Error Codes
- `VALIDATION_ERROR` - 400 Bad Request
- `UNAUTHORIZED` - 401 Unauthorized
- `FORBIDDEN` - 403 Forbidden
- `NOT_FOUND` - 404 Not Found
- `CONFLICT` - 409 Conflict (duplicate name)
- `INTERNAL_ERROR` - 500 Internal Server Error

---

## ✅ Checklist for Backend Team

### Database
- [ ] Create `zone_configurations` collection
- [ ] Add indexes (customerID, customerID+configName, createdAt, status)
- [ ] Set up schema validation
- [ ] Test database queries

### API Endpoints
- [ ] Implement POST /api/zones/configuration
- [ ] Implement GET /api/zones/configurations
- [ ] Implement GET /api/zones/configuration/:id
- [ ] Implement PUT /api/zones/configuration/:id
- [ ] Implement DELETE /api/zones/configuration/:id

### Authentication & Authorization
- [ ] Add JWT token validation
- [ ] Verify customerID from token
- [ ] Implement ownership checks
- [ ] Test unauthorized access scenarios

### Validation
- [ ] Validate zone codes (regex pattern)
- [ ] Validate regions (enum)
- [ ] Validate prices (range, decimals)
- [ ] Validate configuration name uniqueness
- [ ] Test all validation rules

### Error Handling
- [ ] Implement standard error format
- [ ] Handle database errors
- [ ] Handle validation errors
- [ ] Add error logging

### Testing
- [ ] Unit tests for validation
- [ ] Integration tests for all endpoints
- [ ] Test authentication/authorization
- [ ] Test edge cases
- [ ] Load testing

### Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Error code documentation
- [ ] Example requests/responses
- [ ] Deployment guide

### Deployment
- [ ] Environment configuration
- [ ] Database migration scripts
- [ ] Monitoring setup
- [ ] Logging configuration

---

## 📅 Timeline Estimate

### Phase 1: Core CRUD (2-3 days)
- Database setup
- Create/Read/Update/Delete endpoints
- Basic validation
- Authentication

### Phase 2: Advanced Features (1-2 days)
- Pagination
- Filtering & sorting
- Soft delete
- Version tracking

### Phase 3: Testing & Polish (1-2 days)
- Unit & integration tests
- Error handling
- Documentation
- Performance optimization

**Total:** 4-7 days

---

## 🎯 Success Criteria

- [ ] All 5 CRUD endpoints working
- [ ] 100% authentication coverage
- [ ] User can only access own configurations
- [ ] Validation prevents invalid data
- [ ] Tests cover all endpoints
- [ ] API documentation complete
- [ ] Frontend integration tested
- [ ] Performance meets requirements (< 200ms p95)

---

**Document Version:** 1.0
**Last Updated:** 2025-01-11
**Prepared by:** Claude Code
**Status:** Ready for Implementation

---

## 📞 Questions?

If the backend team has questions, refer to:
- `BACKEND_INTEGRATION_ANALYSIS.md` - Technical analysis
- `BACKEND_INTEGRATION_SUMMARY.md` - Executive summary
- `ZONE_SELECTOR_INTEGRATION.md` - Frontend integration guide
