const API_URL = import.meta.env.VITE_API_URL
export const apiConfig = {
  baseUrl: API_URL,
  
  // Method to get full URL with endpoint
  getUrl: (endpoint) => {
    // Handle endpoints that may or may not start with '/'
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API_URL}${formattedEndpoint}`;
  },
  
  // Common headers for API requests
  headers: {
    'Content-Type': 'application/json',
  }
};

export default apiConfig;