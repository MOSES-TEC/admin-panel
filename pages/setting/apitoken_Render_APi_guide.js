export default renderApiGuide = () => {
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
