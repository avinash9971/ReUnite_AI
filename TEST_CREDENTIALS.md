# ReUnite AI - Test Credentials

## Test Accounts Created Successfully

### Citizen Account
- **Email:** citizen@bringhome.ai
- **Password:** citizen@bringhome.ai
- **Role:** user
- **Access:** Can report missing persons

### Admin Account
- **Email:** admin@bringhome.ai
- **Password:** admin@bringhome.ai
- **Role:** admin
- **Access:** Can view dashboard, upload found person images, view matching results

## Login Instructions

1. Go to the home page
2. Click on "Citizen Login" or "Admin Login"
3. Enter the credentials above
4. Click "Sign In"

## System Status

✓ Database schema created
✓ Test accounts created
✓ RLS policies configured
✓ Storage buckets configured
✓ Edge functions deployed
✓ TypeScript compilation successful
✓ Build successful

## Features Available

### For Citizens (User Role)
- Report missing persons with photo upload
- View submitted reports

### For Admins (Admin Role)
- View all missing person reports
- Upload found person images
- View AI matching results
- Confirm matches and notify families

## Database Tables
- profiles (user accounts)
- missing_persons (missing person reports)
- found_persons (found person uploads)

## Storage Buckets
- missing-persons-images (public)
- found-persons-images (public)

## Edge Functions
- match-faces (facial recognition matching)
- create-test-accounts (account setup utility)
