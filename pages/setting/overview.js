import Link from "next/link";
import ReactMarkdown from 'react-markdown';

export default function overview() {
    const markdownContent = `
# Content Management System (CMS) Backend Admin Panel

## Introduction
Welcome to the comprehensive CMS Backend Admin Panel. This guide provides an overview of the system's features and functionalities designed to help you manage your content effectively.

## Key Features

### 1. API Tokens Management
- Create, view, and manage API tokens with customizable permissions
- Set access levels: full_access, read_only, edit_only, delete_only, create_only
- Configure token expiration periods: unlimited, 7 days, 30 days, 90 days
- Monitor and revoke tokens as needed for security

### 2. Environment Variables Management
- Configure application settings through both database and .env file variables
- Securely store sensitive information like API keys and database credentials
- Toggle visibility of sensitive values with show/hide functionality
- Manage different configurations for development, staging, and production environments

### 3. Role-Based Access Control (RBAC)
- Pre-configured user roles: Superadmin, Content Manager, and Demo
- Granular permissions for creating, reading, updating, and deleting content
- Route-specific access restrictions based on user roles
- Demo accounts with read-only access for safe system exploration

### 4. Content Management
- Create, edit, and publish content with an intuitive interface
- Organize content using customizable models and schemas
- Schedule content publication and manage content lifecycle
- Integrated media management for images and files

### 5. Model Builder
- Design and customize data models with a visual interface
- Define field types, validations, and relationships between models
- Generate APIs automatically based on your model definitions
- Control access permissions at the model level

## Getting Started

### Accessing the Admin Panel
1. Log in with your credentials at the login page
2. Navigate through the sidebar menu to access different sections
3. Use the role-appropriate features based on your assigned permissions

### Best Practices
- Always use strong passwords and enable two-factor authentication when available
- Regularly rotate API tokens and review access permissions
- Keep environment variables up to date across all environments
- Use descriptive names for models, fields, and content items

## Security Guidelines
- Never share your admin credentials or API tokens
- Use HTTPS for all connections to the admin panel
- Review the audit logs regularly for suspicious activities
- Implement the principle of least privilege when assigning user roles

## Support and Documentation
For additional help, refer to the API documentation available in the API Tokens section or contact the system administrator.
`;

    return <>
        <div className="overview_page">
            <div className="existing_model_list">
                <h2>Overview</h2>
                <div className="ex_model_list_ul">
                    <ul>
                        <li><Link href='/setting/overview'>Overview</Link></li>
                        <li><Link href='/setting/apitokens'>API Tokens</Link></li>
                        <li><Link href='/setting/envdata'>Env variables</Link></li>
                        <li><Link href='/setting/permision'>Permision</Link></li>
                        <li><Link href='/setting/profile'>Profile</Link></li>
                    </ul>
                </div>
            </div>
            <div className="overview_about_this_app">
                <div className="markdown_overview">
                    <ReactMarkdown>{markdownContent}</ReactMarkdown>
                </div>
            </div>
        </div>
    </>
}