# Security Configuration Guide

## ⚠️ Critical Security Setup Required

This application handles sensitive personal data including medical information, CPF/RG numbers, and student records. The following security measures have been implemented and require proper configuration:

## 🔒 Database Security (Implemented)

### Row Level Security (RLS)
- ✅ Enhanced RLS policies for medical data protection
- ✅ Field-level access control for instructors
- ✅ Audit logging for sensitive data access
- ✅ Security definer functions for safe data access

### Access Control Matrix
| Role | Basic Profile | Personal Data (CPF/RG) | Medical Data | Admin Functions |
|------|---------------|------------------------|--------------|-----------------|
| Admin | ✅ Full | ✅ Full | ✅ Full | ✅ All |
| Secretary | ✅ Full | ✅ Full | ✅ Full | ❌ Limited |
| Instructor | ✅ Students Only | ❌ Restricted | ❌ Restricted | ❌ None |
| Student | ✅ Own Only | ✅ Own Only | ✅ Own Only | ❌ None |

## 🛡️ Environment Variables (REQUIRED SETUP)

### For PHP Backend (if used):
Create a `.env` file in your server root with:

```bash
# Database Configuration
DB_HOST=your_database_host
DB_NAME=your_database_name  
DB_USER=your_database_user
DB_PASS=your_secure_database_password

# JWT Security
JWT_SECRET=generate_a_secure_random_key_here
```

**⚠️ CRITICAL**: Never commit real credentials to version control!

### JWT Secret Generation
Generate a secure JWT secret:
```bash
# Using OpenSSL
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📊 Audit Logging

All sensitive data access is automatically logged to the `audit_logs` table:
- User who accessed the data
- Timestamp of access
- Fields that were accessed
- Action performed

## 🔧 Supabase Configuration Warnings

The following Supabase security settings need attention:

### 1. Auth OTP Expiry ⚠️
- **Issue**: OTP expiry exceeds recommended threshold
- **Fix**: Configure shorter OTP expiry in Supabase Dashboard → Authentication → Settings

### 2. Leaked Password Protection ⚠️  
- **Issue**: Protection against compromised passwords is disabled
- **Fix**: Enable in Supabase Dashboard → Authentication → Settings → Password Protection

### 3. PostgreSQL Version ⚠️
- **Issue**: Security patches available for current PostgreSQL version
- **Fix**: Schedule database upgrade through Supabase Dashboard → Settings → Database

## 🎯 Data Protection Features

### Medical Data Protection
- Medical information only accessible to admins, secretaries, and the student themselves
- Instructors cannot access medical data, allergies, or health conditions
- All medical data access is logged

### Personal Data Protection  
- CPF, RG, and address information protected from instructor access
- Data masking in UI for unauthorized users
- Clear indication when data is protected

### Student Academic Privacy
- Instructors can only see students from their assigned classes/subjects
- Academic performance data has role-based access controls
- Grade information follows instructor-subject assignment rules

## 🚨 Security Best Practices

### For Admins:
1. Regularly review audit logs for suspicious activity
2. Monitor user role assignments
3. Ensure environment variables are properly configured
4. Keep Supabase configuration updated

### For Developers:
1. Never log sensitive data in console or error messages
2. Always use the SecureDataAccess component for sensitive information
3. Test role-based access thoroughly
4. Follow the principle of least privilege

### For Deployment:
1. Use environment variables for all secrets
2. Enable HTTPS in production
3. Configure proper CORS origins
4. Set up monitoring and alerting

## 📋 Security Checklist

### ✅ IMPLEMENTED (Latest Security Fixes)
- [x] **Enhanced RLS policies** - Added field-level access control for profiles
- [x] **Secure data access components** - SecureDataAccess and SecureProfileView implemented
- [x] **Hardcoded credentials removed** - Environment variables now mandatory 
- [x] **Medical data protection** - Enhanced logging and access controls
- [x] **Storage security** - File type validation and access control for declarations
- [x] **Profile update validation** - Trigger prevents unauthorized field modifications
- [x] **Audit logging enhanced** - Medical data access specifically tracked

### ⚠️ REQUIRES CONFIGURATION
- [ ] Environment variables configured (JWT_SECRET, DB credentials) - **CRITICAL: Now mandatory**
- [ ] Supabase OTP expiry configured (currently > 24h, should be 5-15 minutes)
- [ ] Leaked password protection enabled in Supabase Dashboard
- [ ] PostgreSQL version updated (security patches available)
- [ ] CORS origins properly configured for production domain
- [ ] HTTPS enabled in production
- [ ] Security monitoring alerts configured
- [ ] User roles properly assigned and tested

## 🔍 Testing Security

To verify security implementation:

1. **Test Role Access**:
   - Login as instructor and verify limited student data access
   - Confirm medical data is not visible to instructors
   - Test that students can only see their own data

2. **Audit Logging**:
   - Check that sensitive data access creates audit log entries
   - Verify log entries contain correct user and field information

3. **Data Protection**:
   - Confirm CPF/RG data is masked for unauthorized users
   - Test that address information is protected
   - Verify medical data access restrictions

## 📞 Security Contact

If you discover a security vulnerability, please report it immediately through the appropriate channels and do not disclose it publicly until it has been addressed.