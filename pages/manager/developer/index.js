import axios from "axios";
    import Link from "next/link";
    import { useEffect, useState, useRef } from "react";
    import { FaPlus } from "react-icons/fa6";
    import { RiDeleteBinLine, RiEdit2Line } from "react-icons/ri";
    import { IoChevronDown } from "react-icons/io5";
    import { LuFileJson2 } from 'react-icons/lu';
    import JsonViewer from '@/components/JsonViewer';
    import { toast } from "react-toastify";
    import Image from "next/image";
    
    export default function developer() {
        const [data, setData] = useState([]);
        const [total, setTotal] = useState(0);
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
        const [showJsonViewer, setShowJsonViewer] = useState(false);
        const [selectedItem, setSelectedItem] = useState(null);
    
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
        const res = await fetch('/api/models/developer');
        const model = await res.json();
        
        // Set all available fields excluding password
        const availableFields = model.fields.filter(field => field.name !== 'password');
        setAllFields(availableFields);
        
        // Get stored fields from localStorage or use default
        const storedFields = localStorage.getItem(`developer_fields`);
        if (storedFields) {
            const parsedFields = JSON.parse(storedFields);
            // Filter to ensure stored fields still exist in available fields
            const validFields = parsedFields.filter(fieldName => 
            availableFields.some(f => f.name === fieldName)
            );
            if (validFields.length > 0) {
            // Maintain the exact order from localStorage
            const orderedFields = validFields.map(fieldName => 
                availableFields.find(f => f.name === fieldName)
            ).filter(Boolean);
            setFields(orderedFields);
            return;
            }
        }
        
        // Default to first 4 fields if no stored fields
        const defaultFields = availableFields.slice(0, Math.min(4, availableFields.length));
        setFields(defaultFields);
        // Store default fields
        localStorage.setItem(`developer_fields`, JSON.stringify(defaultFields.map(f => f.name)));
        };
    
        const fetchData = async () => {
        const searchQuery = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
        const res = await fetch(`/api/developer?page=${page}&limit=${limit}${searchQuery}`);
        const json = await res.json();
        setData(json.items);
        setTotal(json.total);
        setTotalPages(Math.ceil(json.total / limit));
        };


        const handleDelete = async (id) => {
        const confirmDelete = confirm("Are you sure you want to delete this entry?");
        if (!confirmDelete) return;

        try {
        try{
        await axios.delete(`/api/developer?id=${id}`);
        fetchData(); // Refresh data after deletion
        }catch(error){
            if(error.response.status === 403){
            toast.error("Permission denied to Demo User.");
            }
            if(error.response.status === 409){
            toast.error("Cannot delete the last superadmin user.");
            }
        }
        } catch (error) {
        console.error("Error deleting entry:", error);
        alert("Failed to delete entry.");
        }
    };
    const isImageUrl = (url) =>
    typeof url === 'string' &&
    /.(jpg|jpeg|png|gif)$/i.test(url);
    
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
            src={`${window.location.origin}/api/media-serve/${value}`}
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
            src={`${window.location.origin}/api/media-serve/${value[0]}`}
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
        localStorage.setItem(`developer_fields`, JSON.stringify(newFields.map(f => f.name)));
        };

        // Add this useEffect to handle page changes
        useEffect(() => {
        const storedFields = localStorage.getItem(`developer_fields`);
        if (storedFields) {
            const parsedFields = JSON.parse(storedFields);
            const validFields = allFields.filter(f => parsedFields.includes(f.name));
            if (validFields.length > 0) {
            // Maintain the exact order from localStorage
            const orderedFields = parsedFields
                .map(fieldName => validFields.find(f => f.name === fieldName))
                .filter(Boolean);
            setFields(orderedFields);
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
                className="prev_next_page_btn"
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
                className="prev_next_page_btn"
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

        const handleViewJson = (item) => {
        setSelectedItem(item);
        setShowJsonViewer(true);
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
                        <Link href={`/manager/${model.name.toLowerCase()}`}>{model.name}</Link>
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
                    <h2>developer</h2>
                    <p>{total} entries found</p>
                </div>
                <div className="existing_mo_co_de_addbtn">
                    <div className="existing_mo_co_de_addbtn_inner">
                    <div style={{
                        position: 'relative'
                    }} ref={fieldSelectorRef}>
                        <button 
                        onClick={() => setShowFieldSelector(!showFieldSelector)}
                        className="existing_field_selector_btn"
                        >
                        Select fields <IoChevronDown style={{ marginLeft: '4px' }} />
                        </button>
                        
                        {showFieldSelector && (
                        <div className="existing_field_selector_inner">
                            <div className="existing_field_selector_title">
                            Show/Hide Columns
                            </div>
                            {allFields.map((field) => (
                            <div 
                                key={field.name}
                                className="existing_field_selector_item"
                                onClick={() => toggleFieldSelection(field)}
                            >
                                <input 
                                type="checkbox" 
                                checked={fields.some(f => f.name === field.name)}
                                onChange={() => {}}                              
                                />
                                <span >
                                {field.name}
                                </span>
                            </div>
                            ))}
                        </div>
                        )}
                    </div>
                    
                    <Link href='/manager/developer/create'>
                        <button><FaPlus /> Create new entry</button>
                    </Link>
                    </div>
                </div>
                </div>
    
                <div className="existing_mo_co_de_list">
                <div className="existing_mo_co_de_list_search">
                <input
                    type="text"
                    placeholder="Search (min 3 characters)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}                
                />
                {searchTerm.length > 0 && searchTerm.length < 3 && (
                    <div  className="existing_mo_co_de_list_search_text">
                    Type at least 3 characters to search
                    </div>
                )}
                </div>
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
                        className="existing_data_not_found"
                        >
                        {searchTerm.length >= 3 ? (
                            <div>
                            <p style={{ marginBottom: '8px' }}>No results found for "{searchTerm}"</p>
                            <button
                                onClick={() => setSearchTerm('')}
                                className="existing_data_not_found_btn"
                            >
                                Clear search
                            </button>
                            </div>
                        ) : (
                        
                            <div className="field_not_found">
                                <img src="/img/document.png" alt="" />
                                <h4>Add your first data to this Content-Type</h4>
                                    <Link href='/manager/developer/create'>
                                    <button><FaPlus /> Create new entry</button>
                                </Link>
                                </div>
                                        
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
                            <td>
                            <div className="edit_de_td">
                            <button 
                                onClick={() => handleViewJson(item)}
                            >
                                <LuFileJson2 />
                            </button>
                                <Link href={`/manager/developer/edit/${item._id}`}>
                                <button><RiEdit2Line /></button>
                            </Link>
                            <button onClick={() => handleDelete(item._id)}><RiDeleteBinLine /></button>
                            
                            </div>
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

            {showJsonViewer && (
            <JsonViewer 
                data={selectedItem} 
                onClose={() => {
                setShowJsonViewer(false);
                setSelectedItem(null);
                }} 
            />
            )}
        </>
        );
    }