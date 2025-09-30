import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaPlus, FaEdit, FaTrash, FaFileAlt, FaDatabase, FaEye, FaEyeSlash, FaSync } from 'react-icons/fa';
import { useRestart } from '@/context/RestartContext';
import 'react-toastify/dist/ReactToastify.css';
import { useSession } from 'next-auth/react';
import { hasPermission, PERMISSIONS, hasRouteAccess } from '@/lib/rbac';
import { useRouter } from 'next/router';
import SettingNav from '@/components/SettingNav';
import Unauthorized from '@/components/Unauthorized';

export default function EnvData() {
    const { data: session } = useSession();
    const router = useRouter();
    const { startRestart, endRestart } = useRestart();
    const [envVars, setEnvVars] = useState([]);
    const [envFileVars, setEnvFileVars] = useState({});
    const [showForm, setShowForm] = useState(false);
    const [editingVar, setEditingVar] = useState(null);
    const [activeTab, setActiveTab] = useState('file');
    const [showValues, setShowValues] = useState(false);
    const [isRestarting, setIsRestarting] = useState(false);
    const [formData, setFormData] = useState({
        key: '',
        value: '',
        description: ''
    });

    const canCreate = hasPermission(session?.user?.userRole, PERMISSIONS.CREATE);
    const canUpdate = hasPermission(session?.user?.userRole, PERMISSIONS.UPDATE);
    const canDelete = hasPermission(session?.user?.userRole, PERMISSIONS.DELETE);

    useEffect(() => {
        // if (!hasRouteAccess(session?.user?.userRole, '/setting/envdata')) {
        //     router.push('/');
        //     return;
        // }
        loadEnvVars();
        loadEnvFile();
    }, [session]);

    const loadEnvVars = async () => {
        try {
            const response = await fetch('/api/env-vars');
            const data = await response.json();
            setEnvVars(data);
        } catch (error) {
            console.error('Error loading environment variables:', error);
        }
    };

    const loadEnvFile = async () => {
        try {
            const response = await fetch('/api/env-file');
            const data = await response.json();
            setEnvFileVars(data);
        } catch (error) {
            console.error('Error loading .env file variables:', error);
        }
    };

    const restartApplication = async () => {
        setIsRestarting(true);
        startRestart();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (activeTab === 'db') {
            try {
                const response = await fetch('/api/env-vars', {
                    method: editingVar ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    setShowForm(false);
                    setEditingVar(null);
                    setFormData({ key: '', value: '', description: '' });
                    loadEnvVars();
                }
            } catch (error) {
                console.error('Error saving environment variable:', error);
            }
        } else {
            try {
                const response = await fetch('/api/env-file', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        key: formData.key,
                        value: formData.value
                    }),
                });

                if (response.ok) {
                    setShowForm(false);
                    setEditingVar(null);
                    setFormData({ key: '', value: '', description: '' });
                    loadEnvFile();
                    // Restart the application after updating .env file
                    restartApplication();
                }
            } catch (error) {
                console.error('Error saving .env file variable:', error);
            }
        }
    };

    const handleDelete = async (key) => {
        if (window.confirm('Are you sure you want to delete this environment variable?')) {
            if (activeTab === 'db') {
                try {
                    const response = await fetch(`/api/env-vars/${key}`, {
                        method: 'DELETE',
                    });

                    if (response.ok) {
                        loadEnvVars();
                    }
                } catch (error) {
                    console.error('Error deleting environment variable:', error);
                }
            } else {
                try {
                    const response = await fetch('/api/env-file', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ key }),
                    });

                    if (response.ok) {
                        loadEnvFile();
                        // Restart the application after deleting from .env file
                        restartApplication();
                    }
                } catch (error) {
                    console.error('Error deleting .env file variable:', error);
                }
            }
        }
    };

    const handleEdit = (envVar) => {
        setEditingVar(envVar);
        setFormData({
            key: envVar.key || envVar,
            value: activeTab === 'db' ? envVar.value : envFileVars[envVar],
            description: activeTab === 'db' ? envVar.description : ''
        });
        setShowForm(true);
    };

    if (!hasRouteAccess(session?.user?.userRole, '/setting/envdata')) {
        return <Unauthorized />
    }


    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        return (
            <div className="envdata_page">
                <SettingNav currentPage="Environment Variables" />

                <div className="envdata_container">
                    <div className="envdata-header">
                        <div className="header-content">
                            <h1>Environment Variables</h1>
                            <p>Manage your environment variables for both database and .env file</p>
                        </div>
                        <div className="header-actions">
                            <button
                                onClick={() => setShowValues(!showValues)}
                                className="btn-secondary"
                            >
                                {showValues ? <FaEyeSlash className="icon" /> : <FaEye className="icon" />}
                                {showValues ? 'Hide Values' : 'Show Values'}
                            </button>


                            <button
                                onClick={() => setShowForm(true)}
                                className="btn-primary"
                            >
                                <FaPlus className="icon" />
                                Add Variable
                            </button>

                        </div>
                    </div>

                    <div className="tabs-container">
                        <div className="tabs-mobile">
                            <select
                                value={activeTab}
                                onChange={(e) => setActiveTab(e.target.value)}
                                className="tab-select"
                            >
                                <option value="db">Database Variables</option>
                                <option value="file">.env File Variables</option>
                            </select>
                        </div>
                        <div className="tabs-desktop">
                            <div className="tabs">
                                <button
                                    onClick={() => setActiveTab('file')}
                                    className={`tab ${activeTab === 'file' ? 'active' : ''}`}
                                >
                                    <FaFileAlt className="icon" />
                                    .env File Variables
                                </button>
                                <button
                                    onClick={() => setActiveTab('db')}
                                    className={`tab ${activeTab === 'db' ? 'active' : ''}`}
                                >
                                    <FaDatabase className="icon" />
                                    Database Variables
                                </button>
                            </div>
                        </div>
                    </div>

                    {showForm && (
                        <div className="form-container">
                            <div className="form-content">
                                <h3>{editingVar ? 'Edit' : 'Add New'} Environment Variable</h3>
                                <form onSubmit={handleSubmit} className="env-form">
                                    <div className="form-group">
                                        <label htmlFor="key">Key</label>
                                        <input
                                            type="text"
                                            id="key"
                                            value={formData.key}
                                            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="value">Value</label>
                                        <input
                                            type="text"
                                            id="value"
                                            value={formData.value}
                                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                            required
                                        />
                                    </div>
                                    {activeTab === 'db' && (
                                        <div className="form-group">
                                            <label htmlFor="description">Description</label>
                                            <textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={3}
                                            />
                                        </div>
                                    )}
                                    <div className="form-actions">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowForm(false);
                                                setEditingVar(null);
                                                setFormData({ key: '', value: '', description: '' });
                                            }}
                                            className="btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                        >
                                            {editingVar ? 'Update' : 'Save'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="table-container">
                        <table className="env-table">
                            <thead>
                                <tr>
                                    <th>Key</th>
                                    <th>Value</th>
                                    {activeTab === 'db' && <th>Description</th>}
                                    <th className="actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeTab === 'db' ? (
                                    envVars.map((envVar) => (
                                        <tr key={envVar._id}>
                                            <td>{envVar.key}</td>
                                            <td>{showValues ? envVar.value : '••••••••'}</td>
                                            <td>{envVar.description}</td>
                                            <td className="actions">

                                                <button
                                                    onClick={() => handleEdit(envVar)}
                                                    className="btn-icon"
                                                >
                                                    <FaEdit />
                                                </button>


                                                <button
                                                    onClick={() => handleDelete(envVar._id)}
                                                    className="btn-icon delete"
                                                >
                                                    <FaTrash />
                                                </button>

                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    Object.entries(envFileVars).map(([key, value]) => (
                                        <tr key={key}>
                                            <td>{key}</td>
                                            <td>{showValues ? value : '••••••••'}</td>
                                            <td className="actions">

                                                <button
                                                    onClick={() => handleEdit(key)}
                                                    className="btn-icon"
                                                >
                                                    <FaEdit />
                                                </button>


                                                <button
                                                    onClick={() => handleDelete(key)}
                                                    className="btn-icon delete"
                                                >
                                                    <FaTrash />
                                                </button>

                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    } else {
        return <Unauthorized />
    }
}