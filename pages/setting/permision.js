import { useState, useEffect } from 'react';
import { ROLES, PERMISSIONS, ROUTE_ACCESS, ALL_ROUTES, updateRBACFromRole, syncRBAC, detectRoutes, getAllRoles } from '@/lib/rbac';
import SettingNav from '@/components/SettingNav';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

export default function Permission() {
    const [roles, setRoles] = useState([]);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [selectedRole, setSelectedRole] = useState(null);
    const [allRoutes, setAllRoutes] = useState([]);
    const [userRoles, setUserRoles] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('routes');
    const [isCreatingRole, setIsCreatingRole] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [tempRoleConfig, setTempRoleConfig] = useState({
        name: '',
        permissions: {
            create: false,
            read: true,
            update: false,
            delete: false
        },
        routes: [],
        description: '',
        isSystemRole: false
    });
    const [message, setMessage] = useState({ text: '', type: '' });
    const router = useRouter();

    // Fetch all roles from the database
    useEffect(() => {
        fetchRoles();
    }, []);

    // Get all routes from ROUTE_ACCESS for the UI
    useEffect(() => {
        setAllRoutes(Object.keys(ROUTE_ACCESS));
    }, []);

    // Initialize by syncing with database
    useEffect(() => {
        syncWithDatabase();
    }, []);

    const fetchRoles = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/roles');

            if (!response.ok) {
                throw new Error('Failed to fetch roles');
            }

            const data = await response.json();

            if (data.success && data.data) {
                setRoles(data.data);

                // Select first role by default if available
                if (data.data.length > 0 && !selectedRoleId) {
                    setSelectedRoleId(data.data[0]._id);
                    setSelectedRole(data.data[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
            setMessage({
                text: 'Failed to load roles: ' + error.message,
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Update selected role when ID changes
    useEffect(() => {
        if (selectedRoleId && roles.length > 0) {
            const role = roles.find(r => r._id === selectedRoleId);
            if (role) {
                setSelectedRole(role);
                setTempRoleConfig({
                    ...role
                });
            }
        }
    }, [selectedRoleId, roles]);

    const handleRoleChange = (e) => {
        setSelectedRoleId(e.target.value);
        setIsEditing(false);
        setMessage({ text: '', type: '' });
    };

    const handlePermissionChange = (permission) => {
        if (!isEditing) return;

        setTempRoleConfig(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [permission]: !prev.permissions[permission]
            }
        }));
    };

    const handleRouteChange = (route) => {
        if (!isEditing) return;

        setTempRoleConfig(prev => {
            const currentRoutes = prev.routes || [];

            if (currentRoutes.includes(route)) {
                return {
                    ...prev,
                    routes: currentRoutes.filter(r => r !== route)
                };
            } else {
                return {
                    ...prev,
                    routes: [...currentRoutes, route]
                };
            }
        });
    };

    const startEditing = () => {
        setIsEditing(true);
        setTempRoleConfig({ ...selectedRole });
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setTempRoleConfig(selectedRole ? { ...selectedRole } : {});
        setMessage({ text: '', type: '' });
    };

    // Create a new role with default permissions like the demo role
    const createNewRole = async () => {
        if (!newRoleName.trim()) {
            setMessage({
                text: 'Please enter a role name',
                type: 'error'
            });
            return;
        }

        try {
            // Use the dedicated API endpoint for creating roles with default permissions
            const response = await fetch('/api/roles/create-default', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newRoleName.trim()
                }),
            });

            if (response.status === 403) {
                toast.error('You do not have permission to create a role.');
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create role');
            }

            // Update roles list
            setRoles(prevRoles => [...prevRoles, data.data]);
            
            // Select the new role
            setSelectedRoleId(data.data._id);
            setSelectedRole(data.data);

            // After successful creation, explicitly trigger regeneration
            await fetch('/api/roles/regenerate-user-model', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            // Also explicitly sync RBAC
            await syncRBAC();

            setMessage({
                text: `Role "${data.data.name}" created successfully!`,
                type: 'success'
            });

            // Reset new role UI state
            setIsCreatingRole(false);
            setNewRoleName('');

            // Add a forced reload after a delay to ensure changes take effect
            setTimeout(() => {
                window.location.reload();
            }, 500);

            // Clear message after 3 seconds
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 3000);
        } catch (error) {
            console.error('Error creating role:', error);
            setMessage({
                text: error.message || 'An error occurred while creating role',
                type: 'error'
            });
        }
    };

    const syncWithDatabase = async () => {
        try {
            setIsSyncing(true);
            const success = await syncRBAC();

            if (success) {
                // Reset allRoutes to include any new routes
                setAllRoutes(Object.keys(ROUTE_ACCESS));

                setMessage({
                    text: 'RBAC configuration successfully synchronized with database!',
                    type: 'success'
                });
            } else {
                throw new Error('Synchronization failed');
            }
        } catch (error) {
            console.error('Error syncing RBAC:', error);
            setMessage({
                text: 'Failed to synchronize RBAC configuration: ' + error.message,
                type: 'error'
            });
        } finally {
            setIsSyncing(false);

            // Clear message after 3 seconds
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 3000);
        }
    };

    const saveChanges = async () => {
        try {
            if (selectedRoleId) {
                // Ensure proper data format for update
                const roleData = {
                    name: tempRoleConfig.name.trim().toLowerCase(),
                    permissions: {
                        create: tempRoleConfig.permissions?.create || false,
                        read: tempRoleConfig.permissions?.read || true,
                        update: tempRoleConfig.permissions?.update || false,
                        delete: tempRoleConfig.permissions?.delete || false
                    },
                    routes: Array.isArray(tempRoleConfig.routes) ? tempRoleConfig.routes : [],
                    description: tempRoleConfig.description || `${tempRoleConfig.name} role`,
                    isSystemRole: tempRoleConfig.isSystemRole // Preserve system role status
                };


                // Update existing role
                const response = await fetch(`/api/roles/${selectedRoleId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(roleData),
                });

                if (response.status === 403) {
                    toast.error('You do not have permission to update this role.');
                    return;
                }
    
                const data = await response.json();

                if (!response.ok) {
                    console.error('Role update failed:', data);
                    throw new Error(data.message || 'Failed to update role');
                }

                // Update the role in the list
                setRoles(prevRoles =>
                    prevRoles.map(role =>
                        role._id === selectedRoleId ? data.data : role
                    )
                );
                setSelectedRole(data.data);

                // Update RBAC configuration
                updateRBACFromRole(data.data);

                // Trigger regeneration of the User model if the role name changed
                const nameChanged = selectedRole.name !== data.data.name;
                if (nameChanged) {
                    await regenerateUserModel();
                    
                    // Also explicitly trigger the regeneration endpoint
                    await fetch('/api/roles/regenerate-user-model', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                }

                // After successful update, sync RBAC to ensure everything is updated
                await syncRBAC();

                setMessage({
                    text: `Role "${data.data.name}" updated and applied successfully!`,
                    type: 'success'
                });
                
                // Add a forced reload after a delay for role name changes
                if (nameChanged) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }
            }

            setIsEditing(false);

            // Clear message after 3 seconds
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 3000);
        } catch (error) {
            console.error('Error saving role:', error);
            setMessage({
                text: error.message || 'An error occurred while saving',
                type: 'error'
            });
        }
    };

    // Function to trigger regeneration of the User model code
    const regenerateUserModel = async () => {
        try {
            console.log('Regenerating User model with updated role enum values');

            // Find the User model in ModelSchema
            const response = await fetch('/api/models?model=user');
            if (!response.ok) {
                console.error('Failed to fetch User model schema:', await response.text());
                return false;
            }

            const userModel = await response.json();
            if (!userModel || !userModel._id) {
                console.error('User model not found or invalid response:', userModel);
                return false;
            }

            // Find the userRole field
            const userRoleField = userModel.fields.find(field => field.name === 'userRole');
            if (!userRoleField) {
                console.error('userRole field not found in User model');
                return false;
            }

            // Use the current roles from state instead of making another API call
            // This ensures any new roles are immediately available
            const roleNames = roles.map(role => role.name.toLowerCase());
            console.log('Updating User model userRole enum with values:', roleNames);

            // Update the userRole field's enum values
            userRoleField.enumValues = roleNames;

            // Make a copy of the fields to send back
            const updatedFields = [...userModel.fields];

            console.log('Regenerating User model with updated fields');

            // First, update the model schema
            const updateResponse = await fetch(`/api/models?id=${userModel._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    modelName: userModel.name,
                    fields: updatedFields
                }),
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                console.error('Failed to update User model schema:', errorText);
                return false;
            }

            // Second, trigger a dedicated endpoint for User model regeneration
            const regenerateUserResponse = await fetch(`/api/roles/regenerate-user-model`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!regenerateUserResponse.ok) {
                const errorText = await regenerateUserResponse.text();
                console.warn('Failed to trigger User model regeneration:', errorText);
                // Continue anyway - schema is updated even if code generation fails
            }

            // Store the current roles in localStorage for potential use in other parts of the app
            try {
                localStorage.setItem('availableRoles', JSON.stringify(roleNames));
            } catch (e) {
                console.warn('Could not store roles in localStorage:', e);
            }

            // Add a small delay before reloading the page to ensure all updates are processed
            setTimeout(() => {
                // Force a page reload to ensure all changes take effect
                window.location.reload();
            }, 1000);

            console.log('User model successfully regenerated with updated role enum values');
            return true;
        } catch (error) {
            console.error('Error regenerating User model:', error);
            return false;
        }
    };

    const deleteRole = async () => {
        if (!selectedRoleId) return;

        // Confirm deletion
        if (!confirm(`Are you sure you want to delete the role "${selectedRole.name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/roles/${selectedRoleId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete role');
            }

            // Remove the role from the list
            setRoles(prevRoles => prevRoles.filter(role => role._id !== selectedRoleId));

            // Select the first role if available
            if (roles.length > 1) {
                const newRoleId = roles.find(role => role._id !== selectedRoleId)?._id;
                setSelectedRoleId(newRoleId);
            } else {
                setSelectedRole(null);
                setSelectedRoleId('');
            }

            // Sync RBAC with database to update memory
            await syncRBAC();

            // Regenerate User model after role deletion
            await regenerateUserModel();
            
            // Also explicitly trigger the regeneration endpoint
            await fetch('/api/roles/regenerate-user-model', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            setMessage({
                text: `Role deleted successfully!`,
                type: 'success'
            });
            
            // Add a forced reload after a delay
            setTimeout(() => {
                window.location.reload();
            }, 500);
            
            // Clear message after 3 seconds (in case reload is delayed)
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 3000);
        } catch (error) {
            console.error('Error deleting role:', error);
            setMessage({
                text: error.message || 'An error occurred while deleting',
                type: 'error'
            });
        }
    };

    const hasRoute = (route) => {
        if (!tempRoleConfig.routes) return false;
        return tempRoleConfig.routes.includes(route) || tempRoleConfig.routes.includes('*');
    };

    // Scan for new routes in the application
    const scanForRoutes = async () => {
        try {
            setIsScanning(true);
            const detectedRoutes = await detectRoutes();
            setAllRoutes(detectedRoutes);

            setMessage({
                text: `Found ${detectedRoutes.length} routes in the application!`,
                type: 'success'
            });
        } catch (error) {
            console.error('Error scanning routes:', error);
            setMessage({
                text: 'Failed to scan for routes: ' + error.message,
                type: 'error'
            });
        } finally {
            setIsScanning(false);
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        }
    };

    // Filter routes based on search term
    const filteredRoutes = allRoutes.filter(route =>
        route.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Add or remove all filtered routes
    const toggleAllRoutes = (add) => {
        if (!isEditing) return;

        setTempRoleConfig(prev => {
            const currentRoutes = prev.routes || [];

            if (add) {
                // Add all filtered routes that aren't already selected
                const newRoutes = [...currentRoutes];
                filteredRoutes.forEach(route => {
                    if (!newRoutes.includes(route)) {
                        newRoutes.push(route);
                    }
                });
                return { ...prev, routes: newRoutes };
            } else {
                // Remove all filtered routes
                return {
                    ...prev,
                    routes: currentRoutes.filter(route => !filteredRoutes.includes(route))
                };
            }
        });
    };

    // Toggle wildcard access (*) for all routes
    const toggleWildcardAccess = () => {
        if (!isEditing) return;

        setTempRoleConfig(prev => {
            const hasWildcard = prev.routes.includes('*');

            if (hasWildcard) {
                // Remove wildcard
                return {
                    ...prev,
                    routes: prev.routes.filter(r => r !== '*')
                };
            } else {
                // Add wildcard (and remove other routes to avoid confusion)
                return {
                    ...prev,
                    routes: ['*']
                };
            }
        });
    };

    if (isLoading) {
        return (
            <div className="roles_page_permission-page">
                <SettingNav currentPage="Permissions" />
                <div className="roles_page_permission-content roles_page_loading">
                    <div className="roles_page_loading-spinner">Loading...</div>
                </div>
                <style jsx>{`
                    .roles_page_permission-page {
                        display: flex;
                        min-height: 100vh;
                        background-color: #f5f7fa;
                    }
                    .roles_page_permission-content {
                        flex-grow: 1;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        padding: 2rem;
                    }
                    .roles_page_loading-spinner {
                        font-size: 1.2rem;
                        color: #4a6cf7;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="roles_page_permission-page">
            <SettingNav currentPage="Permissions" />

            <div className="roles_page_permission-content">
                {message.text && (
                    <div className={`roles_page_message ${message.type === 'success' ? 'roles_page_success' : 'roles_page_error'}`}>
                        {message.text}
                    </div>
                )}

                <div className="roles_page_page-header">
                    <h1>Role-Based Access Control</h1>
                    <div className="roles_page_action-buttons">
                        <button
                            className="roles_page_button roles_page_scan-button"
                            onClick={scanForRoutes}
                            disabled={isScanning || isEditing}
                        >
                            {isScanning ? 'Scanning...' : 'Scan Routes'}
                        </button>
                        <button
                            className="roles_page_button roles_page_sync-button"
                            onClick={syncWithDatabase}
                            disabled={isSyncing || isEditing}
                        >
                            {isSyncing ? 'Syncing...' : 'Sync RBAC'}
                        </button>
                    </div>
                </div>

                <div className="roles_page_role-selector">
                    <h3>Manage Roles</h3>
                    <div className="roles_page_role-selector-controls">
                        <select
                            value={selectedRoleId}
                            onChange={handleRoleChange}
                            disabled={isEditing || !roles.length || isCreatingRole}
                            className="roles_page_full-width"
                        >
                            {roles.length === 0 ? (
                                <option value="">No roles available</option>
                            ) : (
                                roles.map(role => (
                                    <option key={role._id} value={role._id}>
                                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                        {role.isSystemRole ? ' (System)' : ''}
                                    </option>
                                ))
                            )}
                        </select>
                        <button 
                            className="roles_page_button roles_page_new-role-button" 
                            onClick={() => setIsCreatingRole(true)}
                            disabled={isEditing || isCreatingRole}
                        >
                            + New Role
                        </button>
                    </div>
                    {isCreatingRole && (
                        <div className="roles_page_new-role-form">
                            <div className="roles_page_form-group">
                                <label htmlFor="new-role-name">Role Name:</label>
                                <input
                                    id="new-role-name"
                                    type="text"
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    placeholder="Enter role name"
                                />
                            </div>
                            <div className="roles_page_new-role-actions">
                                <button 
                                    className="roles_page_button roles_page_save-button" 
                                    onClick={createNewRole}
                                >
                                    Create Role
                                </button>
                                <button 
                                    className="roles_page_button roles_page_cancel-button" 
                                    onClick={() => {
                                        setIsCreatingRole(false);
                                        setNewRoleName('');
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                    {selectedRole && !isCreatingRole && (
                        <div className="roles_page_role-description">
                            {selectedRole.description}
                        </div>
                    )}
                </div>

                <div className="roles_page_permission-controls">
                    {!isEditing && !isCreatingRole ? (
                        <>
                            <button
                                className="roles_page_button roles_page_edit-button"
                                onClick={startEditing}
                                disabled={!selectedRole}
                                title={!selectedRole ? "Select a role to edit" : ""}
                            >
                                Edit Role
                            </button>
                            {selectedRole && !selectedRole.isSystemRole && (
                                <button
                                    className="roles_page_button roles_page_delete-button"
                                    onClick={deleteRole}
                                >
                                    Delete Role
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="roles_page_edit-controls">
                            <button className="roles_page_button roles_page_save-button" onClick={saveChanges}>
                                Save Changes
                            </button>
                            <button className="roles_page_button roles_page_cancel-button" onClick={cancelEditing}>
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {(selectedRole || isEditing) && (
                    <div className="roles_page_permissions-container">
                        <div className="roles_page_tabs">
                            <button
                                className={`roles_page_button roles_page_tab ${activeTab === 'permissions' ? 'roles_page_active' : ''}`}
                                onClick={() => setActiveTab('permissions')}
                            >
                                Permissions
                            </button>
                            <button
                                className={`roles_page_button roles_page_tab ${activeTab === 'routes' ? 'roles_page_active' : ''}`}
                                onClick={() => setActiveTab('routes')}
                            >
                                Routes
                            </button>
                        </div>

                        {activeTab === 'permissions' && (
                            <div className="roles_page_permission-section">
                                <h3>Action Permissions</h3>
                                <div className="roles_page_permission-items">
                                    {Object.values(PERMISSIONS).map(permission => (
                                        <div
                                            key={permission}
                                            className={`roles_page_permission-item ${tempRoleConfig.permissions?.[permission] ? 'roles_page_active' : 'roles_page_inactive'} ${(isEditing) ? 'roles_page_editable' : ''}`}
                                            onClick={() => handlePermissionChange(permission)}
                                        >
                                            <div className="roles_page_permission-icon">
                                                {tempRoleConfig.permissions?.[permission] ? '✓' : '✕'}
                                            </div>
                                            <div className="roles_page_permission-name">
                                                {permission.charAt(0).toUpperCase() + permission.slice(1)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'routes' && (
                            <div className="roles_page_route-section">
                                <div className="roles_page_route-header">
                                    <h3>Route Access</h3>
                                    <div className="roles_page_route-search">
                                        <input
                                            type="text"
                                            placeholder="Search routes..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {(isEditing) && (
                                    <div className="roles_page_route-actions">
                                        <button
                                            className={`roles_page_button roles_page_wildcard-button ${tempRoleConfig.routes.includes('*') ? 'roles_page_active' : ''}`}
                                            onClick={toggleWildcardAccess}
                                        >
                                            {tempRoleConfig.routes.includes('*') ? 'Remove Full Access' : 'Grant Full Access'}
                                        </button>
                                        <button className="roles_page_button" onClick={() => toggleAllRoutes(true)}>
                                            Select All Filtered
                                        </button>
                                        <button className="roles_page_button" onClick={() => toggleAllRoutes(false)}>
                                            Deselect All Filtered
                                        </button>
                                    </div>
                                )}

                                <div className="roles_page_route-items">
                                    {filteredRoutes.length === 0 ? (
                                        <div className="roles_page_no-routes">
                                            No routes found matching your search
                                        </div>
                                    ) : (
                                        filteredRoutes.map(route => (
                                            <div
                                                key={route}
                                                className={`roles_page_route-item ${hasRoute(route) ? 'roles_page_active' : 'roles_page_inactive'} ${(isEditing) ? 'roles_page_editable' : ''}`}
                                                onClick={() => handleRouteChange(route)}
                                            >
                                                <div className="roles_page_route-icon">
                                                    {hasRoute(route) ? '✓' : '✕'}
                                                </div>
                                                <div className="roles_page_route-name" title={route}>
                                                    {route}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                .roles_page_permission-page {
                    display: flex;
                    min-height: 100vh;
                    background-color: #f5f7fa;
                }

                .roles_page_permission-content {
                    flex-grow: 1;
                    padding: 2rem;
                }

                .roles_page_page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .roles_page_page-header h1 {
                    font-size: 1.8rem;
                    margin: 0;
                    color: #333;
                }

                .roles_page_action-buttons {
                    display: flex;
                    gap: 0.5rem;
                }
                
                .roles_page_button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .roles_page_scan-button, .roles_page_sync-button {
                    background-color: #6c5ce7;
                    color: white;
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                }
                
                .roles_page_scan-button:hover:not(:disabled),
                .roles_page_sync-button:hover:not(:disabled) {
                    opacity: 0.9;
                    transform: translateY(-2px);
                }
                
                .roles_page_scan-button:disabled,
                .roles_page_sync-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .roles_page_scan-button {
                    background-color: #00b894;
                }

                .roles_page_role-selector {
                    margin-bottom: 1.5rem;
                    background: white;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }

                .roles_page_role-selector h3 {
                    margin-top: 0;
                    margin-bottom: 1rem;
                    color: #333;
                    font-size: 1.2rem;
                }

                .roles_page_role-selector-controls {
                    display: flex;
                    width: 100%;
                    gap: 10px;
                }

                .roles_page_role-selector select {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                    background-color: white;
                }

                .roles_page_new-role-button {
                    background-color: #4a6cf7;
                    color: white;
                    white-space: nowrap;
                }

                .roles_page_new-role-form {
                    margin-top: 15px;
                    padding: 15px;
                    background-color: #f9f9f9;
                    border-radius: 6px;
                    border: 1px solid #eee;
                }

                .roles_page_new-role-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                    justify-content: flex-end;
                }

                .roles_page_role-description {
                    margin-top: 1rem;
                    font-size: 0.9rem;
                    color: #666;
                    font-style: italic;
                }

                .roles_page_form-group {
                    margin-bottom: 1rem;
                }

                .roles_page_form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                    color: #555;
                }

                .roles_page_form-group input, .roles_page_form-group textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                }

                .roles_page_form-group textarea {
                    min-height: 100px;
                    resize: vertical;
                }

                .roles_page_permission-controls {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .roles_page_edit-controls {
                    display: flex;
                    gap: 1rem;
                }

                .roles_page_button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .roles_page_button:not(:disabled):hover {
                    opacity: 0.9;
                    transform: translateY(-2px);
                }

                .roles_page_edit-button {
                    background-color: #4a6cf7;
                    color: white;
                }

                .roles_page_full-width {
                    width: 100%;
                }

                .roles_page_save-button {
                    background-color: #2ecc71;
                    color: white;
                }

                .roles_page_cancel-button {
                    background-color: #e74c3c;
                    color: white;
                }

                .roles_page_delete-button {
                    background-color: #e74c3c;
                    color: white;
                }

                .roles_page_permissions-container {
                    background: white;
                    border-radius: 8px;
                    padding: 0;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                }

                .roles_page_tabs {
                    display: flex;
                    border-bottom: 1px solid #eee;
                }

                .roles_page_tab {
                    flex: 1;
                    padding: 1rem;
                    background: none;
                    border: none;
                    border-bottom: 3px solid transparent;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .roles_page_tab.roles_page_active {
                    border-bottom-color: #4a6cf7;
                    font-weight: 600;
                }

                .roles_page_tab:hover:not(.roles_page_active) {
                    background-color: #f5f7fa;
                }

                .roles_page_permission-section, .roles_page_route-section {
                    padding: 1.5rem;
                }

                .roles_page_route-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .roles_page_route-header h3 {
                    margin: 0;
                    color: #333;
                    font-size: 1.2rem;
                }

                .roles_page_route-search input {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    width: 250px;
                }

                .roles_page_route-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                    flex-wrap: wrap;
                }

                .roles_page_route-actions button.roles_page_button {
                    padding: 8px 12px;
                    font-size: 0.9rem;
                    background-color: #f1f2f6;
                    color: #333;
                }

                .roles_page_wildcard-button {
                    background-color: #ff9f43 !important;
                    color: white !important;
                }

                .roles_page_wildcard-button.roles_page_active {
                    background-color: #ff6b6b !important;
                }

                .roles_page_permission-items, .roles_page_route-items {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    max-height: 400px;
                    overflow-y: auto;
                }

                .roles_page_permission-item, .roles_page_route-item {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }

                .roles_page_editable:hover {
                    background-color: #f0f0f0;
                    cursor: pointer;
                }

                .roles_page_permission-icon, .roles_page_route-icon {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    margin-right: 12px;
                    font-size: 0.8rem;
                }

                .roles_page_active .roles_page_permission-icon, .roles_page_active .roles_page_route-icon {
                    background-color: #2ecc71;
                    color: white;
                }

                .roles_page_inactive .roles_page_permission-icon, .roles_page_inactive .roles_page_route-icon {
                    background-color: #e74c3c;
                    color: white;
                }

                .roles_page_permission-name, .roles_page_route-name {
                    font-size: 0.95rem;
                }

                .roles_page_route-name {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .roles_page_no-routes {
                    padding: 2rem;
                    text-align: center;
                    color: #666;
                    font-style: italic;
                }

                .roles_page_message {
                    padding: 12px 16px;
                    border-radius: 4px;
                    margin-bottom: 1.5rem;
                    animation: fadeIn 0.3s ease;
                }

                .roles_page_success {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }

                .roles_page_error {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 768px) {
                    .roles_page_page-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }

                    .roles_page_action-buttons {
                        width: 100%;
                    }

                    .roles_page_permission-content {
                        padding: 1rem;
                    }
                    
                    .roles_page_role-selector-controls {
                        flex-direction: column;
                    }

                    .roles_page_route-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }

                    .roles_page_route-search input {
                        width: 100%;
                    }

                    .roles_page_route-actions {
                        flex-direction: column;
                    }

                    .roles_page_route-actions button.roles_page_button {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
