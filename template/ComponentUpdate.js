

export const generateComponentCode = (modelName, fields) => {
  const capitalizeFirstLetter = (string) =>
    string.charAt(0).toUpperCase() + string.slice(1);
  const ModelName = capitalizeFirstLetter(modelName);

  const generateFieldMarkup = (field) => {
    const { name, datatype, required, enumValues, refModel } = field;
    const capName = capitalizeFirstLetter(name);
    const label = `<label  className="form-label">${name}</label>`;
    const baseClass = 'form-group';

    switch (datatype) {
      case 'textinput':
      case 'stringunique':
        return {
          section: 'basic', code: `
          <div className="${baseClass}">
            ${label}
            <input type="text" name="${name}" value={${name}} onChange={(e) => set${capName}(e.target.value)} className="form-control" required={${required}} />
          </div>` };

      case 'textarea':
        return {
          section: 'basic', code: `
          <div className="${baseClass}">
            ${label}
            <textarea name="${name}" value={${name}} onChange={(e) => set${capName}(e.target.value)} className="form-control" rows="6" required={${required}}></textarea>
          </div>` };

      case 'stringweblink':
        return {
          section: 'basic', code: `
          <div className="${baseClass}">
            ${label}
            <div class="web_link_input">
              <div className="flex w-100">
                <span class="prefix">https://</span>
                <input name="${name}" value={${name}} onChange={(e) => set${capName}(e.target.value)} class="myinput-link" placeholder="Site.com" required={${required}} />
              </div>
            </div>
          </div>` };

      case 'number':
        return {
          section: 'basic', code: `
          <div className="${baseClass}">
            ${label}
            <input type="number" name="${name}" value={${name}} onChange={(e) => set${capName}(e.target.value)} className="form-control" required={${required}} />
          </div>` };

      case 'inputdate':
        return {
          section: 'basic', code: `
          <div className="${baseClass}">
            ${label}
            <input type="datetime-local" name="${name}" value={${name}} onChange={(e) => set${capName}(e.target.value)} className="form-control time-input" onClick={(e) => e.target.showPicker()} required={${required}} />
          </div>` };

      case 'inputemail':
        return {
          section: 'basic', code: `
          <div class="form-group email-input-group">
            ${label}
            <div class="input_group">
              <span class="input_email_icon"><MdOutlineEmail /></span>
              <input type="email"  name="${name}" value={${name}} onChange={(e) => set${capName}(e.target.value)} class="form-control email-input" placeholder="name@example.com" required={${required}} />
              <span class="input-validation"></span>
            </div>
          </div>` };

      case 'password':
        return {
          section: 'basic', code: `
          <div className="${baseClass}">
            ${label}
            <input type="password" name="${name}" value={${name}} onChange={(e) => set${capName}(e.target.value)} className="form-control" required={${required}} />
          </div>` };

      case 'multiimageselect':
        return {
          section: 'advanced', code: `
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
                        src={img.startsWith('http') ? img : window.location.origin + img} 
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
                onClick={() => setShowUploadModal(true)}
              >
                <RiImageAddLine />
                Upload Images
              </button>
              <button 
                type="button" 
                className="media-library-btn"
                onClick={() => setShowMediaLibrary(true)}
              >
                <RiImageAddLine />
                Select from Media
              </button>
            </div>

            {showUploadModal && (
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
                                  set${capName}([...(${name} || []), data.url]);
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
                                    set${capName}([...(${name} || []), data.url]);
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

            {showMediaLibrary && (
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
                              src={image.url} 
                              alt={image.name || 'Media'} 
                              onError={(e) => {
                                console.error('Image failed to load:', image.url);
                                e.target.src = '/placeholder-image.jpg';
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
                          // Remove the origin from URLs before saving
                          const processedUrls = selectedMediaImages.map(url => 
                            url.replace(window.location.origin, '')
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
          </div>` };

      case 'selectmulti':
        if (refModel) {
          return {
            section: 'basic', code: `
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
                </div>` };
        } else {
          const selectOptions = (enumValues || []).map(val => ({ label: val, value: val }));
          return {
            section: 'basic', code: `
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
                </div>` };
        }

      case 'singleselect':
        if (refModel) {
          return {
            section: 'basic', code: `
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
                </div>` };
        } else {
          const selectOneOptions = (enumValues || []).map(val => ({ label: val, value: val }));
          return {
            section: 'basic', code: `
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
                </div>` };
        }

      case 'creatableselectmulti':
        return {
          section: 'basic', code: `
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
          </div>` };

      case 'toggleinput':
        return {
          section: 'advanced', code: `
          <div className="${baseClass}">
            ${label}
            <div className="toggle-container">
              <label className="toggle-switch">
                <input type="checkbox"name="${name}" checked={${name}} onChange={(e) => set${capName}(e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
              <span>Toggle</span>
            </div>
          </div>` };

      case 'markdowneditor':
        return {
          section: 'basic', code: `
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
          </div>` };

      default:
        return '';
    }
  };

  const renderedFields = fields.map(generateFieldMarkup).filter(Boolean);

  const basicFields = renderedFields.filter(f => f.section === 'basic').map(f => f.code).join('\n');
  const advancedFields = renderedFields.filter(f => f.section === 'advanced').map(f => f.code).join('\n');

  const destructuredProps = fields.map(f => {
    const name = f.name;
    const alias = `existing${name.charAt(0).toUpperCase() + name.slice(1)}`;
    return `${name}: ${alias}`;
  }).join(',\n  ');

 
  const generateUseStates = (fields) => {
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  
    return fields.map((field) => {
      const { name, datatype } = field;
      const capitalized = capitalize(name);
      let initialValue = `existing${capitalized} || ''`;
  
      if (datatype === 'selectmulti' || datatype === 'creatableselectmulti') {
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
      } else if (datatype === 'singleselect') {
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
      } else if (datatype === 'inputdate') {
        initialValue = `formatDate(existing${capitalized}) || ''`;
      } else if (datatype === 'toggleinput') {
        initialValue = `existing${capitalized} || false`;
      } else if (datatype === 'multiimageselect') {
        initialValue = `Array.isArray(existing${capitalized}) ? existing${capitalized} : []`;
        return `
  const [${name}, set${capitalized}] = useState(${initialValue});
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
        // Format the images with absolute URLs
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

  // Add effect to handle existing images when media library opens
  useEffect(() => {
    if (showMediaLibrary && ${name}?.length > 0) {
      // Convert existing images to the same format as media images
      const existingImages = ${name}.map(url => ({
        url: url.startsWith('http') ? url : window.location.origin + url
      }));
      setSelectedMediaImages(existingImages.map(img => img.url));
    } else if (showMediaLibrary) {
      setSelectedMediaImages([]); // Reset selection if no existing images
    }
  }, [showMediaLibrary, ${name}]);`;
      }
  
      if ((datatype === 'selectmulti' || datatype === 'singleselect') && field.refModel) {
        return `
  const [${name}, set${capitalized}] = useState(${initialValue});
  const [${name}Options, set${capitalized}Options] = useState([]);`;
      }
  
      return `const [${name}, set${capitalized}] = useState(${initialValue});`;
    }).join('\n');
  };
  
  
  const useStatesCode = generateUseStates(fields);

  const refModelUseEffects = fields
    .filter(f => ['selectmulti', 'singleselect', 'arrayrelation'].includes(f.datatype) && f.refModel)
    .map(field => {
      const name = field.name;
      const capName = name.charAt(0).toUpperCase() + name.slice(1);
      const refModel = field.refModel.toLowerCase();

      return `
useEffect(() => {
  async function fetch${capName}Options() {
    try {
      const response = await axios.get('/api/${refModel}');
      const formattedOptions = response.data.items.map(item => {
       const labelKey = Object.keys(item).find(key => key !== '_id') || '_id';
        return {
          value: item._id,
          label: item[labelKey] || item._id
        };
      });

      set${capName}Options(formattedOptions);

      ${field.datatype === 'selectmulti' || field.datatype === 'arrayrelation'
          ? `set${capName}(formattedOptions.filter(opt => existing${capName}?.includes(opt.value)));`
          : `set${capName}(formattedOptions.find(opt => opt.value === existing${capName}) || null);`
        }

         const selected = existing${capName}?.map(existing => {
          const match = formattedOptions.find(opt => opt.value === (existing._id || existing));

           const labelKey = Object.keys(existing).find(key => key !== '_id') || '_id';
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
    .join('\n');





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

const styles = \`
.selected-images-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.selected-image-item {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.selected-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(255,255,255,0.8);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  color: #333;
  transition: all 0.2s;
}

.remove-image-btn:hover {
  background: rgba(255,0,0,0.8);
  color: white;
}

.image-upload-container {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.file-upload {
  position: relative;
  width: 100%;
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s;
}

.file-upload:hover {
  border-color: #666;
}

.file-upload-input {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
}

.file-upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #666;
}

.file-upload-label svg {
  font-size: 24px;
}

.file-upload-label span {
  font-size: 12px;
  color: #999;
}

.external-link-container {
  display: flex;
  gap: 10px;
  align-items: center;
}

.external-link-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.add-external-btn {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-external-btn:hover {
  background-color: #45a049;
}

.folder-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.folder-selector label {
  font-size: 14px;
  color: #666;
}

.folder-select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
}

.upload-btn {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: background-color 0.3s;
}

.upload-btn:hover {
  background-color: #45a049;
}

.upload-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.upload-modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.upload-modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-modal-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.upload-modal-body {
  padding: 20px;
}

.upload-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
}

.upload-option {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
}

.upload-option h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.media-library-btn {
  padding: 10px 20px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: background-color 0.3s;
}

.media-library-btn:hover {
  background-color: #1976D2;
}

.media-library-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.media-library-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.media-library-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.media-library-body {
  padding: 20px;
}

.media-folder-selector {
  margin-bottom: 20px;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.media-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.media-item:hover {
  border-color: #2196F3;
}

.media-item.selected {
  border-color: #2196F3;
}

.media-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-item-overlay {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px;
  border-radius: 4px;
}

.media-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin: 20px 0;
}

.pagination-btn {
  padding: 8px 16px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.pagination-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.media-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn {
  padding: 8px 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.select-btn {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.no-images-message {
  grid-column: 1 / -1;
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}
\`;

export default function ${ModelName}Form(

{
  _id,
  ${fields.map(f => `${f.name}: existing${f.name.charAt(0).toUpperCase() + f.name.slice(1)}`).join(',\n  ')},
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
 const [focusKeywords, setFocusKeywords] = useState(existingFocusKeywords || []);
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
  ${fields.map(f => {
    const name = f.name;
    const cap = name.charAt(0).toUpperCase() + name.slice(1);
    if (['selectmulti', 'creatableselectmulti'].includes(f.datatype)) {
      return `${name}: existing${cap}
      ? existing${cap}.map(w => ({
          value: w._id || w,
          label: w.name || w.email || w._id || w
        }))
      : []`;
    } else if (f.datatype === 'singleselect') {
      return `${name}: existing${cap} ? { value: existing${cap}, label: existing${cap} } : null`;
    } else if (f.datatype === 'toggleinput') {
      return `${name}: existing${cap} || false`;
    } else {
      return `${name}: existing${cap} || ''`;
    }
  }).join(',\n  ')}
}), []);

useEffect(() => {
  const hasChanges = () => {
    return ${fields.map(f => {
    const name = f.name;
    return `JSON.stringify(${name}) !== JSON.stringify(initialValues.${name})`;
  }).join(' || ')};
  };
  setIsModified(hasChanges());
}, [${fields.map(f => f.name).join(', ')}]);


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
    focusKeywords,
    canonicalUrl,
    metaRobots,
    openGraphTitle,
    openGraphDescription,
  };
  
  ${fields.map(field => {
    const name = field.name;
    const capName = name.charAt(0).toUpperCase() + name.slice(1);
    switch (field.datatype) {
      case 'selectmulti':
      case 'creatableselectmulti':
        return `data.${name} = ${name}.map(option => option.value);`;
      case 'singleselect':
        return `data.${name} = ${name}?.value || "";`;
      case 'toggleinput':
        return `data.${name} = ${name};`;
      case 'password':
        return `if (${name}) {
          data.${name} = ${name};
        }`;
      default:
        return `data.${name} = ${name};`;
    }
  }).join('\n  ')}

  try {
    if (_id) {
    
      await axios.put(\`/api/${modelName.toLowerCase()}\`, { ...data, _id });
      toast.success("${ModelName} updated!");
    } else {
      
      await axios.post(\`/api/${modelName.toLowerCase()}\`, data);
      toast.success("${ModelName} created!");
    }
  } catch (error) {
    console.error("Error saving ${modelName}:", error);
    toast.error("Failed to save ${modelName}.");
  }
}


  return (
    <div className="page_compo_create_update">
      <style jsx global>{styles}</style>
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

              ${advancedFields ? `
              <div className="form-section">
                <h3 className="section-title">Advanced Settings</h3>
                ${advancedFields}
              </div>` : ''}
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
