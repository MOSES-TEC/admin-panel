export const generateComponentCode = (modelName, fields) => {
  const capitalizeFirstLetter = (string) =>
    string.charAt(0).toUpperCase() + string.slice(1);
  const ModelName = capitalizeFirstLetter(modelName);

  const generateFieldMarkup = (field) => {
    const { name, datatype, required, enumValues, refModel } = field;
    const capName = capitalizeFirstLetter(name);
    const label = `<label  className="form-label">${name}</label>`;
    const baseClass = "form-group";

    switch (datatype) {
      case "textinput":
        return {
          section: "basic",
          code: `
          <div className="${baseClass}">
            ${label}
            <input type="text" name="${name}" value={${name}} onChange={(e) => set${capName}(e.target.value)} className="form-control" required={${required}} />
          </div>`,
        };

      case "stringunique":
        return {
          section: "basic",
          code: `
          <div className="${baseClass}">
            ${label}
            <input 
              type="text" 
              name="${name}" 
              value={${name}} 
              onChange={(ev) => {
                const inputValue = ev.target.value;
                const newSlug = inputValue
                  .toLowerCase() // Convert to lowercase
                  .replace(/\\s+/g, '-') // Replace spaces with hyphens
                  .replace(/[:{.,/;]/g, ''); // Remove unwanted special characters
                set${capName}(newSlug);
              }} 
              className="form-control" 
              required={${required}} 
            />
          </div>`,
        };

      case "textarea":
        return {
          section: "basic",
          code: `
          <div className="${baseClass}">
            ${label}
            <textarea name="${name}" value={${name}} onChange={(e) => set${capName}(e.target.value)} className="form-control" rows="6" required={${required}}></textarea>
          </div>`,
        };

      case "stringweblink":
        return {
          section: "basic",
          code: `
          <div className="${baseClass}">
            ${label}
            <div class="web_link_input">
              <div className="flex w-100">
                <span class="prefix">https://</span>
                <input name="${name}" value={${name}} onChange={(e) => set${capName}(e.target.value)} class="myinput-link" placeholder="Site.com" required={${required}} />
              </div>
            </div>
          </div>`,
        };

      case "number":
        return {
          section: "basic",
          code: `
          <div className="${baseClass}">
            ${label}
            <input type="number" name="${name}" value={${name}} onChange={(e) => set${capName}(e.target.value)} className="form-control" required={${required}} />
          </div>`,
        };

      case "inputdate":
        return {
          section: "basic",
          code: `
          <div className="${baseClass}">
            ${label}
            <input type="datetime-local" name="${name}" value={${name}} onChange={(e) => set${capName}(e.target.value)} className="form-control time-input" onClick={(e) => e.target.showPicker()} required={${required}} />
          </div>`,
        };

      case "inputemail":
        return {
          section: "basic",
          code: `
          <div class="form-group email-input-group">
            ${label}
            <div class="input_group">
              <span class="input_email_icon"><MdOutlineEmail /></span>
              <input type="email"  name="${name}" value={${name}} onChange={(e) => set${capName}(e.target.value)} class="form-control email-input" placeholder="name@example.com" required={${required}} />
              <span class="input-validation"></span>
            </div>
          </div>`,
        };

      case "password":
        return {
          section: "basic",
          code: `
          <div className="${baseClass}">
            ${label}
            <input type="password" name="${name}" value={${name}} onChange={(e) => set${capName}(e.target.value)} className="form-control" required={${required}} />
          </div>`,
        };

      case "multiimageselect":
        return {
          section: "advanced",
          code: `
<div class="${baseClass}">
  ${label}
  <div className="selected-images-container">
    <ReactSortable
      list={${name}}
      setList={set${capName}}
       className="selected-images-container"
           >
         {${name}?.map((img, index) => (
           <div key={index} className="selected-image-item">
              <img 
              src={\`\${window.location.origin}/api/media-serve/\${img}\`} 
               alt="Selected" 
              
                  />
             <button 
              type="button" 
              className="remove-image-btn"
              onClick={() => {
              const newImages = [...${name}];
             newImages.splice(index, 1);
              set${capName}(newImages);
             }}
            >
    ×
  </button>
</div>
))}
</ReactSortable>
  </div>
  <div className="button-group">
    <button 
      type="button" 
      className="upload-btn"
      onClick={() => {
        setCurrentImageField('${name}');
        setShowUploadModal(true);
      }}
    >
      <RiImageAddLine />
      Upload Images
    </button>
    <button 
      type="button" 
      className="media-library-btn"
      onClick={() => {
        setCurrentImageField('${name}');
        setShowMediaLibrary(true);
      }}
    >
      <RiImageAddLine />
      Select from Media
    </button>
  </div>

  {showUploadModal && currentImageField === '${name}' && (
    <div className="upload-modal">
      <div className="upload-modal-content">
        <div className="upload-modal-header">
          <h3>Upload Images</h3>
          <button 
            className="close-modal-btn"
            onClick={() => setShowUploadModal(false)}
          >
            ×
          </button>
        </div>
        <div className="upload-modal-body">
          <div className="folder-selector">
            <label>Select Folder:</label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="folder-select"
            >
              {folders?.map(folder => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>
          </div>

          <div className="upload-options">
            <div className="upload-option">
              <h4>Upload from System</h4>
              <div className="file-upload">
                <input 
                  type="file" 
                  id="image-upload-${name}" 
                  className="file-upload-input" 
                  accept="image/*" 
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files);
                    const formData = new FormData();
                    files.forEach(file => formData.append('file', file));
                    formData.append('folder', selectedFolder || 'uploads');
                    
                    try {
                      const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                      });
                      const data = await response.json();
                      if (data.success) {
                        // Store relative path without origin
                        const relativePath = data.url
                        .replace(window.location.origin, '')
                        .replace(/^\\/?media\\//, '');

                        set${capName}([...(${name} || []), relativePath]);
                        setShowUploadModal(false);
                      } else {
                        toast.error(data.message || 'Failed to upload image');
                      }
                    } catch (error) {
                      console.error('Error uploading image:', error);
                      toast.error('Failed to upload image');
                    }
                  }}
                />
                <label htmlFor="image-upload-${name}" className="file-upload-label">
                  <RiImageAddLine />
                  Drag & drop or click to upload
                  <span>Recommended size: 1200×630px</span>
                </label>
              </div>
            </div>

            <div className="upload-option">
              <h4>Upload from URL</h4>
              <div className="external-link-container">
                <input
                  type="text"
                  placeholder="Enter external image URL"
                  className="external-link-input"
                  value={externalImageUrl}
                  onChange={(e) => setExternalImageUrl(e.target.value)}
                />
                <button
                  type="button"
                  className="add-external-btn"
                  onClick={async () => {
                    if (externalImageUrl) {
                      try {
                        const formData = new FormData();
                        formData.append('url', externalImageUrl);
                        formData.append('folder', selectedFolder || 'uploads');
                        
                        const response = await fetch('/api/upload', {
                          method: 'POST',
                          body: formData,
                        });
                        const data = await response.json();
                        
                        if (data.success) {
                          // Store relative path without origin
                          const relativePath = data.url
                          .replace(window.location.origin, '')
                          .replace(/^\\/?media\\//, '');

                          set${capName}([...(${name} || []), relativePath]);
                          setExternalImageUrl('');
                          setShowUploadModal(false);
                        } else {
                          toast.error(data.message || 'Failed to upload image');
                        }
                      } catch (error) {
                        console.error('Error uploading external image:', error);
                        toast.error('Failed to upload image');
                      }
                    }
                  }}
                >
                  Add External Image
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

  {showMediaLibrary && currentImageField === '${name}' && (
    <div className="media-library-modal">
      <div className="media-library-content">
        <div className="media-library-header">
          <h3>Media Library</h3>
          <button 
            className="close-modal-btn"
            onClick={() => setShowMediaLibrary(false)}
          >
            ×
          </button>
        </div>
        <div className="media-library-body">
          <div className="media-folder-selector">
            <label>Select Folder:</label>
            <select
              value={mediaFolder}
              onChange={(e) => {
                setMediaFolder(e.target.value);
                setMediaPage(1);
                fetchMediaImages(e.target.value, 1);
              }}
              className="folder-select"
            >
              {folders?.map(folder => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>
          </div>

          <div className="media-grid">
            {mediaImages.length > 0 ? (
              mediaImages.map((image, index) => (
                <div 
                  key={index} 
                  className={\`media-item \${selectedMediaImages.includes(image.url) ? 'selected' : ''}\`}
                  onClick={() => {
                    if (selectedMediaImages.includes(image.url)) {
                      setSelectedMediaImages(selectedMediaImages.filter(url => url !== image.url));
                    } else {
                      setSelectedMediaImages([...selectedMediaImages, image.url]);
                    }
                  }}
                >
                  <img 
                    src={image.url.startsWith('http') ? image.url : \`/api/media-serve/\`}
                    alt={image.name || 'Media'} 
                    onError={(e) => {
                      console.error('Image failed to load:', image.url);
                      // Fallback to direct path if API route fails
                      if (!e.target.src.includes('/api/media-serve/')) {
                        e.target.src = image.url.startsWith('http') ? image.url : image.url;
                      } else {
                        e.target.src = '/placeholder-image.jpg';
                      }
                      e.target.onerror = null;
                    }}
                  />
                  <div className="media-item-overlay">
                    <input 
                      type="checkbox" 
                      checked={selectedMediaImages.includes(image.url)}
                      onChange={() => {}}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="no-images-message">
                No images found in this folder
              </div>
            )}
          </div>

          <div className="media-pagination">
            <button 
              className="pagination-btn"
              onClick={() => {
                if (mediaPage > 1) {
                  setMediaPage(mediaPage - 1);
                  fetchMediaImages(mediaFolder, mediaPage - 1);
                }
              }}
              disabled={mediaPage === 1}
            >
              Previous
            </button>
            <span>Page {mediaPage}</span>
            <button 
              className="pagination-btn"
              onClick={() => {
                setMediaPage(mediaPage + 1);
                fetchMediaImages(mediaFolder, mediaPage + 1);
              }}
              disabled={!hasMoreMedia}
            >
              Next
            </button>
          </div>

          <div className="media-actions">
            <button 
              className="cancel-btn"
              onClick={() => {
                setShowMediaLibrary(false);
                setSelectedMediaImages([]);
              }}
            >
              Cancel
            </button>
            <button 
              className="select-btn"
              onClick={() => {
                // Store relative paths without origin
                const processedUrls = selectedMediaImages.map(url =>
                    url.replace(window.location.origin, '').replace(/^\\/?media\\//, '')
                  );

                set${capName}([...new Set([...(${name} || []), ...processedUrls])]);
                setShowMediaLibrary(false);
                setSelectedMediaImages([]);
              }}
            >
              Select Images
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
</div>`,
        };

      case "selectmulti":
        if (refModel) {
          return {
            section: "basic",
            code: `
                <div className="${baseClass}">
                  ${label}
                  <Select
                    name="${name}"
                    isMulti
                    value={${name}}
                    onChange={(selected) => set${capName}(selected)}
                    options={${name}Options}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Select ${refModel}"
                  />
                </div>`,
          };
        } else {
          const selectOptions = (enumValues || []).map((val) => ({
            label: val,
            value: val,
          }));
          return {
            section: "basic",
            code: `
                <div className="${baseClass}">
                  ${label}
                  <Select
                    name="${name}"
                    isMulti
                    value={${name}}
                    onChange={(selected) => set${capName}(selected)}
                    options={${JSON.stringify(selectOptions, null, 2)}}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Select options"
                  />
                </div>`,
          };
        }

      case "singleselect":
        if (refModel) {
          return {
            section: "basic",
            code: `
                <div className="${baseClass}">
                  ${label}
                  <Select
                    name="${name}"
                    value={${name}}
                    onChange={(selected) => set${capName}(selected)}
                    options={${name}Options}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Select ${refModel}"
                  />
                </div>`,
          };
        } else {
          const selectOneOptions = (enumValues || []).map((val) => ({
            label: val,
            value: val,
          }));
          return {
            section: "basic",
            code: `
                <div className="${baseClass}">
                  ${label}
                  <Select
                    name="${name}"
                    value={${name}}
                    onChange={(selected) => set${capName}(selected)}
                    options={${JSON.stringify(selectOneOptions, null, 2)}}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    placeholder="Select options"
                  />
                </div>`,
          };
        }

      case "creatableselectmulti":
        return {
          section: "basic",
          code: `
          <div className="${baseClass}">
            ${label}
            <CreatableSelect
              name="${name}"
              isMulti
              value={${name}}
              onChange={(selected) => set${capName}(selected)}
              options={[]}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Add options"
            />
          </div>`,
        };

      case "toggleinput":
        return {
          section: "advanced",
          code: `
          <div className="${baseClass}">
            ${label}
            <div className="toggle-container">
              <label className="toggle-switch">
                <input type="checkbox"name="${name}" checked={${name}} onChange={(e) => set${capName}(e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
              <span>Toggle</span>
            </div>
          </div>`,
        };

      case "markdowneditor":
        return {
          section: "basic",
          code: `
          <div className="${baseClass}">
            ${label}
           <MarkdownEditor
                                value={${name}}
                                onChange={(ev) => set${capName}(ev.text)}
                                style={{ width: '100%', height: '400px' }} // You can adjust the height as needed
                                renderHTML={(text) => (
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]} // Add remark-gfm to support tables
                                        components={{
                                            code: ({ node, inline, className, children, ...props }) => {
                                                const match = /language-(\w+)/.exec(className || '');
                                                if (inline) {
                                                    return <code>{children}</code>;
                                                } else if (match) {
                                                    return (
                                                        <div style={{ position: 'relative' }}>
                                                            <pre style={{ padding: '0', borderRadius: '5px', overflowX: 'auto', whiteSpace: 'pre-wrap' }} {...props}>
                                                                <code>{children}</code>
                                                            </pre>
                                                            <button
                                                                style={{ position: 'absolute', top: '0', right: '0', zIndex: '1' }}
                                                                onClick={() => navigator.clipboard.writeText(children)}
                                                            >
                                                                Copy code
                                                            </button>
                                                        </div>
                                                    );
                                                } else {
                                                    return <code {...props}>{children}</code>;
                                                }
                                            },  
                                        }}
                                    >
                                        {text}
                                    </ReactMarkdown>
                                )}
                            />
          </div>`,
        };

      default:
        return "";
    }
  };

  const renderedFields = fields.map(generateFieldMarkup).filter(Boolean);

  const basicFields = renderedFields
    .filter((f) => f.section === "basic")
    .map((f) => f.code)
    .join("\n");
  const advancedFields = renderedFields
    .filter((f) => f.section === "advanced")
    .map((f) => f.code)
    .join("\n");

  // desc props
  const destructuredProps = fields
    .map((f) => {
      const name = f.name;
      const alias = `existing${name.charAt(0).toUpperCase() + name.slice(1)}`;
      return `${name}: ${alias}`;
    })
    .join(",\n  ");

  const generateUseStates = (fields) => {
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    // Step 1: Create field state declarations first
    const fieldStates = fields
      .map((field) => {
        const { name, datatype } = field;
        const capitalized = capitalize(name);
        let initialValue = `existing${capitalized} || ''`;

        if (datatype === "selectmulti" || datatype === "creatableselectmulti") {
          initialValue = `existing${capitalized} 
  ? existing${capitalized}.map(w => {
      if (typeof w === 'object') {
        const labelKey = Object.keys(w).find(k => k !== '_id') || '_id';
        return {
          value: w._id || w,
          label: w[labelKey] || w._id || w
        };
      }
      return { value: w, label: w };
    }) : []`;
        } else if (datatype === "singleselect") {
          initialValue = `existing${capitalized} 
  ? (() => {
      const w = existing${capitalized};
      if (typeof w === 'object') {
        const labelKey = Object.keys(w).find(k => k !== '_id') || '_id';
        return {
          value: w._id || w,
          label: w[labelKey] || w._id || w
        };
      }
      return { value: w, label: w };
    })() : null`;
        } else if (datatype === "inputdate") {
          initialValue = `formatDate(existing${capitalized}) || ''`;
        } else if (datatype === "toggleinput") {
          initialValue = `existing${capitalized} || false`;
        } else if (datatype === "multiimageselect") {
          initialValue = `Array.isArray(existing${capitalized}) ? existing${capitalized} : []`;
        }

        if (
          (datatype === "selectmulti" || datatype === "singleselect") &&
          field.refModel
        ) {
          return `
const [${name}, set${capitalized}] = useState(${initialValue});
const [${name}Options, set${capitalized}Options] = useState([]);`;
        }

        return `const [${name}, set${capitalized}] = useState(${initialValue});`;
      })
      .join("\n");

    // Step 2: Then append shared image-related states and effects
    const hasMultiImageSelect = fields.some(
      (field) => field.datatype === "multiimageselect"
    );
    let sharedImageStates = "";

    if (hasMultiImageSelect) {
      sharedImageStates = `

const [externalImageUrl, setExternalImageUrl] = useState('');
const [selectedFolder, setSelectedFolder] = useState('uploads');
const [folders, setFolders] = useState([]);
const [showUploadModal, setShowUploadModal] = useState(false);
const [showMediaLibrary, setShowMediaLibrary] = useState(false);
const [mediaImages, setMediaImages] = useState([]);
const [selectedMediaImages, setSelectedMediaImages] = useState([]);
const [mediaFolder, setMediaFolder] = useState('uploads');
const [mediaPage, setMediaPage] = useState(1);
const [hasMoreMedia, setHasMoreMedia] = useState(true);
const [currentImageField, setCurrentImageField] = useState('');

useEffect(() => {
  async function fetchFolders() {
    try {
      const response = await fetch('/api/folders');
      const data = await response.json();
      setFolders(data.folders || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  }
  fetchFolders();
}, []);

const fetchMediaImages = async (folder, page) => {
  try {
    const response = await fetch(\`/api/media/list?folder=\${folder}&page=\${page}&limit=12\`);
    const data = await response.json();
    if (data.success) {
      const formattedImages = data.images.map(img => ({
        ...img,
        url: img.url.startsWith('http') ? img.url : window.location.origin + img.url
      }));
      setMediaImages(formattedImages);
      setHasMoreMedia(data.page < data.totalPages);
    } else {
      toast.error(data.message || 'Failed to fetch images');
    }
  } catch (error) {
    console.error('Error fetching media images:', error);
    toast.error('Failed to fetch media images');
  }
};

useEffect(() => {
  if (showMediaLibrary) {
    fetchMediaImages(mediaFolder, mediaPage);
  }
}, [showMediaLibrary, mediaFolder, mediaPage]);

useEffect(() => {
  if (showMediaLibrary && currentImageField) {
    const fieldSetterMap = {
      ${fields
        .filter((f) => f.datatype === "multiimageselect")
        .map((f) => `'${f.name}': ${f.name}`)
        .join(",\n      ")}
    };
    
    const currentImages = fieldSetterMap[currentImageField];
    if (currentImages?.length > 0) {
      const existingImages = currentImages.map(url => ({
        url: url.startsWith('http') ? url : window.location.origin + url
      }));
      setSelectedMediaImages(existingImages.map(img => img.url));
    } else {
      setSelectedMediaImages([]);
    }
  }
}, [showMediaLibrary, currentImageField, ${fields
        .filter((f) => f.datatype === "multiimageselect")
        .map((f) => f.name)
        .join(", ")}]);
`;
    }

    // Return with proper order
    return fieldStates + "\n\n" + sharedImageStates;
  };

  const useStatesCode = generateUseStates(fields);

  const refModelUseEffects = fields
    .filter(
      (f) =>
        ["selectmulti", "singleselect", "arrayrelation"].includes(f.datatype) &&
        f.refModel
    )
    .map((field) => {
      const name = field.name;
      const capName = name.charAt(0).toUpperCase() + name.slice(1);
      const refModel = field.refModel.toLowerCase();

      return `
useEffect(() => {
  async function fetch${capName}Options() {
    try {
      const response = await axios.get('/api/${refModel}');
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

      set${capName}Options(formattedOptions);

      ${
        field.datatype === "selectmulti" || field.datatype === "arrayrelation"
          ? `set${capName}(formattedOptions.filter(opt => existing${capName}?.includes(opt.value)));`
          : `set${capName}(formattedOptions.find(opt => opt.value === existing${capName}) || null);`
      }

         const selected = existing${capName}?.map(existing => {
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

        set${capName}(selected || []);
    } catch (error) {
      console.error('Error fetching ${name} options:', error);
    }
  }

  fetch${capName}Options();
}, [existing${capName}]);`;
    })
    .join("\n");

  return `
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



export default function ${ModelName}Form(

{
  _id,
  ${fields
    .map(
      (f) =>
        `${f.name}: existing${f.name.charAt(0).toUpperCase() + f.name.slice(1)}`
    )
    .join(",\n  ")},
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



 ${useStatesCode}
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
  ${fields
    .map((f) => {
      const name = f.name;
      const cap = name.charAt(0).toUpperCase() + name.slice(1);
      if (["selectmulti", "creatableselectmulti"].includes(f.datatype)) {
        return `${name}: existing${cap}
      ? existing${cap}.map(w => ({
          value: w._id || w,
          label: w.name || w.email || w._id || w
        }))
      : []`;
      } else if (f.datatype === "singleselect") {
        return `${name}: existing${cap} ? { value: existing${cap}, label: existing${cap} } : null`;
      } else if (f.datatype === "toggleinput") {
        return `${name}: existing${cap} || false`;
      } else {
        return `${name}: existing${cap} || ''`;
      }
    })
    .join(",\n  ")}
}), []);

useEffect(() => {
  const hasChanges = () => {
    return ${fields
      .map((f) => {
        const name = f.name;
        return `JSON.stringify(${name}) !== JSON.stringify(initialValues.${name})`;
      })
      .join(" || ")} ||
    seoTitle !== existingSeoTitle ||
    seoDescription !== existingSeoDescription ||
    JSON.stringify(focusKeywords) !== JSON.stringify(existingFocusKeywords) ||
    canonicalUrl !== existingCanonicalUrl ||
    metaRobots !== existingMetaRobots ||
    openGraphTitle !== existingOpenGraphTitle ||
    openGraphDescription !== existingOpenGraphDescription;
  };
  setIsModified(hasChanges());
}, [${fields
    .map((f) => f.name)
    .join(
      ", "
    )}, seoTitle, seoDescription, focusKeywords, canonicalUrl, metaRobots, openGraphTitle, openGraphDescription]);


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

   ${refModelUseEffects}

  

  async function create${ModelName}(ev) {
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
  
  ${fields
    .map((field) => {
      const name = field.name;
      const capName = name.charAt(0).toUpperCase() + name.slice(1);
      switch (field.datatype) {
        case "selectmulti":
        case "creatableselectmulti":
          return `data.${name} = ${name}.map(option => option.value);`;
        case "singleselect":
          return `data.${name} = ${name}?.value || "";`;
        case "toggleinput":
          return `data.${name} = ${name};`;
        case "password":
          return `if (${name}) {
          data.${name} = ${name};
        }`;
        default:
          return `data.${name} = ${name};`;
      }
    })
    .join("\n  ")}

  try {
    if (_id) {
      try{
      await axios.put(\`/api/${modelName.toLowerCase()}\`, { ...data, _id });
      toast.success("${ModelName} updated!");
      }catch(error){
        if(error.response.status === 403){
          toast.error("Permission denied to Demo User.");
        }
      }
    } else {
     try{
      
      await axios.post(\`/api/${modelName.toLowerCase()}\`, data);
      toast.success("${ModelName} created!");
      
     }catch(error){
      if(error.response.status === 403){
        toast.error("Permission denied to Demo User.");
      }
     }
    }
  } catch (error) {
    console.error("Error saving ${modelName}:", error);
    toast.error("Failed to save ${modelName}.");
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
                  <Link href={\`/manager/\${model.name}/\`}>{model.name}</Link>
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
            Create a ${ModelName}
            <span>Craft. Publish. Shine. Repeat. Win.</span>
          </div>
           <button className="publish-btn" type="submit" onClick={() => formRef.current?.requestSubmit()} disabled={!isModified}>
  <LuSave />
  {isModified ? "Save Now" : "No Changes"}
</button>
        </div>

        <div className="tab-buttons">
          <button className={\`tab-button \${activeTab === 'content' ? 'active' : ''}\`} onClick={() => setActiveTab('content')}>Content</button>
          <button className={\`tab-button \${activeTab === 'seo' ? 'active' : ''}\`} onClick={() => setActiveTab('seo')}>SEO</button>
        </div>

        <form className="form-container" ref={formRef} onSubmit={create${ModelName}}>
          {activeTab === 'content' ? (
          <>
              <div className="form-section">
                <h3 className="section-title">Content Details</h3>
                ${basicFields}
              </div>

              ${
                advancedFields
                  ? `
                <div className="form-section">
                  <h3 className="section-title">Advanced Settings</h3>
                  ${advancedFields}
                </div>`
                  : ""
              }
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
`.trim();
};
