# API Reference

Welcome to the Expense Splitter API documentation. This document provides detailed information about the available API endpoints, request/response formats, and authentication methods.

## 🔐 Authentication

All API requests require authentication using a JWT token. The token should be included in the `Authorization` header:

```http
Authorization: Bearer your_jwt_token_here
```

### Obtaining a Token

1. **Login**
   ```http
   POST /api/auth/login
   Content-Type: application/json
   
   {
     "email": "user@example.com",
     "password": "yourpassword"
   }
   ```

   Response:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": 1,
       "name": "John Doe",
       "email": "user@example.com"
     }
   }
   ```

2. **Using the Token**
   Include the token in subsequent requests:
   ```http
   GET /api/expenses
   Authorization: Bearer your_jwt_token_here
   ```

## 📚 API Endpoints

### Users

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `GET /api/users` - Search users (admin only)
- `GET /api/users/:id` - Get user by ID

### Expenses

- `GET /api/expenses` - List all expenses
- `POST /api/expenses` - Create a new expense
- `GET /api/expenses/:id` - Get expense details
- `PUT /api/expenses/:id` - Update an expense
- `DELETE /api/expenses/:id` - Delete an expense

### Groups

- `GET /api/groups` - List all groups
- `POST /api/groups` - Create a new group
- `GET /api/groups/:id` - Get group details
- `PUT /api/groups/:id` - Update a group
- `DELETE /api/groups/:id` - Delete a group
- `POST /api/groups/:id/members` - Add members to group
- `DELETE /api/groups/:groupId/members/:userId` - Remove member from group

### Settlements

- `GET /api/settlements` - List all settlements
- `POST /api/settlements` - Record a settlement
- `GET /api/settlements/:id` - Get settlement details
- `DELETE /api/settlements/:id` - Delete a settlement

### Analytics

- `GET /api/analytics/summary` - Get summary statistics
- `GET /api/analytics/expenses` - Get expense analytics
- `GET /api/analytics/balances` - Get balance analytics

## 📦 Request/Response Format

### Request Headers

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer your_jwt_token_here
```

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    // Pagination info if applicable
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "error_code",
    "message": "Human-readable error message",
    "details": {
      // Additional error details
    }
  }
}
```

## 🔄 Pagination

Endpoints that return lists support pagination using query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

Example:
```
GET /api/expenses?page=2&limit=10
```

## 🔍 Filtering and Sorting

Many list endpoints support filtering and sorting using query parameters:

### Filtering

```
GET /api/expenses?amount[gt]=100&category=food
```

### Sorting

```
GET /api/expenses?sortBy=date&sortOrder=desc
```

## ⚡ Rate Limiting

- 1000 requests per hour per IP address
- 100 requests per minute per authenticated user

## 🔒 Webhooks

Expense Splitter can send webhook notifications for various events. See the [Webhooks Documentation](/docs/api/webhooks) for more details.

## 📡 API Versioning

The API is versioned. The current version is `v1`. Include the version in the URL:

```
/api/v1/expenses
```

## ❓ Getting Help

For API-related questions or issues, please [contact support](/support) or open an issue on our [GitHub repository](https://github.com/yourusername/expense-splitter/issues).
