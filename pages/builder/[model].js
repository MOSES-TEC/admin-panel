import Unauthorized from "@/components/Unauthorized";
// import { useRestart } from "@/context/RestartContext";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaCheck, FaPlus, FaTrash } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { RiDeleteBinLine, RiEdit2Line } from "react-icons/ri";
import { toast } from "react-toastify";


export default function BuilderDynamic() {

    const { data: session } = useSession();

    // maintain useState structure
    // const { startRestart, endRestart } = useRestart();
    const [ success, setSuccess ] = useState(false);

    // if new field add or any changes
    const [ hasChanges, setHasChanges ] = useState(false);

    const [ modelName, setModelName ] = useState("");
    const [ fields, setFields ] = useState([]); // start with an empty array
    const [ modelId, setModelId ] = useState(""); // add a state for model id
    const [ existingModels, setExistingModels ] = useState([]);
    const [ loading, setLoading ] = useState(true);
    const [ popup, setPopup ] = useState(false); // for fields popup
    const [ selectedFieldType, setSelectedFieldType ] = useState(null);
    const [ editingFieldIndex, setEditingFieldIndex ] = useState(null);
    const [ fieldName, setFieldName ] = useState('');
    const [ fieldType, setFieldType ] = useState('');
    const [ dataType, setDataType ] = useState('');
    const [ required, setRequired ] = useState(false);
    const [ enumValues, setEnumValues ] = useState("");
    const [ showRestartPopup, setShowRestartPopup ] = useState(false); // for required to restart the next js server popup
    
    // for create new Model
    const [ newModelPopup, setNewModelPopup ] = useState(false);
    const [ newModelName, setNewModelName ] = useState("");
    
    // for json data view
    const [ showJsonViewer, setShowJsonViewer ] = useState(false);
    
    // for selected model fields show at first
    const [ selectedModel, setSelectedModel ] = useState(null);

    const router = useRouter();
    const { model } = router.query;

    useEffect(() => {
        fetchModels();
        if(model) {
            fetchModelDetails(model); // fetch model details if the model id exists in the url
        }
    }, [model]);

    useEffect(() => {
        if(success) {
            const timer = setTimeout(() => {
                setSuccess(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);


    // fetch models
    const fetchModels = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/models');
            setExistingModels(response.data);
            setLoading(false);

        } catch (error) {
            console.error("Error in fetching models", error);
            setLoading(false);
        }
    };


    // fetch model details function
    const fetchModelDetails = async (modelId) => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/models/${modelId}`);
            const modelData = response.data;
            setModelName(modelData.name);
            setModelId(modelData._id); // store model id here
            setFields(modelData.fields || []); // set fields from the api response
            setLoading(false);
            setHasChanges(false);

        } catch (error) {
            setLoading(false);
            console.error("Error in fetching the model details", error);
        }
    };



    const createNewModel = async () => {
        if(!newModelName.trim()) return alert("Enter a model name");

        try {
            // when we create a new model name then auto create model with fields empty
            await axios.post('/api/models', { modelName: newModelName, fields: [] });

            setNewModelPopup(false);
            router.push(`/builder/${newModelName}`);

        } catch (error) {
            alert("Error in creating the model: ", + (error.response?.data?.message || error.message));
        }
    };

    const deleteModel = async () => {
        if(!confirm("Are you sure you want to delete this model? it will delete all the pages and api.")) return;
        try {
            await axios.delete(`/api/models?id=${modelId}`);
            alert("Model deleted successfully");
            fetchModels();
            router.push("/builder/user");

        } catch (error) {
           alert("Error in deleting the model: ", + (error.response?.data?.message || error.message));
        }
    };


    const handleTogglePopup = async (field = null, index = null) => {
        if(popup) {
            // reset form when closing
            setSelectedFieldType(null);
            setFieldName('');
            setFieldType('');
            setDataType('');
            setRequired(false);
            setEnumValues("");
            setEditingFieldIndex(null);
        } else if(field !== null) {
            // load existing field for editing
            setSelectedFieldType(field.name);
            setFieldName(field.name);
            setFieldType(field.type);
            setDataType(field.datatype);
            setRequired(field.required);
            setEnumValues(field.enumValues ? field.enumValues.join("\n") : "");
            // if editing a relation model, set the selectedModel correctly
            setSelectedModel(field.refModel || "");
            setEditingFieldIndex(index);
        }
        setPopup(!popup);
    };

    const handleFieldTypeClick = (type, fieldTypeText, dataTypeText, refModel) => {
        setSelectedFieldType(type);
        setFieldName('');
        setFieldType(fieldTypeText);
        setDataType(dataTypeText);
        setRequired(false);
        setEnumValues("");
        setSelectedModel("");
    };

    const handleFieldNameChange = async (e) => {
        const inputValue = e.target.value;
        const sanitizedValue = inputValue.replace(/[ , .]/g, '');
        setFieldName(sanitizedValue);
    };

    const addFieldToList = () => {
        if(fieldName && fieldType) {
            let updatedFields = [...fields];

            const newField = {
                name: fieldName,
                type: fieldType,
                datatype: dataType,
                required,
                refModel: fieldType === "arrayrelation" ? selectedModel : "",
                enumValues: dataType === "selectmulti" || "singleselect" ? enumValues.split("\n").filter(Boolean) : []
            }

            if(editingFieldIndex !== null) {
                updatedFields[editingFieldIndex] = newField;
            } else {
                updatedFields.push(newField);
            }

            setFields(updatedFields);
            setHasChanges(true);
            setPopup(false);
            setSelectedFieldType(null);
            setFieldName('');
            setFieldType('');
            setRequired(false);
            setEnumValues("");
            setSelectedModel("");
            setEditingFieldIndex(null);

        } else {
            alert("Please fill the field details");
        }
    };

    const removeField = (index) => {
        const updatedFields = [...fields];
        updatedFields.splice(index, 1);
        setFields(updatedFields.length ? updatedFields : []);
        setHasChanges(true);
    };

    const generateModel = async () => {
        if(!modelName.trim()) return alert("Enter a model name");

        try {
            
            try {
                let response;

                if(modelId) {
                    // update existing model
                    response = await axios.put(`/api/models?id=${modelId}`, {modelName, fields});
                } else {
                    // create new model
                    response = await axios.post("/api/models", {modelName, fields});
                    setModelId(response.data._id); // store the new model id
                    resetForm();
                }

                // start the restart process
                // startRestart();
                setSuccess(true);
                setHasChanges(false);

            } catch (error) {
                if(error.response.status === 403) {
                    toast.error("Permission denied to Demo User");
                }
                if(error.response.status === 409) {
                    // if last superadmin in database then it can not be delete
                    toast.error("Cannot delete the last superadmin user");
                }
            }

        } catch (error) {
            console.error("Error in saving the model:", error);
            alert("Error in saving the model: " + (error.response?.data?.message || error.message));
        }
    };

    const resetForm = () => {
        setModelName("");
        setFields([]); // reset fields to an empty array
        setHasChanges(false);
    };


    // Helper function to capitalize the first letter of a string
    const capitalizeFirstLetter = (str) => {
        if(!str) return str; // return if the string is empty
        return str.charAt(0).toUpperCase() + str.slice(1);
    };


    // check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';

    useEffect(() => {

        // if we are in development mode then this page will work otherwise page will not be work
        if(!isDevelopment) {
            return <Unauthorized message="Only work in development mode" />
        }
    }, []);

    // update model name handler to track changes
    const handleModelNameChange = (e) => {
        setModelName(e.target.value);
        setHasChanges(true);
    }


    // if in development mode but user don't have access, show unauthorized
    // if(!hasRouteAccess(session?.user?.useRole, '/builder')) {
    //     return <Unauthorized />
    // }



    return <>

        <div className="content_type_builder_page">
            <div className="existing_model_list">
                <h2>Content-Type Builder</h2>
                <div className="ex_model_list_ul">
                    <ul>
                        {existingModels.length > 0 ? (
                            existingModels.map((model, index) => (
                                <li key={index}>
                                    {/* we will create a model for models control */}
                                    <Link href={`/builder/${model.name}`}>{model.name}</Link>
                                </li>
                            ))
                        ) : (
                            // if there is no model in database, so default user model
                            <li><Link href='/builder/user'>User</Link></li>
                        )}
                    </ul>
                    <button onClick={() => setNewModelPopup(true)}>+ Create a new model</button>
                </div>
            </div>


            <div className="existing_model_collection_details">
                <div className="existing_mo_co_de_title">
                    <div>
                        <h2>{modelName || "User"}</h2>
                        <p>Create the data structure of your content</p>
                    </div>
                    <div className="existing_mo_co_de_addbtn">
                        <button onClick={handleTogglePopup}><FaPlus />Add another field</button>
                        <button disabled={fields.length === 0 || !hasChanges} onClick={generateModel} className={success ? "success-button" : ""}>{success ? "Saved" : <><FaCheck />Save</>}</button>
                        <button onClick={deleteModel} className="btn-delete" style={{ backgroundColor: "#dc2626", color: "#fff"}}><FaTrash />Delete Model</button>
                    </div>
                </div>

                <div className="existing_mo_co_de_list">
                    <div className="existing_model_name">
                        <div className="flex flex-col flex-left gap-5">
                            <label htmlFor="">Model Name: </label>
                            <div style={{ display: "flex", alignItems: "center", gap: "50px" }}>
                                <input type="text" placeholder="Model Name" value={modelName} onChange={handleModelNameChange} />

                                {/* if model name then show the api path */}
                                {modelName && (
                                    <div className="api_path_display">
                                        <span>API Path:</span>
                                        <code>/api/public/{modelName.toLowerCase()}</code>
                                    </div>
                                )}

                                <Link className="model_gen_api_token_btn" href='/setting/apitokens'>Generate api Token</Link>
                            </div>
                        </div>

                        {!modelName === "User" && (
                            <button onClick={deleteModel}><RiDeleteBinLine />Delete Model</button>
                        )}
                    </div>


                    {/* popup for adding a new fields */}
                    <div className={popup ? "add_popup_select_new_field active" : "add_popup_select_new_field"}>
                        <div className="add_popup_new_title">
                            <h2>Add New Field</h2>
                            <div className="flex gap-1">
                                <button className="save_field_button" onClick={addFieldToList}>Save Field</button>
                                <button onClick={handleTogglePopup}><IoClose /></button>
                            </div>
                        </div>

                        {/* field name and type */}
                        {selectedFieldType && (
                            <div className="field_name_input">
                                <h4>Enter Field name for {selectedFieldType}</h4>
                                <div className="flex gap-1 mt-1">
                                    <input type="text" value={fieldName} onChange={handleFieldNameChange} placeholder={`Field name for ${selectedFieldType}`} />
                                    <div className="flex gap-5">
                                        <input type="checkbox" id="required" checked={required} onChange={() => setRequired(!required)} />
                                        <label htmlFor="required">Required</label>
                                    </div>
                                    <input type="text" value={fieldType} readOnly disabled placeholder="Field Type" />
                                    <input type="text" value={dataType} readOnly disabled placeholder="Data Type" />

                                    
                                </div>

                                {/* it will show when we select field type */}
                                {(dataType === 'selectmulti' || dataType === 'singleselect') && fieldType !== 'arrayrelation' && (
                                    <div className="mt-1">
                                        <h4>Enumeration Values (one line per value) </h4>
                                        <textarea value={enumValues} onChange={(e) => setEnumValues(e.target.value)} placeholder="Enter values, one per line" rows={5} cols={30} />
                                    </div>
                                )}

                                {fieldType === "arrayrelation" && (
                                    <div className="mt-2">
                                        <h4>Select or Enter Relation Model:</h4>
                                        <div className="flex gap-3">
                                            <select value={selectedModel} onChange={(e) => {
                                                const value = e.target.value === "manual" ? "" : e.target.value;
                                                setSelectedModel(capitalizeFirstLetter(value));
                                            }}>
                                                <option value="">select a model</option>
                                                {existingModels.map((model, index) => (
                                                    <option key={index} value={model.name}>{model.name}</option>
                                                ))}
                                                <option value="manual">Enter Manually</option>
                                            </select>

                                            {/* show input field if manual input is needed */}
                                            {(selectedModel === "" || !existingModels.some(model => model.name === selectedModel)) && (
                                                <div className="flex flex-col justify-start">
                                                    <p>Model Name:</p>
                                                    <input type="text" placeholder="Enter model name" value={selectedModel} onChange={(e) => setSelectedModel(capitalizeFirstLetter(e.target.value))} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}


                        {/* main field type options */}
                        <div className="main_add_new_collec_cont">
                            {
                                [
                                    { name: 'Text', fieldType: 'string', datatype: 'textinput'},
                                    { name: 'Long Text', fieldType: 'string', datatype: 'textarea'},
                                    { name: 'Unique Url', fieldType: 'string', datatype: 'stringunique'},
                                    { name: 'Web Link', fieldType: 'string', datatype: 'stringweblink'},
                                    { name: 'Email', fieldType: 'string', datatype: 'inputemail'},
                                    { name: 'Single Select', fieldType: 'string', datatype: 'singleselect'},
                                    { name: 'Password', fieldType: 'string', datatype: 'password'},
                                    { name: 'Text Editor', fieldType: 'string', datatype: 'markdowneditor'},
                                    { name: 'Number', fieldType: 'number', datatype: 'number'},
                                    { name: 'Date', fieldType: 'date', datatype: 'inputdate'},
                                    { name: 'Media', fieldType: 'array', datatype: 'multiimageselect'},
                                    { name: 'Multi Select', fieldType: 'array', datatype: 'selectmulti'},
                                    { name: 'Creatable Select', fieldType: 'array', datatype: 'creatableselectmulti'},
                                    { name: 'Boolean', fieldType: 'boolean', datatype: 'toggleinput'},
                                    { name: 'Relation', fieldType: 'arrayrelation', datatype: 'selectmulti'}, // relation with another database field like user to blog, product to user
                                ].map((fieldOption) => {
                                    const isActive = fieldType === fieldOption.fieldType && dataType === fieldOption.datatype;
                                    return <div key={fieldOption.name} className={isActive ? "add_colle_type active" : "add_colle_type"} onClick={() => handleFieldTypeClick(fieldOption.name, fieldOption.fieldType, fieldOption.datatype)}>
                                        <h3>{fieldOption.name}</h3>
                                        <h4>Field Type: <strong>{fieldOption.fieldType}</strong></h4>
                                    </div>
                                })
                            }
                        </div>

                    </div>


                    {/* Field list table */}
                    <table>
                        <thead>
                            <tr>
                                <th>NO.</th>
                                <th>NAME</th>
                                <th>FIELD TYPE</th>
                                <th>DATA TYPE</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fields.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="field_not_found">
                                            <img src="/img/document.png" alt="document" />
                                            <h4>Add your first field to this Collection-Type</h4>
                                            <button onClick={handleTogglePopup}>Add New Field</button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                fields.map((field, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{field.name}</td>
                                        <td>{field.type}</td>
                                        <td>{field.datatype}</td>
                                        <td className="edit_de_td">
                                            <button onClick={() => handleTogglePopup(field, index)}><RiEdit2Line /></button>
                                            <button onClick={() => removeField(index)}><RiDeleteBinLine /> </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                </div>

            </div>

        </div>


        {/* for new model create */}
        {newModelPopup && (
            <div className="popup_background">
                <div className="popup_box">
                    <h2>Create New Model</h2>
                    <input type="text" placeholder="Enter Model Name" value={newModelName} 
                        onChange={(e) => {
                            const value = e.target.value;

                            // if when we enter space then space not work because in model, no need of space, if we clicked auto remove
                            if(!value.includes(' ')) {
                                setNewModelName(value.toLowerCase());
                            }
                        }}
                        onkeydown = {(e) => {
                            if(e.key === ' ') {
                                e.preventDefault(); // prevent spacebar input
                            }
                        }} />

                    <div className="popup_buttons">
                        <button onClick={createNewModel}><FaCheck /> Create</button>
                        <button onClick={() => setNewModelPopup(false)}><IoClose /> Cancel</button>
                    </div>
                </div>
            </div>
        )}


        {/* Restart Popup */}
        {showRestartPopup && (
            <div className="popup_background">
                <div className="popup_box" style={{ textAlign: "center" }}>
                    <h2>Application Restarting</h2>
                    <div style={{ margin: "20px 0" }}>
                        <div className="loading-container">
                            <div className="spinner"></div>
                        </div>
                        <p style={{ marginTop: "10px" }}>Please wait while the application restart...</p>
                    </div>
                </div>
            </div>
        )}

    </>
};



