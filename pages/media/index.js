"use client"


import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FaPlus, FaLink, FaCrop, FaEdit, FaTrash, FaPencilAlt } from "react-icons/fa";
import { MdDelete, MdFileDownload, MdClose, MdCheck, MdContentCopy, MdSave, MdFolderOpen } from "react-icons/md";
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { toast } from "react-toastify";
import axios from "axios";

// Improved image upload function that saves to the public directory
export const uploadImage = async (file, folder = "Local") => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    let response;
    try {
      response = await axios.post('/api/upload', formData);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        toast.error("Permission denied to Demo User.");
      } else {
        toast.error("Failed to upload image.");
        console.error("Upload error:", error);
      }
      return { success: false, error: error.message };
    }

    const result = response?.data;

    if (result?.success) {
      const dimensions = await getImageDimensions(file);
      // Store the path and filename separately to ensure we can construct the correct URL in any environment
      const url = result.url;
      const fileName = url.split('/').pop();
      return {
        success: true,
        url: url,
        path: result.url,
        fileName: fileName,
        name: fileName,
        size: file.size,
        dimensions,
        date: result.createdDate,
        folder
      };
    }

    return { success: false, error: "Upload failed on server." };
  } catch (error) {
    console.error("Unexpected error uploading image:", error);
    return { success: false, error: error.message };
  }
};


// Helper function to get image dimensions
const getImageDimensions = (file) => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.src = URL.createObjectURL(file);
  });
};

// Utility function to clean URL and extract filename
const cleanUrlAndGetFilename = (url) => {
  try {
    // Remove query parameters and hash
    const cleanUrl = url.split('?')[0].split('#')[0];
    // Extract filename from the clean URL
    const filename = cleanUrl.split('/').pop();
    // If no filename found, generate a random one
    return filename || `image-${Date.now()}.jpg`;
  } catch (error) {
    console.error("Error cleaning URL:", error);
    return `image-${Date.now()}.jpg`;
  }
};

// Helper function to get correct image path
const getImageUrl = (url) => {
  if (!url) return '';
  
  // Debugging
  console.log(`Processing image URL: ${url}`);
  
  // Handle both relative and absolute paths
  if (url.startsWith('http')) return url;
  
  // Ensure the URL has a leading slash
  const urlWithSlash = url.startsWith('/') ? url : `/${url}`;
  
  // In production, we may need to use our custom API endpoint
  if (process.env.NODE_ENV === 'production') {
    // Convert /media/folder/file.jpg to /api/media-serve/folder/file.jpg
    if (urlWithSlash.startsWith('/media/')) {
      const mediaPath = urlWithSlash.replace(/^\/media\//, '');
      const apiUrl = `/api/media-serve/${mediaPath}?v=${Date.now()}`;
      console.log(`Using API fallback URL: ${apiUrl}`);
      return apiUrl;
    }
  }
  
  // Create a versioned URL to avoid caching issues
  const timestamp = new Date().getTime();
  const versionedUrl = `${urlWithSlash}?v=${timestamp}`;
  
  console.log(`Returning URL: ${versionedUrl}`);
  return versionedUrl;
};

export default function Media() {
  // State for folders and media items
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState('');
  const [mediaItems, setMediaItems] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [folderImageCounts, setFolderImageCounts] = useState({});

  // Modal states
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageProperties, setImageProperties] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showLinkCopiedToast, setShowLinkCopiedToast] = useState(false);
  const [externalImageUrl, setExternalImageUrl] = useState('');
  const [showExternalImageInput, setShowExternalImageInput] = useState(false);
  const [imageName, setImageName] = useState('');

  // Confirmation prompt states
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showFolderDeleteConfirmation, setShowFolderDeleteConfirmation] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);

  // Folder edit states
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [originalFolderName, setOriginalFolderName] = useState('');

  // Refs
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch media items with pagination
  const fetchMediaItems = async (folder, page = 1) => {
    if (!folder) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/media?folder=${folder}&page=${page}&limit=${itemsPerPage}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Folder doesn't exist on disk yet - set empty array
          console.warn(`Media folder "${folder}" not found`);
          setMediaItems(prevState => ({
            ...prevState,
            [folder]: []
          }));
          setFolderImageCounts(prev => ({
            ...prev,
            [folder]: 0
          }));
          setCurrentPage(1);
          setIsLoading(false);
          return;
        }
        throw new Error(`Failed to fetch media items: ${response.statusText}`);
      }
      
      const data = await response.json();

      // Format items to ensure URLs are properly structured
      const formattedItems = data.items.map(item => ({
        ...item,
        url: item.url?.startsWith('/') ? item.url : `/${item.url}`,
        path: item.path || item.url
      }));

      setMediaItems(prevState => ({
        ...prevState,
        [folder]: formattedItems
      }));

      // Update folder image counts with the total count from the API
      setFolderImageCounts(prev => ({
        ...prev,
        [folder]: data.totalCount || 0
      }));

      // Update current page
      setCurrentPage(data.currentPage);

      setIsLoading(false);
    } catch (error) {
      console.error(`Error fetching media from ${folder}:`, error);
      // Initialize with empty array on error to avoid undefined
      setMediaItems(prevState => ({
        ...prevState,
        [folder]: []
      }));
      setIsLoading(false);
    }
  };

  // Fetch folders when component mounts
  const fetchFolders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/folders');
      if (!response.ok) {
        throw new Error(`Failed to fetch folders: ${response.statusText}`);
      }
      const data = await response.json();
      setFolders(data.folders);

      if (data.folders.length > 0) {
        setActiveFolder(data.folders[0]);
        fetchMediaItems(data.folders[0], 1);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching folders:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {

    fetchFolders();
  }, []);

  // Pagination Controls Component
  const PaginationControls = ({ folder }) => {
    const totalPages = Math.ceil((folderImageCounts[folder] || 0) / itemsPerPage);
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;

    return (
      <div className="pagination-controls">
        <button
          onClick={() => {
            if (hasPreviousPage) {
              fetchMediaItems(folder, currentPage - 1);
            }
          }}
          disabled={!hasPreviousPage}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => {
            if (hasNextPage) {
              fetchMediaItems(folder, currentPage + 1);
            }
          }}
          disabled={!hasNextPage}
        >
          Next
        </button>
      </div>
    );
  };

  // Handle creating a new folder
  const handleCreateFolder = async () => {
    if (newFolderName && !folders.includes(newFolderName)) {
      try {
        const response = await fetch('/api/folders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ folderName: newFolderName }),
        });

        if (!response.ok) {
          toast.error("Permission denied to Demo User.");
        }

        const data = await response.json();

        if (data.success) {
          setFolders([...folders, newFolderName]);
          setMediaItems({
            ...mediaItems,
            [newFolderName]: []
          });
          setShowFolderModal(false);
          setNewFolderName('');
        }
      } catch (error) {
        console.error("Error creating folder:", error);
        alert(`Error creating folder: ${error.message}`);
      }
    }
  };

  // Handle delete folder confirmation
  const confirmFolderDelete = (folderName) => {
    setFolderToDelete(folderName);
    setShowFolderDeleteConfirmation(true);
  };

  // Handle actual folder deletion
  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;

    try {
      const response = await fetch('/api/folders', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderName: folderToDelete }),
      });

      if (!response.ok) {
        toast.error("Permission denied to Demo User.");
      }

      const data = await response.json();

      if (data.success) {
        const updatedFolders = folders.filter(folder => folder !== folderToDelete);
        setFolders(updatedFolders);

        // Remove folder from media items state
        const updatedMediaItems = { ...mediaItems };
        delete updatedMediaItems[folderToDelete];
        setMediaItems(updatedMediaItems);

        // Set new active folder if deleted was active
        if (activeFolder === folderToDelete && updatedFolders.length > 0) {
          setActiveFolder(updatedFolders[0]);
          setSelectedFolder(updatedFolders[0]);
        }

        setShowFolderDeleteConfirmation(false);
        setFolderToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      alert(`Error deleting folder: ${error.message}`);
    }
  };

  // Handle folder rename/edit
  const openEditFolder = (folderName) => {
    setOriginalFolderName(folderName);
    setEditingFolderName(folderName);
    setShowEditFolderModal(true);
  };

  // Save edited folder name
  const handleSaveFolderEdit = async () => {
    if (editingFolderName && originalFolderName && editingFolderName !== originalFolderName) {
      try {
        const response = await fetch('/api/folders', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oldName: originalFolderName,
            newName: editingFolderName
          }),
        });

        if (!response.ok) {
          // throw new Error(`Failed to rename folder: ${response.statusText}`);
          alert("Folder name already exists. Please choose a different name.");
        }

        const data = await response.json();

        if (data.success) {
          setFolders(folders.map(folder => folder === originalFolderName ? editingFolderName : folder));

          // Update media items state
          const folderMediaItems = mediaItems[originalFolderName] || [];
          const updatedMediaItems = { ...mediaItems };
          delete updatedMediaItems[originalFolderName];
          updatedMediaItems[editingFolderName] = folderMediaItems;
          setMediaItems(updatedMediaItems);

          // Update active folder if it was renamed
          if (activeFolder === originalFolderName) {
            setActiveFolder(editingFolderName);
          }

          // Update selected folder if it was renamed
          if (selectedFolder === originalFolderName) {
            setSelectedFolder(editingFolderName);
          }

          setShowEditFolderModal(false);
          setOriginalFolderName('');
          setEditingFolderName('');
        } else {
          throw new Error(data.error || "Failed to rename folder");
        }
      } catch (error) {
        console.error("Error renaming folder:", error);
        alert(`Error renaming folder: ${error.message}`);
      }
    }
  };

  // Handle file selection
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImageName(file.name.split('.')[0]); // Set initial name without extension
      setPreviewUrl(URL.createObjectURL(file));

      const dimensions = await getImageDimensions(file);
      setImageProperties({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        dimensions: `${dimensions.width}x${dimensions.height}`,
        type: file.type
      });
    }
  };

  // Handle external image URL change
  const handleExternalImageUrlChange = async (e) => {
    const url = e.target.value;
    setExternalImageUrl(url);

    if (url) {
      try {
        // Fetch the image through our API endpoint
        const response = await fetch('/api/fetch-external-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl: url }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch external image");
        }

        // Convert base64 to blob for preview
        const byteCharacters = atob(data.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: data.contentType });

        // Create a temporary image to get dimensions
        const img = new Image();
        img.onload = () => {
          const fileName = cleanUrlAndGetFilename(url);
          setImageName(fileName.split('.')[0]); // Set initial name without extension
          setImageProperties({
            name: fileName,
            size: `${(byteArray.length / (1024 * 1024)).toFixed(1)} MB`,
            dimensions: `${img.width}x${img.height}`,
            type: data.contentType
          });
          const blobUrl = URL.createObjectURL(blob);
          setPreviewUrl(blobUrl);

          // Create a File object for cropping
          const file = new File([blob], fileName, { type: data.contentType });
          setSelectedFile(file);
        };
        img.src = URL.createObjectURL(blob);
      } catch (error) {
        console.error("Error loading external image:", error);
        toast.error("Failed to load external image. Please check the URL and try again.");
      }
    }
  };

  // Handle crop button click for external image
  const handleExternalCropClick = () => {
    if (externalImageUrl) {
      setShowCropModal(true);
    }
  };

  // Handle image upload
  const handleUpload = async () => {
    if (selectedFile) {
      try {
        let fileToUpload = selectedFile;
        if (showCropModal && completedCrop) {
          // Process cropped image
          const canvas = previewCanvasRef.current;
          const croppedBlob = await getCroppedImg(canvas);
          fileToUpload = new File([croppedBlob], `${imageName}.${selectedFile.name.split('.').pop()}`, { type: selectedFile.type });
        } else if (imageName !== selectedFile.name.split('.')[0]) {
          // Rename file if name was changed
          fileToUpload = new File([selectedFile], `${imageName}.${selectedFile.name.split('.').pop()}`, { type: selectedFile.type });
        }

        const result = await uploadImage(fileToUpload, selectedFolder);
        if (result.success) {
          fetchMediaItems(selectedFolder)
          addMediaItem(result, selectedFolder);
          resetUploadState();
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Permission denied to Demo User.");
      }
    }
  };

  // Handle external image upload
  const handleExternalImageUpload = async () => {
    if (externalImageUrl && selectedFolder) {
      try {
        let fileToUpload = selectedFile;

        if (showCropModal && completedCrop) {
          const canvas = previewCanvasRef.current;
          const croppedBlob = await getCroppedImg(canvas);
          fileToUpload = new File(
            [croppedBlob],
            `${imageName}.${selectedFile.name.split('.').pop()}`,
            { type: selectedFile.type }
          );
        }

        const result = await uploadImage(fileToUpload, selectedFolder);

        if (result.success) {
          fetchMediaItems(selectedFolder);
          addMediaItem(result, selectedFolder);
          resetUploadState();
          setExternalImageUrl('');
          setShowExternalImageInput(false);
          toast.success("External image uploaded successfully!");
        }
      } catch (error) {
        const errorMessage = error?.message || "Unexpected error during upload.";
        toast.error(`Failed to upload external image: ${errorMessage}`);
      }
    } else {
      toast.error("Image URL and folder must be provided.");
    }
  };


  // Add media item to state
  const addMediaItem = (item, folder) => {
    // Ensure the item has all required fields properly set
    const enhancedItem = {
      ...item,
      // Make sure we have the URL with the correct path structure
      url: item.url.startsWith('/') ? item.url : `/${item.url}`,
      path: item.path || item.url,
      name: item.name || item.fileName || (item.url && item.url.split('/').pop()) || 'Untitled',
    };
    
    setMediaItems(prev => ({
      ...prev,
      [folder]: [...(prev[folder] || []), enhancedItem]
    }));
  };

  // Reset upload related states
  const resetUploadState = () => {
    setShowUploadModal(false);
    setShowCropModal(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setImageProperties(null);
    setCrop(undefined);
    setCompletedCrop(null);
    setExternalImageUrl('');
    setShowExternalImageInput(false);
    setImageName('');
  };

  // Show confirmation before deleting image
  const confirmDeleteImage = (item) => {
    setItemToDelete(item);
    setShowDeleteConfirmation(true);
  };

  // Handle delete image after confirmation
  const handleDeleteImage = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch('/api/media', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: itemToDelete.path,
          folder: activeFolder
        }),
      });

      if (!response.ok) {
        toast.error("Permission denied to Demo User.");
      }

      const data = await response.json();

      if (data.success) {
        setMediaItems(prev => ({
          ...prev,
          [activeFolder]: prev[activeFolder].filter(item => item.path !== itemToDelete.path)
        }));
        setShowDeleteConfirmation(false);
        setItemToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      alert(`Error deleting image: ${error.message}`);
    }
  };

  // Handle download image
  const handleDownloadImage = (url, filename) => {
    // Use our custom API endpoint for downloading in production
    let downloadUrl = url;
    
    if (process.env.NODE_ENV === 'production') {
      // Convert /media/folder/file.jpg to /api/media-serve/folder/file.jpg
      if (url.startsWith('/media/')) {
        const mediaPath = url.replace(/^\/media\//, '');
        downloadUrl = `/api/media-serve/${mediaPath}`;
        console.log(`Using API download URL: ${downloadUrl}`);
      }
    }
    
    // Add a random query parameter to avoid caching issues
    downloadUrl = `${downloadUrl}${downloadUrl.includes('?') ? '&' : '?'}download=true&t=${Date.now()}`;
    
    // Create a link and click it to trigger download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Handle copy image link
  const handleCopyLink = (path) => {
    // Determine the appropriate URL to copy based on environment
    let fullUrl;

    if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin;
      
      // In production, use the API endpoint to ensure the link works
      if (process.env.NODE_ENV === 'production') {
        // Convert /media/folder/file.jpg to /api/media-serve/folder/file.jpg
        if (path.startsWith('/media/')) {
          const mediaPath = path.replace(/^\/media\//, '');
          const apiPath = `/api/media-serve/${mediaPath}`;
          fullUrl = `${baseUrl}${apiPath}`;
          console.log(`Using API URL for copying: ${fullUrl}`);
        } else {
          fullUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
        }
      } else {
        // In development, use the standard path
        fullUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
      }
    } else {
      // Fallback for SSR context
      fullUrl = path;
    }
    
    // Copy to clipboard and show toast notification
    navigator.clipboard.writeText(fullUrl).then(() => {
      setShowLinkCopiedToast(true);
      setTimeout(() => setShowLinkCopiedToast(false), 2000);
    });
  };


  // Handle edit image
  const handleEditImage = (item) => {
    // Before setting the editing image, ensure the URL is correct for the environment
    let previewUrl = item?.url || '';
    
    // In production, consider using the API URL for reliable preview
    if (process.env.NODE_ENV === 'production') {
      if (previewUrl.startsWith('/media/')) {
        const mediaPath = previewUrl.replace(/^\/media\//, '');
        previewUrl = `/api/media-serve/${mediaPath}?preview=true&t=${Date.now()}`;
        console.log(`Using API preview URL: ${previewUrl}`);
      }
    }
    
    setEditingImage(item);
    setImageName(item?.name ? item.name.split('.')[0] : '');
    setPreviewUrl(previewUrl);
    setSelectedFolder(item?.folder || 'Local');
    setShowEditModal(true);
  };

  // Save edited image
  const handleSaveEdit = async () => {
    let fileToUpload; // 👈 FIXED: Declare at the top

    const originalName = editingImage.name.split('.')[0];
    const nameChanged = imageName !== originalName;
    const folderChanged = selectedFolder !== editingImage.folder;

    if (!editingImage || !editingImage.name) {
      console.error("No image selected for editing");
      alert("No image selected for editing");
      return;
    }

    if (!selectedFolder) {
      console.error("No folder selected");
      alert("Please select a folder");
      return;
    }

    if (!folderChanged && !completedCrop && !nameChanged) {
      alert("No changes made.");
      return;
    }


    if (!completedCrop && (nameChanged || folderChanged)) {
      const response = await fetch(editingImage.url);
      const blob = await response.blob();
      fileToUpload = new File(
        [blob],
        `${imageName}.${editingImage.name.split('.').pop()}`,
        { type: blob.type }
      );
    }

    try {
      if (completedCrop) {
        const canvas = previewCanvasRef.current;
        const editedBlob = await getCroppedImg(canvas);
        fileToUpload = new File(
          [editedBlob],
          `${imageName}.${editingImage.name.split('.').pop()}`,
          { type: editingImage.url.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg' }
        );
      }

      if (fileToUpload) {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('folder', selectedFolder);
        formData.append('path', editingImage.path);
        formData.append('isEdit', 'true');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          toast.error("Permission denied to Demo User.");
        };

        const result = await response.json();

        if (result.success) {
          setMediaItems(prev => {
            const updatedItems = { ...prev };
            const originalFolder = editingImage.folder;

            // Remove from original folder
            if (updatedItems[originalFolder]) {
              updatedItems[originalFolder] = updatedItems[originalFolder].filter(
                item => item.path !== editingImage.path
              );
            }

            // Add to selected folder
            if (!updatedItems[selectedFolder]) {
              updatedItems[selectedFolder] = [];
            }

            // Make sure URL is properly formatted for production
            const imageUrl = result.url;
            const timestamp = new Date().getTime();

            const newImage = {
              ...editingImage,
              url: imageUrl.startsWith('/') ? `${imageUrl}?v=${timestamp}` : `/${imageUrl}?v=${timestamp}`,
              path: imageUrl,
              name: `${imageName}.${editingImage.name.split('.').pop()}`,
              dimensions: completedCrop
                ? {
                  width: previewCanvasRef.current?.width || editingImage.dimensions.width,
                  height: previewCanvasRef.current?.height || editingImage.dimensions.height
                }
                : editingImage.dimensions,
              date: result.createdDate,
              folder: selectedFolder
            };

            updatedItems[selectedFolder].push(newImage);

            return updatedItems;
          });


          if (folderChanged) {
            toast.success(`Image moved to folder "${selectedFolder}"`);
          }

          setShowEditModal(false);
          setEditingImage(null);
          setCompletedCrop(null);
        } 
      }
    } catch (error) {
      console.error("Error saving edit:", error);
      alert(`Error saving edit: ${error.message}`);
    }
  };


  // Image cropping functions
  const onImageLoad = (e) => {
    imgRef.current = e.currentTarget;

    const { width, height } = e.currentTarget;
    // Make an initial crop in the center of the image
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        16 / 9,
        width,
        height
      ),
      width,
      height
    );

    setCrop(crop);
  };

  // Improved getCroppedImg function with better quality preservation
  const getCroppedImg = async (canvas) => {
    return new Promise((resolve) => {
      // Use higher quality setting and preserve original image format
      const format = editingImage?.url?.toLowerCase().endsWith('.png') ||
        selectedFile?.type === 'image/png' ? 'image/png' : 'image/jpeg';

      // Use higher quality for JPEG, lossless for PNG
      const quality = format === 'image/png' ? 1.0 : 0.95;

      canvas.toBlob((blob) => {
        resolve(blob);
      }, format, quality);
    });
  };

  useEffect(() => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    // Use 2x pixel ratio for better quality
    const pixelRatio = window.devicePixelRatio || 2;

    // Set canvas dimensions to match the cropped area exactly
    canvas.width = Math.round(crop.width * scaleX);
    canvas.height = Math.round(crop.height * scaleY);

    // Set smooth rendering
    ctx.imageSmoothingQuality = 'high';
    ctx.imageSmoothingEnabled = true;

    // Draw the cropped portion of the image
    ctx.drawImage(
      image,
      Math.round(crop.x * scaleX),
      Math.round(crop.y * scaleY),
      Math.round(crop.width * scaleX),
      Math.round(crop.height * scaleY),
      0,
      0,
      Math.round(crop.width * scaleX),
      Math.round(crop.height * scaleY)
    );
  }, [completedCrop]);

  return (
    <>
      <div className="media_library_page">
        {/* Folder List Section */}
        <div className="existing_model_list">
          <h2>Media Library Folders</h2>
          <div className="ex_model_list_ul">
            {isLoading ? (
              <p>Loading folders...</p>
            ) : (
              <>
                <ul>
                  {folders.map((folder) => (
                    <li key={folder}>
                      <Link
                        href="#"
                        className={activeFolder === folder ? "active" : ""}
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveFolder(folder);
                          setCurrentPage(1);
                          fetchMediaItems(folder, 1);
                        }}
                      >
                        {folder}
                        {/* ({folderImageCounts[folder] || 0}) */}
                      </Link>
                    </li>
                  ))}
                </ul>
                <button onClick={() => setShowFolderModal(true)}>+ Create a new folder</button>
              </>
            )}
          </div>
        </div>

        {/* Media Content Display */}
        <div className="media_lirary_p_l_cont">
          <div className="media_li_p_l_title">
            <h1>{activeFolder} Folder</h1>
            <div className="media_li_p_l_btns">
              <button onClick={() => {
                setSelectedFolder(activeFolder);
                setShowUploadModal(true);
              }}>
                <FaPlus /> Upload assets
              </button>
              <button className="rename_folder_btn" onClick={() => openEditFolder(activeFolder)}>
                <FaPencilAlt /> Rename folder
              </button>
              <button
                onClick={() => confirmFolderDelete(activeFolder)}
                className="delete-folder-btn"
              >
                <FaTrash /> Delete folder
              </button>
            </div>
          </div>

          {/* Media Items Grid */}
          <div className="media_li_p_l_list">
            {isLoading ? (
              <p>Loading media items...</p>
            ) : (
              <>
                {mediaItems[activeFolder] && mediaItems[activeFolder].map((item, index) => (
                  <div className="media_li_p_l_list_item" key={index}>
                    <div className="media_li_p_l_list_item_img">
                      <img
                        src={getImageUrl(item.url)}
                        alt={item.name}
                        loading="lazy"
                        onError={(e) => {
                          console.error(`Image load error for: ${item.url}`, {
                            folder: item.folder,
                            name: item.name,
                            path: item.path
                          });
                          
                          // Try different approaches to load the image
                          if (!e.target.dataset.retried) {
                            // First retry: Try direct path
                            e.target.dataset.retried = '1';
                            const directPath = `/media/${item.folder}/${item.name}`;
                            console.log(`Retrying with direct path: ${directPath}`);
                            e.target.src = directPath;
                          } 
                          else if (e.target.dataset.retried === '1') {
                            // Second retry: Try API fallback
                            e.target.dataset.retried = '2';
                            const apiPath = `/api/media-serve/${item.folder}/${item.name}`;
                            console.log(`Retrying with API fallback: ${apiPath}`);
                            e.target.src = apiPath;
                          }
                          else {
                            // Final fallback: Use data URL placeholder
                            console.log(`Using placeholder for: ${item.name}`);
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU1RTUiLz48cGF0aCBkPSJNODAgOTBINzBWMTEwSDgwVjkwWiIgZmlsbD0iIzk5OTk5OSIvPjxwYXRoIGQ9Ik0xMzAgOTBIMTIwVjExMEgxMzBWOTBaIiBmaWxsPSIjOTk5OTk5Ii8+PHBhdGggZD0iTTEwMCAxMzBDMTEzLjgwNyAxMzAgMTI1IDExOC44MDcgMTI1IDEwNUMxMjUgOTEuMTkzIDExMy44MDcgODAgMTAwIDgwQzg2LjE5MyA4MCA3NSA5MS4xOTMgNzUgMTA1Qzc1IDExOC44MDcgODYuMTkzIDEzMCAxMDAgMTMwWiIgZmlsbD0iIzk5OTk5OSIvPjwvc3ZnPg==';
                          }
                        }}
                      />
                      <div className="download_delete_img_btn">
                        <button onClick={() => handleCopyLink(item.url)} title="Copy link">
                          <FaLink />
                        </button>
                        <button onClick={() => handleEditImage(item)} title="Edit">
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDownloadImage(item.url, item.name)} title="Download">
                          <MdFileDownload />
                        </button>
                        <button onClick={() => confirmDeleteImage(item)} title="Delete">
                          <MdDelete />
                        </button>
                      </div>
                    </div>
                    <div className="media_li_p_l_li_info">
                      <h3 title={item?.name || ''}>
                        {item?.name ? (item.name.length > 30 ? item.name.slice(0, 30) + '...' : item.name) : 'Untitled'}
                      </h3>
                      <div className="media_li_p_l_list_item_size">
                        <div>
                          <p>{((item?.size || 0) / (1024 * 1024)).toFixed(1)} MB</p>
                          <p>{item?.dimensions?.width || 0}x{item?.dimensions?.height || 0}</p>
                        </div>
                        <p>{new Date(item?.date || Date.now()).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!mediaItems[activeFolder] || mediaItems[activeFolder].length === 0) && (
                  <div className="empty-folder-message">
                    <p>No media items in this folder. Upload some assets to get started.</p>
                  </div>
                )}

              </>
            )}
          </div>
          {mediaItems[activeFolder] && mediaItems[activeFolder].length > 0 && (
            <PaginationControls folder={activeFolder} />
          )}
        </div>
      </div>

      {/* Create Folder Modal */}
      {showFolderModal && (
        <div className="modal-overlay">
          <div className="modal-content folder-modal">
            <div className="modal-header">
              <h2>Create New Folder</h2>
              <button className="close-btn" onClick={() => setShowFolderModal(false)}>
                <MdClose />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="folderName">Folder Name</label>
                <input
                  type="text"
                  id="folderName"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowFolderModal(false)}>Cancel</button>
              <button className="create-btn" onClick={handleCreateFolder}>Create Folder</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Folder Modal */}
      {showEditFolderModal && (
        <div className="modal-overlay">
          <div className="modal-content folder-modal">
            <div className="modal-header">
              <h2>Rename Folder</h2>
              <button className="close-btn" onClick={() => setShowEditFolderModal(false)}>
                <MdClose />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="editFolderName">New Folder Name</label>
                <input
                  type="text"
                  id="editFolderName"
                  value={editingFolderName}
                  onChange={(e) => setEditingFolderName(e.target.value)}
                  placeholder="Enter new folder name"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowEditFolderModal(false)}>Cancel</button>
              <button className="create-btn" onClick={handleSaveFolderEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Confirmation */}
      {showFolderDeleteConfirmation && (
        <div className="modal-overlay">
          <div className="modal-content confirmation-modal">
            <div className="modal-header">
              <h2>Delete Folder</h2>
              <button className="close-btn" onClick={() => setShowFolderDeleteConfirmation(false)}>
                <MdClose />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the folder "{folderToDelete}"?</p>
              <p className="warning-text">This will permanently delete all images in this folder and cannot be undone!</p>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowFolderDeleteConfirmation(false)}>Cancel</button>
              <button className="delete-btn" onClick={handleDeleteFolder}>Delete Folder</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Image Confirmation */}
      {showDeleteConfirmation && (
        <div className="modal-overlay">
          <div className="modal-content confirmation-modal">
            <div className="modal-header">
              <h2>Delete Image</h2>
              <button className="close-btn" onClick={() => setShowDeleteConfirmation(false)}>
                <MdClose />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete "{itemToDelete?.name}"?</p>
              <p className="warning-text">This action cannot be undone!</p>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowDeleteConfirmation(false)}>Cancel</button>
              <button className="delete-btn" onClick={handleDeleteImage}>Delete Image</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Image Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content upload-modal">
            <div className="modal-header">
              <h2>{selectedFile || externalImageUrl ? "Upload Image" : "Select Image"}</h2>
              <button className="close-btn" onClick={resetUploadState}>
                <MdClose />
              </button>
            </div>
            <div className="modal-body">
              {!selectedFile && !externalImageUrl && !showExternalImageInput ? (
                // File selection view
                <div className="file-upload-container">
                  <div className="upload-options">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <div
                      className="file-drop-area"
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const file = e.dataTransfer.files[0];
                          if (file.type.startsWith('image/')) {
                            fileInputRef.current.files = e.dataTransfer.files;
                            handleFileChange({ target: { files: e.dataTransfer.files } });
                          }
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                    >
                      <FaPlus className="upload-icon" />
                      <p>Click to select an image</p>
                      <span>or drag and drop image here</span>
                    </div>
                    <div className="upload-divider">
                      <span>OR</span>
                    </div>
                    <button
                      className="external-image-btn"
                      onClick={() => setShowExternalImageInput(true)}
                    >
                      <FaLink /> Add External Image
                    </button>
                  </div>
                  <div className="folder-select">
                    <label htmlFor="folderSelect">Select destination folder:</label>
                    <select
                      id="folderSelect"
                      value={selectedFolder}
                      onChange={(e) => setSelectedFolder(e.target.value)}
                    >
                      {folders.map(folder => (
                        <option key={folder} value={folder}>{folder}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : showExternalImageInput ? (
                // External image input view
                <div className="external-image-container">
                  <div className="form-group">
                    <label htmlFor="externalImageUrl">External Image URL</label>
                    <input
                      type="url"
                      id="externalImageUrl"
                      value={externalImageUrl}
                      onChange={handleExternalImageUrlChange}
                      placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                    />
                  </div>
                  {previewUrl && !showCropModal && (
                    <div className="image-preview">
                      <img src={previewUrl} alt="External image preview" />
                    </div>
                  )}
                  {imageProperties && !showCropModal && (
                    <div className="image-properties">
                      <h3>Image Properties</h3>
                      <div className="property-item">
                        <span>Name:</span>
                        <span>{imageProperties.name}</span>
                      </div>
                      <div className="property-item">
                        <span>Size:</span>
                        <span>{imageProperties.size}</span>
                      </div>
                      <div className="property-item">
                        <span>Dimensions:</span>
                        <span>{imageProperties.dimensions}</span>
                      </div>
                      <div className="property-item">
                        <span>Type:</span>
                        <span>{imageProperties.type}</span>
                      </div>
                    </div>
                  )}
                  {showCropModal && (
                    <div className="crop-container">
                      <div className="crop-preview">
                        <ReactCrop
                          crop={crop}
                          onChange={c => setCrop(c)}
                          onComplete={c => setCompletedCrop(c)}
                          aspect={undefined}
                        >
                          <img
                            alt="Crop preview"
                            src={previewUrl}
                            onLoad={onImageLoad}
                            style={{ maxHeight: '400px' }}
                            ref={imgRef}
                          />
                        </ReactCrop>
                      </div>
                      <canvas
                        ref={previewCanvasRef}
                        style={{
                          display: 'none',
                          border: '1px solid black',
                          objectFit: 'contain',
                          width: completedCrop?.width,
                          height: completedCrop?.height,
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                // Image preview and properties view
                <div className="image-preview-container">
                  {!showCropModal ? (
                    <>
                      <div className="image-preview">
                        <img src={previewUrl} alt="Preview" />
                      </div>
                      <div className="image-properties">
                        <h3>Image Properties</h3>
                        <div className="property-item">
                          <span>Name:</span>
                          <span>{imageProperties?.name}</span>
                        </div>
                        <div className="property-item">
                          <span>Size:</span>
                          <span>{imageProperties?.size}</span>
                        </div>
                        <div className="property-item">
                          <span>Dimensions:</span>
                          <span>{imageProperties?.dimensions}</span>
                        </div>
                        <div className="property-item">
                          <span>Type:</span>
                          <span>{imageProperties?.type}</span>
                        </div>
                        <div className="property-item">
                          <span>Folder:</span>
                          <select
                            value={selectedFolder}
                            onChange={(e) => setSelectedFolder(e.target.value)}
                          >
                            {folders.map(folder => (
                              <option key={folder} value={folder}>{folder}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="crop-container">
                      <div className="crop-preview">
                        <ReactCrop
                          crop={crop}
                          onChange={c => setCrop(c)}
                          onComplete={c => setCompletedCrop(c)}
                          aspect={undefined}
                        >
                          <img
                            alt="Crop preview"
                            src={previewUrl}
                            onLoad={onImageLoad}
                            style={{ maxHeight: '400px' }}
                            ref={imgRef}
                          />
                        </ReactCrop>
                      </div>
                      <canvas
                        ref={previewCanvasRef}
                        style={{
                          display: 'none',
                          border: '1px solid black',
                          objectFit: 'contain',
                          width: completedCrop?.width,
                          height: completedCrop?.height,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              {!showCropModal && (
                <>
                  {(selectedFile || externalImageUrl) && (
                    <>
                      <button className="crop-btn" onClick={externalImageUrl ? handleExternalCropClick : () => setShowCropModal(true)}>
                        <FaCrop /> Crop Image
                      </button>
                      <button className="upload-btn" onClick={externalImageUrl ? handleExternalImageUpload : handleUpload}>
                        Upload
                      </button>
                    </>
                  )}
                  {!selectedFile && !externalImageUrl && (
                    <button className="cancel-btn" onClick={resetUploadState}>Cancel</button>
                  )}
                </>
              )}
              {showCropModal && (
                <div className="crop-actions">
                  <button className="cancel-btn" onClick={() => setShowCropModal(false)}>
                    Cancel Crop
                  </button>
                  <button className="upload-btn" onClick={externalImageUrl ? handleExternalImageUpload : handleUpload}>
                    Save Cropped Image
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Image Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content edit-modal">
            <div className="modal-header">
              <h2>Edit Image</h2>
              <button className="close-btn" onClick={() => {
                setShowEditModal(false);
                setEditingImage(null);
                setCompletedCrop(null);
                setShowCropModal(false);
              }}>
                <MdClose />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="editFolder">Change Folder</label>
                <select
                  id="editFolder"
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                >
                  {folders.map(folder => (
                    <option key={folder} value={folder}>{folder}</option>
                  ))}
                </select>
              </div>
              {showCropModal ? (
                <div className="crop-container">
                  <div className="crop-preview">
                    <ReactCrop
                      crop={crop}
                      onChange={c => setCrop(c)}
                      onComplete={c => setCompletedCrop(c)}
                      aspect={undefined}
                    >
                      <img
                        alt="Edit preview"
                        src={previewUrl}
                        onLoad={onImageLoad}
                        style={{ maxHeight: '400px' }}
                        ref={imgRef}
                      />
                    </ReactCrop>
                  </div>
                  <canvas
                    ref={previewCanvasRef}
                    style={{
                      display: 'none',
                      border: '1px solid black',
                      objectFit: 'contain',
                      width: completedCrop?.width,
                      height: completedCrop?.height,
                    }}
                  />
                </div>
              ) : (
                <div className="image-preview">
                  <img src={previewUrl} alt="Preview" style={{ maxHeight: '400px' }} />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingImage(null);
                  setCompletedCrop(null);
                  setShowCropModal(false);
                }}
              >
                Cancel
              </button>
              {!showCropModal ? (
                <button
                  className="crop-btn"
                  onClick={() => setShowCropModal(true)}
                >
                  <FaCrop /> Crop Image
                </button>
              ) : (
                <button
                  className="dont-crop-btn"
                  onClick={() => {
                    setShowCropModal(false);
                    setCompletedCrop(null);
                  }}
                >
                  Don't Crop
                </button>
              )}
              <button
                className="save-btn"
                onClick={handleSaveEdit}
              >
                <MdSave /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast for link copied notification */}
      {showLinkCopiedToast && (
        <div className="toast-notification">
          <MdCheck /> Link copied to clipboard
        </div>
      )}
    </>
  );
}