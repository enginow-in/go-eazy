# Error Handling Implementation Guide

## Overview
GoEazy now has a comprehensive error handling system that provides:
- **Centralized error logging** with sensitive data sanitization
- **User-friendly error messages** with automatic categorization
- **Retry capabilities** for recoverable errors
- **React Error Boundary** to prevent app crashes
- **Standardized toast notifications** for consistent UX

---

## Architecture

### Core Services

#### 1. **Error Logger Service** (`src/services/errorLogger.js`)
Handles error extraction, categorization, and logging.

**Key Functions:**
- `extractErrorMessage(error)` - Extracts message from any error type
- `categorizeError(error)` - Categorizes errors (network, auth, payment, etc.)
- `logError(error, context)` - Logs to console (dev) or external service (prod)

**Error Categories:**
- `network` - Connection issues (retryable)
- `auth` - Authentication/session expired (not retryable)
- `payment` - Payment failures (retryable)
- `validation` - Form validation errors (not retryable)
- `permission` - RLS/access denied (not retryable)
- `rateLimit` - Too many requests (retryable)
- `server` - Server errors (retryable)

---

### 2. **API Error Handler** (`src/utils/apiErrorHandler.js`)
Handles API responses and displays user-friendly notifications.

**Key Functions:**
- `parseApiError(error)` - Parses fetch/Supabase errors
- `showApiError(error, options)` - Shows toast with optional retry button
- `withErrorHandler(fn, options)` - Wraps async functions with auto error handling
- `validateResponse(response)` - Validates HTTP response status
- `handleSupabaseError(error, options)` - Handles Supabase-specific errors

**Example Usage:**
```javascript
import { showApiError } from '@/utils/apiErrorHandler'

try {
  const response = await fetch(url)
  await validateResponse(response)
  const data = await response.json()
} catch (error) {
  await showApiError(error, {
    context: { action: 'fetch-properties', userId: user.id },
    onRetry: () => { /* retry logic */ }
  })
}
```

---

### 3. **Toast Configuration** (`src/utils/toastConfig.js`)
Centralized toast styling and helpers.

**Functions:**
- `showSuccess(message, options)` - Success notification (4s duration)
- `showError(message, options)` - Error notification (5s duration)
- `showInfo(message, options)` - Info notification
- `showWarning(message, options)` - Warning notification
- `showLoading(promise, messages)` - Promise toast
- `showCustom(message, buttonText, onButtonClick)` - Custom with button

**Example Usage:**
```javascript
import { showSuccess, showError } from '@/utils/toastConfig'

showSuccess('Property listed successfully!')
showError('Failed to list property')
```

---

### 4. **Error Boundary Component** (`src/components/error/ErrorBoundary.jsx`)
Catches React component errors and prevents app crash.

**Features:**
- Graceful error UI with call-to-action buttons
- Error details visible in dev mode only
- Automatic logging to error service
- Reset and "Go Home" buttons

---

### 5. **Error Display Components** (`src/components/error/ErrorDisplay.jsx`)

**Components:**
- `<FormError>` - Inline form error with icon
- `<FieldError>` - Field-level validation error
- `<SkeletonLoader>` - Loading skeleton placeholder
- `<RetryError>` - Error with retry button

**Example Usage:**
```javascript
import { FormError, FieldError, RetryError } from '@/components/error/ErrorDisplay'

// Inline error
<FormError message="Failed to load properties" />

// Field error
<FieldError error={errors.email} />

// Retry error
<RetryError 
  message="Failed to upload image. Please try again."
  onRetry={handleRetry}
  isLoading={uploading}
/>
```

---

## Implementation Guide

### Basic Pattern: Try-Catch with Error Handler

```javascript
import { showApiError } from '@/utils/apiErrorHandler'

const handleSubmit = async (data) => {
  try {
    setLoading(true)
    
    // Your API call
    const response = await fetch('/api/create', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    
    // Validate response
    if (!response.ok) {
      throw new Error(await response.text())
    }
    
    const result = await response.json()
    toast.success('Success!')
    
  } catch (error) {
    // Automatic error handling with user-friendly message
    await showApiError(error, {
      context: { action: 'create-item', data },
      onRetry: () => handleSubmit(data)
    })
  } finally {
    setLoading(false)
  }
}
```

---

### Pattern 2: With Supabase

```javascript
import { handleSupabaseError } from '@/utils/apiErrorHandler'

const fetchData = async () => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
    
    if (error) throw error
    return data
    
  } catch (error) {
    await handleSupabaseError(error, {
      context: { table: 'properties' },
      onRetry: fetchData
    })
  }
}
```

---

### Pattern 3: Form Validation with Display Components

```javascript
import { FormError, FieldError } from '@/components/error/ErrorDisplay'

export const PropertyForm = () => {
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Clear previous errors
    setErrors({})
    setApiError(null)
    
    // Validate
    if (!form.title) {
      setErrors(e => ({ ...e, title: 'Title is required' }))
      return
    }
    
    try {
      // Submit
      await submitProperty(form)
      toast.success('Property created!')
    } catch (error) {
      setApiError(error.message)
      await logError(error, { action: 'create-property' })
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {apiError && <FormError message={apiError} />}
      
      <div>
        <input 
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        />
        <FieldError error={errors.title} />
      </div>
      
      <button type="submit">Submit</button>
    </form>
  )
}
```

---

### Pattern 4: Payment Error with Retry

```javascript
import { showApiError } from '@/utils/apiErrorHandler'
import { RetryError } from '@/components/error/ErrorDisplay'

const handlePayment = async () => {
  try {
    // Payment logic
    const response = await fetch('/api/verify-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    })
    
    if (!response.ok) throw new Error('Payment verification failed')
    
  } catch (error) {
    setPaymentError(true)
    await showApiError(error, {
      context: { action: 'verify-payment' },
      onRetry: handlePayment
    })
  }
}

return (
  paymentError && (
    <RetryError
      message="Payment verification failed. Please retry."
      onRetry={handlePayment}
      isLoading={loading}
    />
  )
)
```

---

## Best Practices

### ✅ DO:

1. **Use error categories** - They provide better UX messaging
   ```javascript
   // Good: Uses categorization
   await showApiError(error, { context })
   ```

2. **Provide context** - Helps debugging
   ```javascript
   // Good: Context helps identify issue
   await showApiError(error, {
     context: { userId: user.id, action: 'create-property', formData }
   })
   ```

3. **Offer retry for recoverable errors** - Better UX
   ```javascript
   // Good: Retryable error with button
   await showApiError(error, { onRetry: handleSubmit })
   ```

4. **Use specific error components** - Clearer code
   ```javascript
   // Good: Specific component
   <FieldError error={errors.email} />
   ```

5. **Sanitize sensitive data** - Security first
   ```javascript
   // Error logger automatically sanitizes passwords, tokens, etc.
   logError(error, { credentials: userInput }) // ✓ Safe
   ```

---

### ❌ DON'T:

1. **Don't expose raw error messages**
   ```javascript
   // Bad
   toast.error(error.message)
   
   // Good
   await showApiError(error, { context })
   ```

2. **Don't swallow errors silently**
   ```javascript
   // Bad
   try { await api() } catch (e) { }
   
   // Good
   try { await api() } catch (error) {
     logError(error, { action })
   }
   ```

3. **Don't retry non-retryable errors**
   ```javascript
   // Bad: Auth errors shouldn't retry
   if (error.status === 401) {
     await showApiError(error, { onRetry: fn }) // Wrong!
   }
   
   // Good: System handles automatically
   await showApiError(error) // Checks if retryable
   ```

4. **Don't ignore context in logging**
   ```javascript
   // Bad: No context
   logError(error)
   
   // Good: Add context
   logError(error, { userId, action, timestamp })
   ```

---

## Migration Checklist

When updating existing code, follow this checklist:

- [ ] Replace generic `toast.error()` with `showApiError()`
- [ ] Add `context` parameter to `logError()` calls
- [ ] Use error display components instead of inline text
- [ ] Add retry buttons for network/payment errors
- [ ] Validate responses before parsing JSON
- [ ] Test error paths in dev mode (console shows detailed logs)

---

## Testing Error Handling

### In Development Mode

Error logger shows detailed logs in browser console:
```
🚨 Error: Network error — check your connection
Details: {
  timestamp: "2026-07-18T...",
  message: "...",
  category: "network",
  stack: "...",
  context: { userId, action },
  url: "...",
  userAgent: "..."
}
```

### Simulating Errors

```javascript
// Simulate network error
throw new TypeError('Network request failed')

// Simulate auth error
throw new Error('Session expired')

// Simulate payment error
throw new Error('Payment verification failed')

// Test retry logic
await showApiError(error, {
  onRetry: () => console.log('Retried!')
})
```

---

## Production Setup (Optional)

For production error tracking, integrate with a service:

```javascript
// In errorLogger.js, add production handler
if (!isDev) {
  // Sentry
  Sentry.captureException(error, { extra: errorInfo })
  
  // Or LogRocket
  LogRocket.captureException(error, { extra: errorInfo })
}
```

---

## Files Created

```
src/
├── services/
│   └── errorLogger.js           # Core error logging
├── utils/
│   ├── apiErrorHandler.js       # API error handling
│   └── toastConfig.js           # Toast notifications
└── components/
    └── error/
        ├── ErrorBoundary.jsx    # React error boundary
        └── ErrorDisplay.jsx     # Inline error components
```

---

## Summary

The error handling system is:
- **User-focused** - Clear, actionable messages
- **Developer-friendly** - Detailed logs in dev mode
- **Secure** - Sanitizes sensitive data
- **Recoverable** - Retry capability for transient errors
- **Consistent** - Centralized patterns across the app

Start using it in new code, and gradually migrate existing error handling!
