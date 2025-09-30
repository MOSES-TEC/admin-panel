export const generatePageCode = (modelName) => {
  return `
import axios from "axios";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { FaPlus } from "react-icons/fa6";
import { RiDeleteBinLine, RiEdit2Line } from "react-icons/ri";
import { IoChevronDown } from "react-icons/io5";

export default function ${modelName}() {
  const [data, setData] = useState([]);
  const [fields, setFields] = useState([]);
  const [allFields, setAllFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [existingModels, setExistingModels] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const fieldSelectorRef = useRef(null);
  const limit = 10;

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    fetchData();
    fetchFields();
  }, [page]);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchTerm.length >= 3 || searchTerm.length === 0) {
      const timeout = setTimeout(() => {
        setPage(1);
        fetchData();
      }, 500);

      setSearchTimeout(timeout);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    // Close field selector when clicking outside
    function handleClickOutside(event) {
      if (fieldSelectorRef.current && !fieldSelectorRef.current.contains(event.target)) {
        setShowFieldSelector(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/models");
      setExistingModels(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching models", error);
      setLoading(false);
    }
  };

  const fetchFields = async () => {
    const res = await fetch('/api/models/${modelName.toLowerCase()}');
    const model = await res.json();
    
    // Set all available fields excluding password
    const availableFields = model.fields.filter(field => field.name !== 'password');
    setAllFields(availableFields);
    
    // Get stored fields from localStorage or use default
    const storedFields = localStorage.getItem(\`${modelName.toLowerCase()}_fields\`);
    if (storedFields) {
      const parsedFields = JSON.parse(storedFields);
      // Filter to ensure stored fields still exist in available fields
      const validFields = parsedFields.filter(fieldName => 
        availableFields.some(f => f.name === fieldName)
      );
      if (validFields.length > 0) {
        setFields(availableFields.filter(f => validFields.includes(f.name)));
        return;
      }
    }
    
    // Default to first 4 fields if no stored fields
    const defaultFields = availableFields.slice(0, Math.min(4, availableFields.length));
    setFields(defaultFields);
    // Store default fields
    localStorage.setItem(\`${modelName.toLowerCase()}_fields\`, JSON.stringify(defaultFields.map(f => f.name)));
  };

  const fetchData = async () => {
    const searchQuery = searchTerm ? \`&search=\${encodeURIComponent(searchTerm)}\` : '';
    const res = await fetch(\`/api/${modelName.toLowerCase()}?page=\${page}&limit=\${limit}\${searchQuery}\`);
    const json = await res.json();
    setData(json.items);
    setTotalPages(Math.ceil(json.total / limit));
  };


   const handleDelete = async (id) => {
  const confirmDelete = confirm("Are you sure you want to delete this entry?");
  if (!confirmDelete) return;

  try {
    await axios.delete(\`/api/${modelName.toLowerCase()}?id=\${id}\`);
    fetchData(); // Refresh data after deletion
  } catch (error) {
    console.error("Error deleting entry:", error);
    alert("Failed to delete entry.");
  }
};
const isImageUrl = (url) =>
  typeof url === 'string' &&
  /\.(jpg|jpeg|png|gif)$/i.test(url);
  
  // Helper to truncate long strings
const truncate = (text, length = 40) =>
  typeof text === 'string' && text.length > length ? text.slice(0, length) + '…' : text;

// Dynamic helper function to get best display value from an object
const getDisplayValue = (obj) => {
  if (!obj || typeof obj !== "object") return null;
  const keys = Object.keys(obj);

  const isMeaningful = (key) =>
    typeof obj[key] === 'string' &&
    obj[key].trim() !== '' &&
    !['id', '_id'].includes(key.toLowerCase());

  // First try to get a meaningful string field (not id/_id)
  const preferredField = keys.find(isMeaningful);
  if (preferredField) return obj[preferredField];

  // Then fallback to any other string field
  const stringField = keys.find(
    key => typeof obj[key] === 'string' && obj[key].trim() !== ''
  );
  if (stringField) return obj[stringField];

  // Then fallback to any other non-null/empty field (not id/_id)
  const nonEmptyField = keys.find(
    key => obj[key] !== null && obj[key] !== undefined && obj[key] !== '' && !['id', '_id'].includes(key.toLowerCase())
  );
  if (nonEmptyField) return obj[nonEmptyField];

  // Finally fallback to id/_id if nothing else
  const idField = keys.find(key => ['id', '_id'].includes(key.toLowerCase()));
  if (idField) return obj[idField];

  return '[Object]';
};


// Main renderCell function
const renderCell = (field, value) => {
  // Boolean toggle
  if (field.type === 'toggle' || field.type === 'boolean') {
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        backgroundColor: value ? '#dcfce7' : '#fee2e2',
        color: value ? '#166534' : '#991b1b',
        fontWeight: '500',
        fontSize: '12px'
      }}>
        {value ? 'ON' : 'OFF'}
      </span>
    );
  }

  // Image field
  if (field.type === 'image' || isImageUrl(value)) {
    return (
      <img
        src={\`\${window.location.origin}/api/media-serve/\${value}\`}
        alt="thumbnail"
        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
      />
    );
  }

  // Hide password field
  if (field.name === 'password') {
    return '••••••••';
  }

  // Array values
  if (Array.isArray(value)) {
    if (value.length > 0 && isImageUrl(value[0])) {
      return (
        <img
          src={\`\${window.location.origin}/api/media-serve/\${value[0]}\`}
          alt="thumbnail"
          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
        />
      );
    }

    return value.map((v, i) => {
      if (typeof v === 'object' && v !== null) {
        return truncate(String(getDisplayValue(v)));
      }
      return truncate(String(v));
    }).join(', ');
  }

  // Object values
  if (typeof value === 'object' && value !== null) {
    return truncate(String(getDisplayValue(value)));
  }

  // Null/undefined fallback
  if (value === null || value === undefined) {
    return '-';
  }

  // Default
  return truncate(String(value));
};

  const toggleFieldSelection = (field) => {
    const newFields = fields.some(f => f.name === field.name)
      ? fields.filter(f => f.name !== field.name)
      : [...fields, field];
    
    setFields(newFields);
    // Store selected fields in localStorage
    localStorage.setItem(\`${modelName.toLowerCase()}_fields\`, JSON.stringify(newFields.map(f => f.name)));
  };

  // Add this useEffect to handle page changes
  useEffect(() => {
    const storedFields = localStorage.getItem(\`${modelName.toLowerCase()}_fields\`);
    if (storedFields) {
      const parsedFields = JSON.parse(storedFields);
      const validFields = allFields.filter(f => parsedFields.includes(f.name));
      if (validFields.length > 0) {
        setFields(validFields);
      }
    }
  }, [page, allFields]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const pageRange = 2;

    const addPage = (p) => {
      pages.push(
        <button
          key={p}
          style={{
            padding: '6px 12px',
            margin: '0 4px',
            border: page === p ? '2px solid #6366F1' : '1px solid #E5E7EB',
            borderRadius: '4px',
            background: page === p ? '#EEF2FF' : 'white',
            color: page === p ? '#4F46E5' : '#374151',
            cursor: 'pointer',
            fontWeight: page === p ? 'bold' : 'normal'
          }}
          onClick={() => setPage(p)}
        >
          {p}
        </button>
      );
    };

    if (page > 1) {
      pages.push(
        <button 
          key="prev" 
          onClick={() => setPage(page - 1)}
          style={{
            padding: '6px 12px',
            margin: '0 4px',
            border: '1px solid #E5E7EB',
            borderRadius: '4px',
            background: 'white',
            color: '#374151',
            cursor: 'pointer'
          }}
        >
          Prev
        </button>
      );
    }

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - pageRange && i <= page + pageRange)
      ) {
        addPage(i);
      } else if (
        i === page - pageRange - 1 ||
        i === page + pageRange + 1
      ) {
        pages.push(
          <span 
            key={"dots" + i}
            style={{
              margin: '0 4px',
              color: '#6B7280'
            }}
          >
            ...
          </span>
        );
      }
    }

    if (page < totalPages) {
      pages.push(
        <button 
          key="next" 
          onClick={() => setPage(page + 1)}
          style={{
            padding: '6px 12px',
            margin: '0 4px',
            border: '1px solid #E5E7EB',
            borderRadius: '4px',
            background: 'white',
            color: '#374151',
            cursor: 'pointer'
          }}
        >
          Next
        </button>
      );
    }

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '24px 0',
        flexWrap: 'wrap'
      }}>
        {pages}
      </div>
    );
  };

  return (
    <>
      <div className="manager_page">
        <div className="existing_content_type">
          <h2>Content-Type Manager</h2>
          <div className="existing_content_type_list">
            <ul>
              {existingModels.length > 0 ? (
                existingModels.map((model, index) => (
                  <li key={index}>
                    <Link href={\`/manager/\${model.name}\`}>{model.name}</Link>
                  </li>
                ))
              ) : (
                <li><Link href='/manager/user'>User</Link></li>
              )}
            </ul>
          </div>
        </div>

        <div className="manager_page_total_list">
          <div className="manager_page_to_title">
            <div>
              <h2>${modelName}</h2>
              <p>{data.length} entries found</p>
            </div>
            <div className="existing_mo_co_de_addbtn">
              <div style={{
                position: 'relative',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}>
                <div style={{
                  position: 'relative'
                }} ref={fieldSelectorRef}>
                  <button 
                    onClick={() => setShowFieldSelector(!showFieldSelector)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      backgroundColor: 'white',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#374151',
                      fontSize: '14px'
                    }}
                  >
                    Select fields <IoChevronDown style={{ marginLeft: '4px' }} />
                  </button>
                  
                  {showFieldSelector && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '220px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      padding: '12px',
                      zIndex: 10,
                      border: '1px solid #E5E7EB'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        color: '#111827',
                        borderBottom: '1px solid #E5E7EB',
                        paddingBottom: '8px'
                      }}>
                        Show/Hide Columns
                      </div>
                      {allFields.map((field) => (
                        <div 
                          key={field.name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 0',
                            cursor: 'pointer',
                            borderBottom: '1px solid #F3F4F6'
                          }}
                          onClick={() => toggleFieldSelection(field)}
                        >
                          <input 
                            type="checkbox" 
                            checked={fields.some(f => f.name === field.name)}
                            onChange={() => {}}
                            style={{
                              marginRight: '8px',
                              cursor: 'pointer'
                            }}
                          />
                          <span style={{
                            color: '#374151',
                            fontSize: '14px'
                          }}>
                            {field.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{
                  position: 'relative',
                  width: '250px'
                }}>
                  <input
                    type="text"
                    placeholder="Search (min 3 characters)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#374151',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      ':focus': {
                        borderColor: '#6366F1'
                      }
                    }}
                  />
                  {searchTerm.length > 0 && searchTerm.length < 3 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      padding: '4px 8px',
                      fontSize: '12px',
                      color: '#6B7280',
                      backgroundColor: '#F3F4F6',
                      borderRadius: '4px',
                      marginTop: '4px'
                    }}>
                      Type at least 3 characters to search
                    </div>
                  )}
                </div>
                <Link href='/manager/${modelName.toLowerCase()}/create'>
                  <button><FaPlus /> Create new entry</button>
                </Link>
              </div>
            </div>
          </div>

          <div className="existing_mo_co_de_list">
            <table>
              <thead>
                <tr>
                  <th>No.</th>
                  {fields?.map(f => (
                    <th key={f.name}>{f.name}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
               {data?.length === 0 ? (
                <tr>
                  <td
                    colSpan={fields.length + 2}
                    style={{
                      padding: '24px',
                      textAlign: 'center',
                      color: '#6B7280',
                      backgroundColor: '#F9FAFB'
                    }}
                  >
                    {searchTerm.length >= 3 ? (
                      <div>
                        <p style={{ marginBottom: '8px' }}>No results found for "{searchTerm}"</p>
                        <button
                          onClick={() => setSearchTerm('')}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#F3F4F6',
                            border: '1px solid #E5E7EB',
                            borderRadius: '4px',
                            color: '#374151',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Clear search
                        </button>
                      </div>
                    ) : (
                      'No data found'
                    )}
                  </td>
                </tr>
              ) : (
                <>
                  {data?.map((item, index) => (
                    <tr key={item._id}>
                      <td>{(page - 1) * limit + index + 1}</td>
                      {fields.map(f => (
                        <td key={f.name}>{renderCell(f, item[f.name])}</td>
                      ))}
                      <td className="edit_de_td">
                          <Link href={\`/manager/${modelName.toLowerCase()}/edit/\${item._id}\`}>
                          <button><RiEdit2Line /></button>
                        </Link>
                        <button onClick={() => handleDelete(item._id)}><RiDeleteBinLine /></button>
                      </td>
                    </tr>

                  ))}
                </>)}
              </tbody>
            </table>
            {renderPagination()}
          </div>
        </div>
      </div>
    </>
  );
}
`.trim();
};
