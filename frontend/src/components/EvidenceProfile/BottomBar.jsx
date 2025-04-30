import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomBar = ({ firearmInfo, evidence, fromCamera, sourcePath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use directly provided evidence prop first, fall back to location state if needed
  const evidenceData = evidence || location.state?.evidence || location.state?.result;
  
  // Extract source information with fallbacks
  const isFromCamera = fromCamera || location.state?.fromCamera || false;
  const uploadFromCameraPage = location.state?.uploadFromCameraPage || false;
  const sourcePath_ = sourcePath || location.state?.sourcePath;
  
  const handleRetakeOrGoBack = () => {
    // If the image was uploaded from the camera page, go back to camera
    if (uploadFromCameraPage || isFromCamera) {
      navigate('/camera');
    } 
    // If we have a specific sourcePath saved
    else if (sourcePath_) {
      if (typeof sourcePath_ === 'number') {
        // If sourcePath is a number (-1), use navigate(-1) to go back in history
        navigate(sourcePath_);
      } else {
        // Otherwise navigate to the specific path
        navigate(sourcePath_);
      }
    } 
    // Fallback to go back in history
    else {
      navigate(-1);
    }
  };

  // Button text differs based on source
  const getButtonText = () => {
    if (isFromCamera) return 'ถ่ายใหม่';
    if (uploadFromCameraPage) return 'เลือกรูปใหม่';
    return 'เลือกรูปใหม่';
  };

  const handleSave = () => {
    // Pass the full evidence data in navigation state instead of relying on localStorage
    navigate('/evidenceProfile/save-to-record', { 
      state: { 
        evidence: evidenceData,
        firearmInfo: firearmInfo,
        fromEvidence: true,
        // Pass through all source info
        fromCamera: isFromCamera,
        uploadFromCameraPage,
        sourcePath: sourcePath_
      } 
    });
  };

  // For debugging - only log essential info
  console.log('BottomBar state:', {
    fromCamera: isFromCamera, 
    uploadFromCameraPage, 
    sourcePath: sourcePath_,
    hasEvidence: !!evidenceData,
    evidenceType: evidenceData?.type
  });

  return (
    <div className="w-full py-4 px-4 flex justify-between border-t sm:justify-end sm:space-x-4">
      <button 
        className="px-7 py-1.5 border border-t-2 border-r-2 border-l-2 border-b-4 border-[#6B0000] rounded-lg text-[#900B09]"
        onClick={handleRetakeOrGoBack}
      >
        {getButtonText()}
      </button>
      <button 
        className="px-4 py-1.5 border-[#6B0000] border-b-4 bg-[#990000] rounded-lg text-white"
        onClick={handleSave}
      >
        บันทึกประวัติ
      </button>
    </div>
  );
};

export default BottomBar;