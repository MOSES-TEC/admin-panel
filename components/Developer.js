'use client';
import axios from "axios";
import Link from "next/link";
import { useEffect, useRef, useMemo, useState } from "react";
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { ReactSortable } from 'react-sortablejs';
import { LuSave } from "react-icons/lu";
import { MdOutlineEmail } from "react-icons/md";
import { RiImageAddLine } from "react-icons/ri";
import MarkdownEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from "react-toastify";
import { CompoStyles } from "@/styles/CompoStyles";



export default function DeveloperForm(

{
  _id,
  icon: existingIcon,
  seller: existingSeller,
  users: existingUsers,
  Date: existingDate,
  seoTitle: existingSeoTitle,
  seoDescription: existingSeoDescription,
  focusKeywords: existingFocusKeywords,
  canonicalUrl: existingCanonicalUrl,
  metaRobots: existingMetaRobots,
  openGraphTitle: existingOpenGraphTitle,
  openGraphDescription: existingOpenGraphDescription,
}

) {

const formatDate = (date) => {
    if (!date) return ''; // Handle null, undefined, or empty string
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return ''; // Validate date
    // Ensure the date is in the format "YYYY-MM-DDTHH:MM"
    return parsedDate.toISOString().slice(0, 16); // Slicing to get YYYY-MM-DDTHH:MM
};



 const [icon, setIcon] = useState(existingIcon || '');
const [seller, setSeller] = useState(existingSeller || '');

const [users, setUsers] = useState(existingUsers 
  ? existingUsers.map(w => {
      if (typeof w === 'object') {
        const labelKey = Object.keys(w).find(k => k !== '_id') || '_id';
        return {
          value: w._id || w,
          label: w[labelKey] || w._id || w
        };
      }
      return { value: w, label: w };
    }) : []);
const [usersOptions, setUsersOptions] = useState([]);
const [Date, setDate] = useState(formatDate(existingDate) || '');


 const [seoTitle, setSeoTitle] = useState(existingSeoTitle || '');
 const [seoDescription, setSeoDescription] = useState(existingSeoDescription || '');
 const [focusKeywords, setFocusKeywords] = useState(existingFocusKeywords
    ? existingFocusKeywords.map(w => {
      if (typeof w === 'object') {
        const labelKey = Object.keys(w).find(k => k !== '_id') || '_id';
        return {
          value: w._id || w,
          label: w[labelKey] || w._id || w
        };
      }
      return { value: w, label: w };
    }) : []);
 const [canonicalUrl, setCanonicalUrl] = useState(existingCanonicalUrl || '');
 const [metaRobots, setMetaRobots] = useState(existingMetaRobots || '');
 const [openGraphTitle, setOpenGraphTitle] = useState(existingOpenGraphTitle || '');
 const [openGraphDescription, setOpenGraphDescription] = useState(existingOpenGraphDescription || '');
 


  const [activeTab, setActiveTab] = useState('content');
  const [loading, setLoading] = useState(true);
  const [existingModels, setExistingModels] = useState([]);
  const [isModified, setIsModified] = useState(false);
  const formRef = useRef();

   

    const initialValues = useMemo(() => ({
  icon: existingIcon || '',
  seller: existingSeller || '',
  users: existingUsers
      ? existingUsers.map(w => ({
          value: w._id || w,
          label: w.name || w.email || w._id || w
        }))
      : [],
  Date: existingDate || ''
}), []);

useEffect(() => {
  const hasChanges = () => {
    return JSON.stringify(icon) !== JSON.stringify(initialValues.icon) || JSON.stringify(seller) !== JSON.stringify(initialValues.seller) || JSON.stringify(users) !== JSON.stringify(initialValues.users) || JSON.stringify(Date) !== JSON.stringify(initialValues.Date) ||
    seoTitle !== existingSeoTitle ||
    seoDescription !== existingSeoDescription ||
    JSON.stringify(focusKeywords) !== JSON.stringify(existingFocusKeywords) ||
    canonicalUrl !== existingCanonicalUrl ||
    metaRobots !== existingMetaRobots ||
    openGraphTitle !== existingOpenGraphTitle ||
    openGraphDescription !== existingOpenGraphDescription;
  };
  setIsModified(hasChanges());
}, [icon, seller, users, Date, seoTitle, seoDescription, focusKeywords, canonicalUrl, metaRobots, openGraphTitle, openGraphDescription]);


   useEffect(() => {
          fetchModels();
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
   }

   
useEffect(() => {
  async function fetchUsersOptions() {
    try {
      const response = await axios.get('/api/user');
      const formattedOptions = response.data.items.map(item => {
        // Find the first string field that's not _id
        const stringField = Object.entries(item).find(([key, value]) => 
          key !== '_id' && typeof value === 'string'
        );
        const labelKey = stringField ? stringField[0] : '_id';
        return {
          value: item._id,
          label: item[labelKey] || item._id
        };
      });

      setUsersOptions(formattedOptions);

      setUsers(formattedOptions.filter(opt => existingUsers?.includes(opt.value)));

         const selected = existingUsers?.map(existing => {
          const match = formattedOptions.find(opt => opt.value === (existing._id || existing));

           // Find the first string field that's not _id
           const stringField = Object.entries(existing).find(([key, value]) => 
             key !== '_id' && typeof value === 'string'
           );
           const labelKey = stringField ? stringField[0] : '_id';
          return match || {
            value: existing._id || existing,
            label: existing[labelKey] || existing._id || existing
          };
        });

        setUsers(selected || []);
    } catch (error) {
      console.error('Error fetching users options:', error);
    }
  }

  fetchUsersOptions();
}, [existingUsers]);

  

  async function createDeveloper(ev) {
  ev.preventDefault();

  const data = {
    seoTitle,
    seoDescription,
    focusKeywords: focusKeywords.map(option => option.value),
    canonicalUrl,
    metaRobots,
    openGraphTitle,
    openGraphDescription,
  };
  
  data.icon = icon;
  data.seller = seller;
  data.users = users.map(option => option.value);
  data.Date = Date;

  try {
    if (_id) {
      try{
      await axios.put(`/api/developer`, { ...data, _id });
      toast.success("Developer updated!");
      }catch(error){
        if(error.response.status === 403){
          toast.error("Permission denied to Demo User.");
        }
      }
    } else {
     try{
      
      await axios.post(`/api/developer`, data);
      toast.success("Developer created!");
      
     }catch(error){
      if(error.response.status === 403){
        toast.error("Permission denied to Demo User.");
      }
     }
    }
  } catch (error) {
    console.error("Error saving developer:", error);
    toast.error("Failed to save developer.");
    if(error.response.status === 403){
      toast.error("Permission denied to Demo User.");
    }
  }
}


  return (
    <div className="page_compo_create_update">
      <style jsx global>{CompoStyles}</style>
      <div className="existing_content_type">
        <h2>Content-Type List</h2>
        <div className="existing_content_type_list">
          <ul>
            {existingModels.length > 0 ? (
              existingModels.map((model, index) => (
                <li key={index}>
                  <Link href={`/manager/${model.name}/`}>{model.name}</Link>
                </li>
              ))
            ) : (
              <li><Link href='/manager/user'>User</Link></li>
            )}
          </ul>
        </div>
      </div>

      <div className="form-wrapper">
        <div className="form-header">
          <div className="form-title">
            Create a Developer
            <span>Craft. Publish. Shine. Repeat. Win.</span>
          </div>
           <button className="publish-btn" type="submit" onClick={() => formRef.current?.requestSubmit()} disabled={!isModified}>
  <LuSave />
  {isModified ? "Save Now" : "No Changes"}
</button>
        </div>

        <div className="tab-buttons">
          <button className={`tab-button ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>Content</button>
          <button className={`tab-button ${activeTab === 'seo' ? 'active' : ''}`} onClick={() => setActiveTab('seo')}>SEO</button>
        </div>

        <form className="form-container" ref={formRef} onSubmit={createDeveloper}>
          {activeTab === 'content' ? (
          <>
              <div className="form-section">
                <h3 className="section-title">Content Details</h3>
                
          <div className="form-group">
            <label  className="form-label">icon</label>
            <input type="text" name="icon" value={icon} onChange={(e) => setIcon(e.target.value)} className="form-control" required={false} />
          </div>

          <div className="form-group">
            <label  className="form-label">seller</label>
            <textarea name="seller" value={seller} onChange={(e) => setSeller(e.target.value)} className="form-control" rows="6" required={false}></textarea>
          </div>

                <div className="form-group">
                  <label  className="form-label">users</label>
                  <Select
                    name="users"
                    isMulti
                    value={users}
                    onChange={(selected) => setUsers(selected)}
                    options={usersOptions}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Select User"
                  />
                </div>

          <div className="form-group">
            <label  className="form-label">Date</label>
            <input type="datetime-local" name="Date" value={Date} onChange={(e) => setDate(e.target.value)} className="form-control time-input" onClick={(e) => e.target.showPicker()} required={false} />
          </div>
              </div>

              
              </>
            ) : (
              <div className="seo-section">
                <h3 className="section-title">SEO Settings</h3>
                <div className="form-group">
                  <label className="form-label">SEO Title</label>
                  <input type="text" name="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">SEO Description</label>
                  <textarea name="seoDesc" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className="form-control"></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Focus Keywords</label>
                  <CreatableSelect isMulti options={[]} value={focusKeywords} onChange={(selected) => setFocusKeywords(selected)} className="react-select-container" classNamePrefix="react-select" />
                </div>             
                <div className="form-group">
                    <label className="form-label">Canonical URL</label>
                    <div class="web_link_input">
                      <div className="flex w-100">
                        <span class="prefix">https://</span>
                        <input type="text" name="canonicalUrl" value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} className="myinput-link" placeholder="Site.com" />
                      </div>
                    </div>
                  </div> 
                <div className="form-group">
                  <label className="form-label">Meta Robots</label>
                  <input type="text" name="metaRobots" value={metaRobots} onChange={(e) => setMetaRobots(e.target.value)} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Open Graph Title</label>
                  <input type="text" name="openGraphTitle" value={openGraphTitle} onChange={(e) => setOpenGraphTitle(e.target.value)} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Open Graph Description</label>
                  <textarea name="openGraphDescription" value={openGraphDescription} onChange={(e) => setOpenGraphDescription(e.target.value)} className="form-control"></textarea>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }