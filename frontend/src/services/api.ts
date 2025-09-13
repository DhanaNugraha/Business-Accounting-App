import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const downloadTemplate = async (): Promise<void> => {
  try {
    const response = await axios({
      url: `${API_BASE_URL}/api/template`,
      method: 'GET',
      responseType: 'blob',
    });

    // Create a URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from content-disposition header or use a default name
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'accounting_template.xlsx';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch && filenameMatch.length === 2) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    
    // Trigger the download
    link.click();
    
    // Clean up
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error downloading template:', error);
    return Promise.reject(error);
  }
};

export const uploadFile = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const saveTransactions = async (data: any): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/save`, data);
    return response.data;
  } catch (error) {
    console.error('Error saving transactions:', error);
    throw error;
  }
};
