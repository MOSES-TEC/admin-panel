import Unauthorized from "@/components/Unauthorized";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaCheck, FaPlus } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { LuFileJson2 } from "react-icons/lu";
import { RiEdit2Line } from "react-icons/ri";
import { RiDeleteBinLine } from "react-icons/ri";


export default function Builder() {

    const { data: session } = useSession();
    const [ existingModels, setExistingModels ] = useState([]);
    const [ loading, setLoading ] = useState(true);

    // for create new Model
    const [ newModelPopup, setNewModelPopup ] = useState(false);
    const [ newModelName, setNewModelName ] = useState("");
    
    // for json data view
    const [ showJsonViewer, setShowJsonViewer ] = useState(false);

    // for selected model fields show at first
    const [ selectedModel, setSelectedModel ] = useState(null);

    const router = useRouter();

    // check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';

    useEffect(() => {

        // if we are in development mode then this page will work otherwise page will not be work
        if(!isDevelopment) {
            return <Unauthorized message="Only work in development mode" />
        }

        fetchModels();
    }, []);

    // if in development mode but user don't have access, show unauthorized
    // if(!hasRouteAccess(session?.user?.useRole, '/builder')) {
    //     return <Unauthorized />
    // }


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


    // for delete model with existing fields and template data (template will be build later)
    const deleteModel = async () => {
        if(!confirm("Are you sure you want to delete this model? it will delete all the pages and api.")) return;
        try {
            await axios.delete(`/api/models?id=${modelId}`);
            alert("Model deleted successfully");
            fetchModels();
            router.push("/builder/user");

        } catch (error) {
           alert("Error in deleting the model ", + (error.response?.data?.message || error.message));
        }
    };

    // for json data view
    const handleViewJson = async (model) => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/${model.name.toLowerCase()}?page=1&limit=10`);
            setSelectedModel(response.data);
            setShowJsonViewer(true);

        } catch (error) {
            console.error("Error in Fetching the data", error);
            alert("Failed to fetch data. Please try again!");
        } finally {
            setLoading(false);
        }
    };

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
                        <h2>Total Models</h2>
                        <p>Create the Model for structure of your content</p>
                    </div>
                    <div className="existing_mo_co_de_addbtn">
                        <button onClick={() => setNewModelPopup(true)}><FaPlus /> Add another Model</button>
                    </div>
                </div>

                <div className="existing_mo_co_de_list">
                    <table>
                        <thead>
                            <tr>
                                <th>NO.</th>
                                <th>MODEL NAME</th>
                                <th>CREATED DATE</th>
                                <th>TOTAL FIELDS</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>

                        <tbody>

                            {existingModels.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="field_not_found">
                                            <img src="/img/document.png" alt="document" />
                                            <h4>Add your first Model</h4>
                                            <button onClick={() => setNewModelPopup(true)}>+ Create a new model</button>
                                        </div>
                                    </td>
                                </tr>

                            ) : (
                                existingModels.map((model, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{model.name}</td>
                                        <td>{new Date(model.createdAt).toLocaleDateString('en-IN')}</td>
                                        <td>{model.fields.length}</td>
                                        <td className="edit_de_td">
                                            <button onClick={() => handleViewJson(model)} title="View JSON"><LuFileJson2 /></button>
                                            <Link href={`/builder/${model.name}`} title="Edit"><RiEdit2Line /></Link>

                                            {/* no one can delete user model because user is a main model */}
                                            {model.name === 'user' ? null : 
                                                <button onClick={() => deleteModel(model._id)}><RiDeleteBinLine /></button>
                                            }
                                        </td>
                                    </tr> 
                                ))
                            )}
                        </tbody>
                    </table>

                </div>

            </div>

        </div>

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


        {/* json viewer letter */}
        {/* {showJsonViewer && (
            <JsonViewer />
        )} */}


    </>
};



