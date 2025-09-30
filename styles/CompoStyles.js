export const CompoStyles = `

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
  background: var(--main-color);
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10px var(--main-color);
}
.media-item-overlay input{
    width: 25px;
    height: 25px;
    object-fit: cover;
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
`;