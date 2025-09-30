import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApiTest = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 10,
    sort: '-createdAt',
    search: '',
    filter: '',
    fields: '',
    populate: ''
  });

  // Replace with your actual API token and endpoint
  const API_TOKEN = 'your_api_token_here';
  const API_URL = '/api/your-model-name';

  const fetchItems = async () => {
    try {
      setLoading(true);
      // Create a new object with only non-empty query parameters
      const params = Object.entries(queryParams).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await axios.get(API_URL, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        params
      });
      setItems(response.data.items);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [queryParams]);

  const handleQueryChange = (e) => {
    const { name, value } = e.target;
    setQueryParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Query Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Query Parameters Form */}
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="text-xl font-semibold mb-4">Query Parameters</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Page</label>
            <input
              type="number"
              name="page"
              value={queryParams.page}
              onChange={handleQueryChange}
              className="w-full p-2 border rounded"
              min="1"
            />
          </div>
          <div>
            <label className="block mb-1">Limit</label>
            <input
              type="number"
              name="limit"
              value={queryParams.limit}
              onChange={handleQueryChange}
              className="w-full p-2 border rounded"
              min="1"
            />
          </div>
          <div>
            <label className="block mb-1">Sort</label>
            <input
              type="text"
              name="sort"
              value={queryParams.sort}
              onChange={handleQueryChange}
              className="w-full p-2 border rounded"
              placeholder="-createdAt"
            />
          </div>
          <div>
            <label className="block mb-1">Search</label>
            <input
              type="text"
              name="search"
              value={queryParams.search}
              onChange={handleQueryChange}
              className="w-full p-2 border rounded"
              placeholder="Search term"
            />
          </div>
          <div>
            <label className="block mb-1">Filter (JSON)</label>
            <input
              type="text"
              name="filter"
              value={queryParams.filter}
              onChange={handleQueryChange}
              className="w-full p-2 border rounded"
              placeholder='{"field": "value"}'
            />
          </div>
          <div>
            <label className="block mb-1">Fields</label>
            <input
              type="text"
              name="fields"
              value={queryParams.fields}
              onChange={handleQueryChange}
              className="w-full p-2 border rounded"
              placeholder="field1,field2"
            />
          </div>
          <div>
            <label className="block mb-1">Populate</label>
            <input
              type="text"
              name="populate"
              value={queryParams.populate}
              onChange={handleQueryChange}
              className="w-full p-2 border rounded"
              placeholder="field1,field2"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Results</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(items, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiTest; 