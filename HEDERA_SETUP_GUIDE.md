# Hedera Account Setup - Troubleshooting Guide

## Issue: "Account created but failed to save to database"

This error occurs when the Hedera account is successfully created on the Hedera testnet, but fails to save to your Supabase database due to Row Level Security (RLS) policies.

## Quick Fix

1. **Run the SQL fix in Supabase:**
   - Open your Supabase project dashboard
   - Go to the SQL Editor
   - Copy and paste the contents of `fix-hedera-rls.sql`
   - Execute the SQL

2. **Verify your environment variables:**
   Make sure you have a `.env` file with:
   ```
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   REACT_APP_HEDERA_OPERATOR_ID=0.0.6615760
   REACT_APP_HEDERA_OPERATOR_KEY=your-operator-key
   ```

## Detailed Setup Steps

### 1. Supabase Setup
1. Create a new Supabase project at https://supabase.com
2. Go to Settings > API to get your URL and anon key
3. Go to SQL Editor and run the `supabase-schema.sql` file
4. Run the `fix-hedera-rls.sql` file to fix RLS policies

### 2. Hedera Setup
1. Get testnet HBAR from https://portal.hedera.com/faucet
2. Create a new account or use the provided test account
3. Set your operator ID and private key in the `.env` file

### 3. Environment Variables
Create a `.env` file in your project root:
```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Hedera Testnet Configuration
REACT_APP_HEDERA_OPERATOR_ID=0.0.6615760
REACT_APP_HEDERA_OPERATOR_KEY=your-operator-private-key
```

### 4. Test the Setup
1. Start your React app: `npm start`
2. Try creating a Hedera account
3. Check the browser console for detailed error messages
4. Check the Supabase logs in your project dashboard

## Common Issues

### RLS Policy Errors
- **Error**: "new row violates row-level security policy"
- **Solution**: Run the `fix-hedera-rls.sql` script

### Missing Environment Variables
- **Error**: "Missing Supabase environment variables"
- **Solution**: Create `.env` file with proper values

### Hedera Network Issues
- **Error**: "Failed to initialize Hedera client"
- **Solution**: Check your operator credentials and network connection

### Database Schema Issues
- **Error**: "relation does not exist"
- **Solution**: Run the `supabase-schema.sql` script

## Security Notes

The current RLS policies are permissive for development. In production, you should:
1. Implement proper authentication
2. Use more restrictive RLS policies
3. Encrypt private keys before storing
4. Use environment-specific configurations

## Getting Help

If you're still having issues:
1. Check the browser console for detailed error messages
2. Check the Supabase logs in your project dashboard
3. Verify all environment variables are set correctly
4. Ensure the database schema is properly set up
