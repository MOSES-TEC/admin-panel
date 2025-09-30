import { useState, useEffect } from "react";
import Link from "next/link";
import { FaCheck, FaPlus, FaBook } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { RiAiGenerateText, RiDeleteBinLine, RiEdit2Line } from "react-icons/ri";
import axios from "axios";
import { toast } from "react-toastify";
import { useSession } from 'next-auth/react';
import { hasRouteAccess } from "@/lib/rbac";
import Unauthorized from "@/components/Unauthorized";
import SettingNav from "@/components/SettingNav";


export default function APITokens() {
    const [tokens, setTokens] = useState([]);
    const [editTokenId, setEditTokenId] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [activeTab, setActiveTab] = useState('tokens'); // 'tokens' or 'guide'
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        tokenType: "",
        duration: ""
    });


    const { data: session } = useSession();


    useEffect(() => {
        fetchTokens();
    }, []);

    const fetchTokens = async () => {
        try {
            const response = await axios.get('/api/tokens');
            setTokens(response.data);
        } catch (error) {
            toast.error('Failed to fetch API tokens');
        }
    };

    const handleCreateToken = async (e) => {
        e.preventDefault();
        try {
            try {
                const response = await axios.post('/api/tokens', formData);
                setTokens([response.data, ...tokens]);
                setShowCreateForm(false);
                setFormData({
                    name: "",
                    description: "",
                    tokenType: "",
                    duration: ""
                });
                toast.success('API token created successfully');
            } catch (error) {
                if (error.response.status === 403) {
                    toast.error("Permission denied to Demo User.");
                }
            }
        } catch (error) {
            toast.error('Failed to create API token');

        }
    };
    const handleSubmitToken = async (e) => {
        e.preventDefault();

        try {
            if (editTokenId) {
                // Update mode
                try {
                    const response = await axios.put(`/api/tokens/${editTokenId}`, formData);
                    setTokens(tokens.map(t => t._id === editTokenId ? response.data : t));
                    toast.success('API token updated successfully');
                } catch (error) {
                    if (error.response.status === 403) {
                        toast.error("Permission denied to Demo User.");
                    }
                }
            } else {
                // Create mode
                try {
                    const response = await axios.post('/api/tokens', formData);
                    setTokens([response.data, ...tokens]);
                    toast.success('API token created successfully');
                } catch (error) {
                    if (error.response.status === 403) {
                        toast.error("Permission denied to Demo User.");
                    }
                }
            }
            // Reset form
            setShowCreateForm(false);
            setFormData({
                name: "",
                description: "",
                tokenType: "",
                duration: ""
            });
            setEditTokenId(null);
        } catch (error) {
            toast.error(editTokenId ? 'Failed to update API token' : 'Failed to create API token');
        }
    };

    const handleDeleteToken = async (tokenId) => {
        if (window.confirm('Are you sure you want to delete this token?')) {
            try {
                try {
                    await axios.delete(`/api/tokens/${tokenId}`);
                    setTokens(tokens.filter(token => token._id !== tokenId));
                    toast.success('API token deleted successfully');
                } catch (error) {
                    if (error.response.status === 403) {
                        toast.error("Permission denied to Demo User.");
                    }
                }
            } catch (error) {
                toast.error('Failed to delete API token');
            }
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString();
    };

    const renderApiGuide = () => {
        return (
            <div className="api_guide_section">
                <h2>API Documentation</h2>
                <div className="api_endpoints">
                    <div className="endpoint_card">
                        <h3>API Endpoints</h3>

                        {/* GET Endpoint */}
                        <div className="endpoint_method">
                            <span className="method get">GET</span>
                            <code>/api/public/blog</code>
                            <p>Get items with pagination, search, and filtering</p>
                            <div className="params">
                                <h4>Query Parameters:</h4>
                                <ul>
                                    <li><code>id</code> - Get single item by ID</li>
                                    <li><code>page</code> - Page number (default: 1)</li>
                                    <li><code>limit</code> - Items per page (default: 10)</li>
                                    <li><code>user</code> - Filter by user ID</li>
                                    <li><code>search</code> - Search across all text fields</li>
                                    <li><code>sort</code> - Sort field (default: '-createdAt')</li>
                                    <li><code>fields</code> - Select specific fields (comma-separated)</li>
                                    <li><code>filter</code> - JSON string for custom filtering</li>
                                    <li><code>populate</code> - Populate reference fields (comma-separated)</li>
                                </ul>
                            </div>
                            <div className="example">
                                <h4>Example Requests:</h4>
                                <div className="example_group">
                                    <h5>Basic Pagination and Sorting:</h5>
                                    <pre>
                                        {`GET /api/public/blog?page=1&limit=10&sort=-createdAt`}
                                    </pre>
                                </div>
                                <div className="example_group">
                                    <h5>Field Selection and Population:</h5>
                                    <pre>
                                        {`GET /api/public/blog?fields=title,content,author&populate=author,category`}
                                    </pre>
                                </div>
                                <div className="example_group">
                                    <h5>Search and Filtering:</h5>
                                    <pre>
                                        {`GET /api/public/blog?search=javascript&filter={"status": true,"category":"Tech"}`}
                                    </pre>
                                </div>
                                <div className="example_group">
                                    <h5>Complex Query Example:</h5>
                                    <pre>
                                        {`GET /api/public/blog?page=1&limit=20&sort=-createdAt&fields=title,content,author&populate=author,category&search=react&filter={"status": true,"category":"tech","tags":{"$in":["frontend","javascript"]}}`}
                                    </pre>
                                </div>
                                <h4>Response Format:</h4>
                                <pre>
                                    {`{
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "items": [
        {
            "title": "Example Post",
            "content": "Post content...",
            "author": {
                "name": "John Doe",
                "email": "john@example.com"
            },
            "category": {
                "name": "Technology",
                "slug": "tech"
            }
        }
    ],
    "hasNextPage": true,
    "hasPrevPage": false
}`}
                                </pre>
                                <div className="filter_examples">
                                    <h4>Filter Examples:</h4>
                                    <ul>
                                        <li><code>filter={"{'status':'published'}"}</code> - Filter by exact match</li>
                                        <li><code>filter={"{'views':{'$gt':1000}}"}</code> - Views greater than 1000</li>
                                        <li><code>filter={"{'tags':{'$in':['react','node']}}"}</code> - Posts with either tag</li>
                                        <li><code>filter={"{'createdAt':{'$gte':'2024-01-01'}}"}</code> - Posts from 2024 onwards</li>
                                    </ul>
                                </div>
                                <div className="sort_examples">
                                    <h4>Sort Examples:</h4>
                                    <ul>
                                        <li><code>sort=createdAt</code> - Ascending order</li>
                                        <li><code>sort=-createdAt</code> - Descending order</li>
                                        <li><code>sort=title,-views</code> - Multiple fields</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* POST Endpoint */}
                        <div className="endpoint_method">
                            <span className="method post">POST</span>
                            <code>/api/public/blog</code>
                            <p>Create a new item</p>
                            <div className="params">
                                <h4>Request Body:</h4>
                                <pre>
                                    {`{
    // Model fields
    "field1": "value1",
    "field2": "value2",
    // SEO fields (optional)
    "seoTitle": "string",
    "seoDescription": "string",
    "focusKeywords": "string",
    "canonicalUrl": "string",
    "metaRobots": "string",
    "openGraphTitle": "string",
    "openGraphDescription": "string"
}`}
                                </pre>
                            </div>
                            <div className="example">
                                <h4>Example Request:</h4>
                                <pre>
                                    {`POST /api/public/blog
Content-Type: application/json

{
    "title": "My Blog Post",
    "content": "Content...",
    "seoTitle": "SEO Title",
    "seoDescription": "SEO Description"
}`}
                                </pre>
                            </div>
                        </div>

                        {/* PUT Endpoint */}
                        <div className="endpoint_method">
                            <span className="method put">PUT</span>
                            <code>/api/public/modelName</code>
                            <p>Update an existing item</p>
                            <div className="params">
                                <h4>Request Body:</h4>
                                <pre>
                                    {`{
    "_id": "itemId",  // Required
    // Model fields to update
    "field1": "newValue1",
    "field2": "newValue2",
    // SEO fields (optional)
    "seoTitle": "string",
    "seoDescription": "string",
    "focusKeywords": "string",
    "canonicalUrl": "string",
    "metaRobots": "string",
    "openGraphTitle": "string",
    "openGraphDescription": "string"
}`}
                                </pre>
                            </div>
                            <div className="example">
                                <h4>Example Request:</h4>
                                <pre>
                                    {`PUT /api/public/blog
Content-Type: application/json

{
    "_id": "123456789",
    "title": "Updated Title",
    "content": "Updated content..."
}`}
                                </pre>
                            </div>
                        </div>

                        {/* DELETE Endpoint */}
                        <div className="endpoint_method">
                            <span className="method delete">DELETE</span>
                            <code>/api/public/modelName?id=</code>
                            <p>Delete an item</p>
                            <div className="params">
                                <h4>Query Parameters:</h4>
                                <ul>
                                    <li><code>id</code> - ID of the item to delete (required)</li>
                                </ul>
                            </div>
                            <div className="example">
                                <h4>Example Request:</h4>
                                <pre>
                                    {`DELETE /api/public/blog?id=123456789`}
                                </pre>
                            </div>
                        </div>

                        {/* Authentication */}
                        <div className="auth_section">
                            <h3>Authentication</h3>
                            <p>All API requests require an API token in the Authorization header:</p>
                            <pre>
                                {`Authorization: Bearer your_api_token_here`}
                            </pre>
                            <div className="token_types">
                                <h4>Token Types and Permissions:</h4>
                                <ul>
                                    <li><code>full_access</code> - Full access to all operations</li>
                                    <li><code>read_only</code> - Can only perform GET requests</li>
                                    <li><code>create_only</code> - Can only perform POST requests</li>
                                    <li><code>edit_only</code> - Can only perform PUT requests</li>
                                    <li><code>delete_only</code> - Can only perform DELETE requests</li>
                                </ul>
                            </div>
                        </div>

                        {/* Error Responses */}
                        <div className="error_section">
                            <h3>Error Responses</h3>
                            <div className="error_examples">
                                <div className="error_example">
                                    <h4>403 Forbidden</h4>
                                    <pre>
                                        {`{    "error": "Permission denied"}`}
                                    </pre>
                                </div>
                                <div className="error_example">
                                    <h4>404 Not Found</h4>
                                    <pre>
                                        {`{    "error": "Item not found"}`}
                                    </pre>
                                </div>
                                <div className="error_example">
                                    <h4>500 Internal Server Error</h4>
                                    <pre>
                                        {`{    "error": "Internal server error",    "message": "Error details..."}`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (!hasRouteAccess(session?.user?.userRole, '/setting/apitokens')) {
        return <Unauthorized />
    }

    return <>
        <div className="apitoken_page">
            <SettingNav currentPage="API Tokens" />

            <div className="apitoken_list">
                <div className="apitoken_title">
                    <div>
                        <h2>API Tokens</h2>
                        <p>Manage your API tokens here.</p>
                    </div>
                    <button onClick={() => setShowCreateForm(true)}><FaPlus /> Create new API Token</button>
                </div>
                <div className="api_tabs">
                    <button
                        className={`tab ${activeTab === 'tokens' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tokens')}
                    >
                        <FaPlus /> API Tokens
                    </button>
                    <button
                        className={`tab ${activeTab === 'guide' ? 'active' : ''}`}
                        onClick={() => setActiveTab('guide')}
                    >
                        <FaBook /> API Guide
                    </button>
                </div>
                {activeTab === 'tokens' ? (
                    <div className="existing_mo_co_de_list">
                        <table>
                            <thead>
                                <tr>
                                    <th>NO.</th>
                                    <th>TOKEN TYPE</th>
                                    <th>DURATION</th>
                                    <th>TOKEN</th>
                                    <th>CREATED AT</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tokens.map((token, index) => (
                                    <tr key={token._id}>
                                        <td>{index + 1}</td>
                                        <td>{token.tokenType}</td>
                                        <td>{token.duration === 'unlimited' ? 'Unlimited' : `${token.duration} days`}</td>
                                        <td>{token.token}</td>
                                        <td>{formatDate(token.createdAt)}</td>
                                        <td className="edit_de_td">
                                            <button onClick={() => {
                                                setFormData({
                                                    name: token.name,
                                                    description: token.description,
                                                    tokenType: token.tokenType,
                                                    duration: token.duration,
                                                });
                                                setEditTokenId(token._id);
                                                setShowCreateForm(true);
                                            }}><RiEdit2Line /></button>

                                            <button onClick={() => handleDeleteToken(token._id)}><RiDeleteBinLine /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    renderApiGuide()
                )}
            </div>
        </div>

        {showCreateForm && (
            <div className="popup_api_create_form">
                <div className="apitoken_create_data">
                    <div className="apitoken_title">
                        <h2>Create API Token</h2>
                        <div className="flex gap-1">
                            <button onClick={handleSubmitToken}>
                                <FaCheck /> {editTokenId ? 'Update' : 'Save'}
                            </button>
                            <button className="close_popup_cr_api" onClick={() => {
                                setShowCreateForm(false);
                                setFormData({
                                    name: "",
                                    description: "",
                                    tokenType: "",
                                    duration: ""
                                });
                                setEditTokenId(null);
                            }}>
                                <IoClose />
                            </button>
                        </div>
                    </div>
                    <form className="apitoken_generate_form" onSubmit={handleCreateToken}>
                        <div className="apitoken_generate_form_input">
                            <label htmlFor="token_name">Token Name</label>
                            <input
                                type="text"
                                id="token_name"
                                placeholder="Enter token name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="apitoken_generate_form_input">
                            <label htmlFor="description">Description</label>
                            <input
                                type="text"
                                id="description"
                                placeholder="Enter description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="apitoken_generate_form_input">
                            <label htmlFor="token_type">Token Type</label>
                            <select
                                id="token_type"
                                value={formData.tokenType}
                                onChange={(e) => setFormData({ ...formData, tokenType: e.target.value })}
                                required
                            >
                                <option value="">Select token type</option>
                                <option value="full_access">Full Access</option>
                                <option value="read_only">Read Only</option>
                                <option value="edit_only">Edit Only</option>
                                <option value="delete_only">Delete Only</option>
                                <option value="create_only">Create Only</option>
                            </select>
                        </div>
                        <div className="apitoken_generate_form_input">
                            <label htmlFor="token_duration">Token Duration</label>
                            <select
                                id="token_duration"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                required
                            >
                                <option value="">Select duration</option>
                                <option value="unlimited">Unlimited</option>
                                <option value="7">7 Days</option>
                                <option value="30">30 Days</option>
                                <option value="90">90 Days</option>
                            </select>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>
}