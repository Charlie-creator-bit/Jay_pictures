# Jay Pictures - Security Specification & Threat Model

This document outlines the strict data invariants, security boundaries, and validation payloads engineered to protect user records, booking sessions, transactional integrity, and private visual galleries inside Jay Pictures.

---

## 1. Data Invariants

1. **User Role Integrity (Non-Escalation)**:
   - A standard client user cannot assign themselves the role of `'admin'`.
   - Modifying a user profile `role` field is strictly limited to authenticated admins.
2. **Relational Synchronization**:
   - A `Booking` document must reference a real `user` (as `clientId`) and an active `service` (as `serviceId`).
   - A `Payment` or `Gallery` must map directly to a valid `Booking`.
   - TESTIMONIALS are linked to valid bookings and cannot be published without admin approval (`isApproved == false` by default on user submission).
3. **Temporal Invariants**:
   - `createdAt` must always match `request.time` on creation.
   - `updatedAt` must always match `request.time` on modification.
   - Chronological historical records cannot have future timestamps.
4. **PII and Asset Isolation**:
   - Private graphic assets inside a `Gallery` document must only be readable by the assigned `clientId` or verified site `admin` accounts.
   - Profiles with direct contact information (emails) must restrict read operations to the owner or admins.
5. **Denial of Wallet Protection**:
   - Custom document path IDs must be formatted alphanumeric strings under 128 characters: `^[a-zA-Z0-9_\-]+$`.
   - String fields and array payloads must have concrete size limits to block massive character-overflow vector attacks.
   - No `get()` or `exists()` queries can execute globally inside list operations to keep memory footprint bounded.

---

## 2. The "Dirty Dozen" Attack Payloads (Target: PERMISSION_DENIED)

Below are the 12 specific threat vectors drafted to bypass identity, integrity, and state transition rules. All such payloads must be rejected by the security boundaries.

### Threat 1: Self-Privilege Escalation during Registration
- **Target**: `/users/{userId}` (create)
- **Payload**: Standard user overrides their access tier to Admin on sign-up.
```json
{
  "fullName": "Malicious Attacker",
  "email": "attacker@example.com",
  "role": "admin",
  "createdAt": "SERVER_TIMESTAMP"
}
```

### Threat 2: Modifying User Identity Reference on Client Profile
- **Target**: `/users/{userId}` (update)
- **Payload**: Client attempts to rewrite their owner email or alter role structure.
```json
{
  "fullName": "Jane Cooper Update",
  "email": "hijacked@example.com",
  "role": "admin",
  "createdAt": "2024-05-19T14:57:17Z"
}
```

### Threat 3: Direct Booking Hijacking (Spoofing Client ID)
- **Target**: `/bookings/{bookingId}` (create)
- **Payload**: User `A_UID` submits booking posing as `B_UID` to steal/charge resource services.
```json
{
  "clientId": "B_UID_VICTIM",
  "serviceId": "commercial_shoot",
  "bookingDate": "2026-06-24T14:00:00Z",
  "status": "pending",
  "totalAmount": 450,
  "createdAt": "SERVER_TIMESTAMP",
  "updatedAt": "SERVER_TIMESTAMP"
}
```

### Threat 4: Unauthorized Booking State Advancement (Bypassing Tiers)
- **Target**: `/bookings/{bookingId}` (update)
- **Payload**: Standard client attempts to bypass admin validation, force-confirming their own booking.
```json
{
  "clientId": "A_UID",
  "serviceId": "commercial_shoot",
  "bookingDate": "2026-06-24T14:00:00Z",
  "status": "confirmed", 
  "totalAmount": 450,
  "createdAt": "2026-05-20T20:00:00Z",
  "updatedAt": "SERVER_TIMESTAMP"
}
```

### Threat 5: Resource Poisoning via Path Variable Overflows
- **Target**: `/bookings/{bookingId_Overflow_10k_String}`
- **Payload**: Injecting structured binary garbage characters in resource keys to cause Firestore indexing failures.

### Threat 6: Rogue Transaction Ledger Insertions (Faking Payments)
- **Target**: `/payments/{paymentId}` (create)
- **Payload**: User creates a client receipt confirming their session is paid without a real Stripe handshake.
```json
{
  "bookingId": "booking_123",
  "clientId": "victim_client_789",
  "amount": 9999,
  "currency": "USD",
  "status": "paid",
  "stripePaymentIntentId": "mock_intent_compromised",
  "createdAt": "SERVER_TIMESTAMP"
}
```

### Threat 7: Sniffing Private Gallery Metadata via Blanket Reads
- **Target**: `/galleries/{galleryId}` (list)
- **Payload**: Authenticated user runs an open query to list all active galleries of custom weddings without assigning query constraints.

### Threat 8: Hijacking Public testimonial Review Board Without Admins
- **Target**: `/testimonials/{testId}` (create)
- **Payload**: Client submits standard testimonial with preloaded admin confirmation (`isApproved: true`) to bypass the review queue.
```json
{
  "clientId": "client_abc",
  "bookingId": "booking_abc",
  "fullName": "Dishonest Brand",
  "rating": 5,
  "feedback": "Spam Content",
  "isApproved": true,
  "createdAt": "SERVER_TIMESTAMP"
}
```

### Threat 9: Admin Overrides Triggered by Threat Actors
- **Target**: `/services/{serviceId}` (create/delete)
- **Payload**: Standard client account bypasses checks to write, alter, or remove active packages and rates.

### Threat 10: State Destruction (Bypassing Temporal Invariants)
- **Target**: `/bookings/{bookingId}` (create)
- **Payload**: Injecting client-side date-times into `createdAt` variables instead of binding strictly to `request.time`.

### Threat 11: Bulk Denial of Wallet via Giant Custom Fields
- **Target**: `/testimonials/{testId}` (create)
- **Payload**: Standard feedback rating payload incorporating a 5MB nested string to crash database billing models.

### Threat 12: Calendar Availability Reservation Theft
- **Target**: `/availability/{slotId}` (update)
- **Payload**: User `C_UID` marks an active slots document as booked without logging corresponding booking relationships.

---

## 3. Test Runner Design Blueprint

The following structure represents the test harness executed in testing frameworks to block these vulnerabilities.

```typescript
// firestore.rules.test.ts
// Engineered for Zero-Trust Auditing of Jay Pictures Ruleset
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "true-triumph-f8gvj",
    firestore: {
      rules: require("fs").readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Jay Pictures - Access Control Unit Tests", () => {
  test("Threat 1: Client cannot register role as admin", async () => {
    const context = testEnv.authenticatedContext("compromised_uid");
    const db = context.firestore();
    const userRef = doc(db, "users", "compromised_uid");
    
    await expect(
      setDoc(userRef, {
        fullName: "Attacker User",
        email: "attacker@gmail.com",
        role: "admin",
        createdAt: "request.time",
      })
    ).rejects.toThrow();
  });
});
```
