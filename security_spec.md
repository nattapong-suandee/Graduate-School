# Security Specification - Graduate Management System

## 1. Data Invariants
- **User Integrity**: A user can only access their own profile. Only admins can list users.
- **Academic Content Integrity**: Only admins can manage class schedules, exams, and announcements.
- **Relational Access**: Students can only view academic content that matches their degree level (Master's or Doctoral).
- **Identity Safety**: Users cannot elevate their own roles to 'admin'.
- **System Safety**: All documents must have strict schemas and size limits.

## 2. Global Safety Primitives
- `isSignedIn()`: Auth check.
- `isAdmin()`: Role check via Firestore lookup.
- `isOwner(userId)`: ID match check.
- `isVerified()`: Email verification check.

## 3. The "Dirty Dozen" Logic Leaks (Test Cases)
1. **Self-Promotion**: Student attempts to update their own role to 'admin'. (FAIL expected)
2. **Accessing PII**: Student A attempts to 'get' Student B's profile. (FAIL expected)
3. **Ghost Announcements**: Student attempts to 'create' an announcement. (FAIL expected)
4. **Data Injection**: Student attempts to 'create' a user profile with a 1MB display name. (FAIL expected)
5. **Collection Scraping**: Student attempts to 'list' all users. (FAIL expected)
6. **Bypassing Filters**: Student attempts to 'list' all class schedules without filtering for their degree level (if strictly enforced).
7. **Identity Spoofing**: User attempts to create a profile with a different UID than their auth UID. (FAIL expected)
8. **Shadow Fields**: User attempts to add a `verified: true` field to a document where it shouldn't exist. (FAIL expected)
9. **Terminal State Change**: Attempting to change an immutable field like `createdAt`. (FAIL expected)
10. **Malicious Degree Level**: Student attempts to set an invalid degree level like "Unknown Degrees". (FAIL expected)
11. **Spoofed Admin Check**: Authenticated user with email `admin@bu.ac.th` but `email_verified: false` attempts admin action. (FAIL expected)
12. **Orphaned Content**: Admin attempts to create a class schedule with missing required fields. (FAIL expected)

## 4. Test Runner Plan
- Verify all 12 scenarios in `firestore.rules.test.ts`.
- Ensure all "allow list" rules evaluate `resource.data` to prevent unauthorized query scraping.
