import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDevice } from '../context/DeviceContext';
import TabBar from '../components/EvidenceProfile/TabBar';
import BottomBar from '../components/EvidenceProfile/BottomBar';
import GunBasicInformation from '../components/EvidenceProfile/GunProfile';
import DrugBasicInformation from '../components/EvidenceProfile/DrugProfile';
import Gallery from '../components/EvidenceProfile/Gallery';
import History from '../components/EvidenceProfile/History';
import apiConfig from '../config/api';

let inMemoryEvidenceStore = null;
const API_PATH = '/api';

const EvidenceProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useDevice();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes('/gallery')) return 1;
    else if (location.pathname.includes('/history')) return 2;
    return 0;
  });

  useEffect(() => {
    if (location.pathname.includes('/gallery')) {
      setActiveTab(1);
    } else if (location.pathname.includes('history')) {
      setActiveTab(2);
    } else {
      setActiveTab(0);
    }
  }, [location.pathname]);

  // Initialize evidence data from various sources with priority
  const [evidence, setEvidence] = useState(() => {
    // First priority: check location state (passed from previous screen)
    if (location.state?.evidence) {
      // Store in memory for future reference
      inMemoryEvidenceStore = location.state.evidence;
      return location.state.evidence;
    }
    
    // Second priority: check in-memory store (from previous renders in same session)
    if (inMemoryEvidenceStore) {
      return inMemoryEvidenceStore;
    }
    
    // Third priority: reconstruct from parts in location state
    if (location.state?.type) {
      const evidenceData = {
        type: location.state.type,
        result: location.state.result,
        imageUrl: localStorage.getItem('analysisImage')
      };
      inMemoryEvidenceStore = evidenceData;
      return evidenceData;
    }
    
    // Fourth priority: try to reconstruct from minimal localStorage data
    try {
      const savedResult = localStorage.getItem('analysisResult');
      if (savedResult) {
        const result = JSON.parse(savedResult);
        const type = localStorage.getItem('selectedEvidenceType') || 
                    (result.hasOwnProperty('prediction') ? 'Drug' : 'Gun');
        const evidenceData = { 
          type, 
          result,
          imageUrl: localStorage.getItem('analysisImage')
        };
        inMemoryEvidenceStore = evidenceData;
        return evidenceData;
      }
      
      // Last resort: check for minimal reference data
      const evidenceType = localStorage.getItem('evidenceType');
      const imageUrl = localStorage.getItem('analysisImage');
      
      if (evidenceType || imageUrl) {
        return {
          type: evidenceType || '',
          result: null,
          imageUrl: imageUrl
        };
      }
    } catch (error) {
      console.warn('Error retrieving from localStorage:', error);
    }

    // Default empty state
    return { type: '', result: null };
  });

  // Function to normalize brand and model name for API search
  const normalizeNameForSearch = (brandName, modelName) => {
    if (!brandName && !modelName) return '';
    
    // Remove all spaces, convert to lowercase, and remove special characters
    const normalizedBrand = brandName ? brandName.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    const normalizedModel = modelName ? modelName.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    
    // Combine brand and model without spaces
    return `${normalizedBrand}${normalizedModel}`;
  };

  // Function to fetch firearm details from API
  const fetchFirearmDetails = async (brandName, modelName) => {
    try {
      setIsLoading(true);
      setApiError(null);
      
      // Create normalized search string for API comparison
      const normalizedName = normalizeNameForSearch(brandName, modelName);
      console.log('Searching API with normalized name:', normalizedName);

      // Fetch all exhibits
      const response = await fetch(`${apiConfig.baseUrl}${API_PATH}/exhibits`);
      console.log(`${apiConfig.baseUrl}${API_PATH}/exhibits`);
      
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const exhibits = await response.json();
      console.log(`Found ${exhibits.length} exhibits in database`);
      
      // Find matching exhibit by comparing normalized_name
      const matchingExhibit = exhibits.find(exhibit => 
        exhibit.firearm && 
        normalizeNameForSearch(exhibit.firearm.brand, exhibit.firearm.model) === normalizedName
      );
      
      if (matchingExhibit) {
        console.log('Found matching exhibit:', matchingExhibit);
        
        // Update firearm info from API data
        setFirearmInfo({
          ...matchingExhibit.firearm,
          exhibit: {
            id: matchingExhibit.id,
            category: matchingExhibit.category,
            subcategory: matchingExhibit.subcategory,
          },
          images: matchingExhibit.images,
        });
        
        return true;
      } else {
        console.log('No matching exhibit found in database');
        return false;
      }
    } catch (error) {
      console.error('Error fetching firearm details:', error);
      setApiError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Log the selected Brand and Model when evidence is loaded and search API for details
  useEffect(() => {
    if (evidence?.result) {
      const result = evidence.result;
      
      if (evidence.type === 'Gun' && result.brandName && result.modelName) {
        console.log('======= EVIDENCE SELECTION LOG =======');
        console.log(`User selected Brand: ${result.brandName}`);
        console.log(`User selected Model: ${result.modelName}`);
        console.log(`Brand confidence: ${result.brandConfidence ? (result.brandConfidence * 100).toFixed(2) + '%' : 'N/A'}`);
        console.log(`Model confidence: ${result.confidence ? (result.confidence * 100).toFixed(2) + '%' : 'N/A'}`);
        console.log('===================================');
        
        // Search API for details about this firearm
        fetchFirearmDetails(result.brandName, result.modelName);
      } else if (evidence.type === 'Drug' && result.prediction) {
        console.log('======= EVIDENCE SELECTION LOG =======');
        console.log(`User selected Drug: ${result.prediction}`);
        console.log(`Confidence: ${result.confidence ? (result.confidence * 100).toFixed(2) + '%' : 'N/A'}`);
        console.log('===================================');
      } else if (evidence.type === 'Unknown') {
        console.log('======= EVIDENCE SELECTION LOG =======');
        console.log('User selected: Unknown object');
        console.log('===================================');
      }
    }
  }, [evidence]);

  // Store ONLY minimal reference data when evidence changes
  useEffect(() => {
    if (evidence && (evidence.type || evidence.imageUrl)) {
      // Update in-memory store first (no size limitations)
      inMemoryEvidenceStore = evidence;
      
      // Store only tiny references in localStorage
      try {
        // Store type as a simple string
        if (evidence.type) {
          localStorage.setItem('evidenceType', evidence.type);
        }
        
        // Store only essential result properties if any
        if (evidence.result) {
          const minimalResult = {
            className: evidence.result.className,
            confidence: evidence.result.confidence,
            prediction: evidence.result.prediction
          };
          
          // If this small object fits, store it
          try {
            localStorage.setItem('minimalEvidenceResult', JSON.stringify(minimalResult));
          } catch (err) {
            // If even this fails, just store a flag
            localStorage.setItem('hasEvidenceResult', 'true');
          }
        }
      } catch (error) {
        console.warn('Failed to store minimal evidence references:', error);
        // Non-critical error, app can still function with in-memory data
      }
    }
  }, [evidence]);

  // Handle firearm info with same in-memory approach
  const [firearmInfo, setFirearmInfo] = useState(() => {
    if (location.state?.firearmInfo) {
      return location.state.firearmInfo;
    }
    
    try {
      const saved = localStorage.getItem('firearmInfo');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Error retrieving firearm info:', error);
      return null;
    }
  });

  // Store minimal firearm info
  useEffect(() => {
    if (firearmInfo) {
      try {
        // Only store essential identifiers that can be used later
        const minimalInfo = {
          id: firearmInfo.id,
          type: firearmInfo.type,
          model: firearmInfo.model
        };
        localStorage.setItem('minimalFirearmInfo', JSON.stringify(minimalInfo));
        
        // Log firearm details if available
        console.log('======= FIREARM INFO LOG =======');
        console.log(`Firearm ID: ${firearmInfo.id || 'N/A'}`);
        console.log(`Firearm Type: ${firearmInfo.type || 'N/A'}`);
        console.log(`Firearm Model: ${firearmInfo.model || 'N/A'}`);
        console.log('===============================');
      } catch (error) {
        console.warn('Failed to store firearm info reference:', error);
      }
    }
  }, [firearmInfo]);

  const renderBasicInfo = () => {
    if (!evidence || (!evidence.type && !evidence.result)) {
      return <div className="p-4 text-red-600">ไม่พบข้อมูลวัตถุพยาน</div>;
    }

    const evidenceType = evidence.type || 
                        (evidence.result?.hasOwnProperty('prediction') && !evidence.result?.isUnknown ? 'Drug' : 'Gun');
    
    switch (evidenceType) {
      case 'Gun':
        return (
          <GunBasicInformation
            analysisResult={evidence.result || evidence}
            firearmInfo={firearmInfo}
            imageUrl={evidence.imageUrl}
            isLoading={isLoading}
            apiError={apiError}
            isMobile={isMobile} // Pass device information to component
          />
        );
      case 'Drug':
        return <DrugBasicInformation 
          analysisResult={evidence.result || evidence} 
          imageUrl={evidence.imageUrl}
          isMobile={isMobile} // Pass device information to component
        />;
      case 'Unknown':
        return <div className="p-4 text-gray-600">
          <h3 className="text-lg font-medium mb-2">วัตถุพยานไม่ทราบชนิด</h3>
          <p>ไม่สามารถระบุชนิดของวัตถุพยานนี้ได้</p>
          {evidence.imageUrl && (
            <div className="mt-4">
              <img src={evidence.imageUrl} alt="Unknown evidence" 
                className={`${isMobile ? 'w-full max-h-48' : 'w-full max-h-64'} object-contain rounded-lg`} />
            </div>
          )}
        </div>;
      default:
        return <div className="p-4 text-red-600">ไม่พบข้อมูลวัตถุพยาน</div>;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return renderBasicInfo();
      case 1:
        return <Gallery evidence={evidence} firearmInfo={firearmInfo} isMobile={isMobile} />;
      case 2:
        return <History firearmInfo={firearmInfo} isMobile={isMobile} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TabBar />
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
      <BottomBar 
        firearmInfo={firearmInfo} 
        evidence={evidence}
        fromCamera={location.state?.fromCamera} 
        sourcePath={location.state?.sourcePath} 
        isMobile={isMobile}
      />
    </div>
  );
};

export default EvidenceProfile;