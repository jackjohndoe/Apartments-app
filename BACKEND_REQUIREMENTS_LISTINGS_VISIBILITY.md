# Backend Requirements: Listings Visibility Fix

## Problem
Users can only see their own uploaded listings in the Explore screen, not listings from other users. This indicates the backend API `/api/apartments` endpoint is filtering by the authenticated user instead of returning all listings.

## Frontend Status: ✅ FIXED

The frontend has been updated to ensure no user-specific filtering happens:

1. **`apartmentService.getApartments()`** - Now explicitly removes any user-specific filters (`createdBy`, `hostEmail`, `userEmail`, `userId`, `owner`, `creator`) before making the API call
2. **`hybridService.getAllApartmentsForExplore()`** - Ensures empty filters are passed and removes any user-specific filters
3. **`ExploreScreen.js`** - Only filters by UI criteria (Pool, Pet-friendly, bedrooms, search query) - NO user filtering

## Backend Action Required: ⚠️ CRITICAL

The backend `/api/apartments` endpoint MUST be updated to return ALL listings from ALL users, not just the authenticated user's listings.

### Current Backend Issue

The backend is likely filtering listings by the authenticated user. This is incorrect for a marketplace app where all users should see all available listings.

### Backend Fix Required

**Endpoint**: `GET /api/apartments`

**Current Behavior (WRONG)**:
```java
// Example of what backend might be doing (WRONG):
@GetMapping("/api/apartments")
public ResponseEntity<List<Apartment>> getApartments(Authentication auth) {
    String userEmail = auth.getName();
    // ❌ WRONG: Filtering by user
    return apartmentRepository.findByCreatedBy(userEmail);
}
```

**Required Behavior (CORRECT)**:
```java
// What backend SHOULD do:
@GetMapping("/api/apartments")
public ResponseEntity<Page<Apartment>> getApartments(
    @RequestParam(required = false) Integer page,
    @RequestParam(required = false) Integer size
) {
    // ✅ CORRECT: Return ALL active listings regardless of creator
    Pageable pageable = PageRequest.of(
        page != null ? page : 0, 
        size != null ? size : 100
    );
    return ResponseEntity.ok(apartmentRepository.findAll(pageable));
}
```

### Backend Endpoints Should Be:

1. **`GET /api/apartments`** - Returns ALL listings from ALL users (for marketplace/Explore screen)
   - Should NOT filter by authenticated user
   - Should support pagination (`page`, `size` parameters)
   - Should return all active listings regardless of creator

2. **`GET /api/apartments/my-listings`** - Returns ONLY the authenticated user's listings (for "My Listings" screen)
   - SHOULD filter by authenticated user
   - This endpoint is correctly used in `MyListingsScreen.js`

### Verification Steps

After backend fix, verify:

1. User A creates a listing
2. User B logs in (different account)
3. User B navigates to Explore screen
4. **Expected**: User B should see User A's listing
5. **Current (WRONG)**: User B only sees their own listings

### Backend Code Locations to Check

Look for these patterns in the backend code:

1. **Repository/Service Layer**:
   - `findByCreatedBy(userEmail)` - ❌ Remove this filter for `/api/apartments`
   - `findByHostEmail(userEmail)` - ❌ Remove this filter for `/api/apartments`
   - `findAll()` - ✅ Use this for `/api/apartments`

2. **Controller Layer**:
   - Check if controller extracts `userEmail` from `Authentication` object
   - Check if controller passes `userEmail` to service/repository
   - Remove user filtering for `/api/apartments` endpoint

3. **Security/Authorization**:
   - Authentication should still be required (for security)
   - But results should NOT be filtered by user

### Example Backend Fix (Spring Boot)

**Before (WRONG)**:
```java
@GetMapping("/api/apartments")
public ResponseEntity<Page<ApartmentDTO>> getApartments(
    @RequestParam(required = false) Integer page,
    @RequestParam(required = false) Integer size,
    Authentication authentication
) {
    String userEmail = authentication.getName();
    Pageable pageable = PageRequest.of(page != null ? page : 0, size != null ? size : 100);
    
    // ❌ WRONG: Filtering by user
    Page<Apartment> apartments = apartmentRepository.findByCreatedBy(userEmail, pageable);
    return ResponseEntity.ok(apartments.map(apartmentMapper::toDTO));
}
```

**After (CORRECT)**:
```java
@GetMapping("/api/apartments")
public ResponseEntity<Page<ApartmentDTO>> getApartments(
    @RequestParam(required = false) Integer page,
    @RequestParam(required = false) Integer size
    // Note: Authentication can still be required for security, but don't use it for filtering
) {
    Pageable pageable = PageRequest.of(page != null ? page : 0, size != null ? size : 100);
    
    // ✅ CORRECT: Return ALL listings
    Page<Apartment> apartments = apartmentRepository.findAll(pageable);
    return ResponseEntity.ok(apartments.map(apartmentMapper::toDTO));
}
```

### Testing Checklist

- [ ] User A creates a listing
- [ ] User B (different account) logs in
- [ ] User B navigates to Explore screen
- [ ] User B sees User A's listing ✅
- [ ] User B sees their own listings ✅
- [ ] User B sees listings from multiple users ✅
- [ ] `/api/apartments/my-listings` still returns only User B's listings ✅

## Summary

- **Frontend**: ✅ Fixed - No user filtering in frontend code
- **Backend**: ⚠️ **ACTION REQUIRED** - Remove user filtering from `/api/apartments` endpoint
- **Expected Result**: All users see all listings in Explore screen (marketplace behavior)







