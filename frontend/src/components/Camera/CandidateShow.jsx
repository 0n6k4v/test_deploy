import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, ChevronDown, HelpCircle } from 'lucide-react';
import { PiImageBroken } from 'react-icons/pi';
import { IoClose } from 'react-icons/io5';
import { useDevice } from '../../context/DeviceContext'; // เพิ่มการ import DeviceContext

const CandidateShow = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, isDesktop, isTablet } = useDevice(); // ใช้ DeviceContext
  const [candidates, setCandidates] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [detectionType, setDetectionType] = useState('');
  const [fromCamera, setFromCamera] = useState(false);
  const [sourcePath, setSourcePath] = useState('');
  const [expandedBrands, setExpandedBrands] = useState({});
  const [brandData, setBrandData] = useState([]);
  const [isUnknownObject, setIsUnknownObject] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  
  // Function to toggle brand expansion
  const toggleBrand = (brandName) => {
    setExpandedBrands(prev => ({
      ...prev,
      [brandName]: !prev[brandName]
    }));
  };

  useEffect(() => {
    if (location.state) {
      const { analysisResult, result, image, fromCamera, sourcePath } = location.state;
      const data = analysisResult || result || {};
      
      setImageUrl(image || localStorage.getItem('analysisImage'));
      setFromCamera(fromCamera || false);
      setSourcePath(sourcePath || '');
      
      // Reset unknown object flag
      setIsUnknownObject(false);

      // Handle gun detection with brand/model information
      if (data.detected_objects || data.detections) {
        const detections = data.detected_objects || data.detections || [];
        
        // Check if the detections have zero confidence
        const allZeroConfidence = detections.length === 0 || 
          detections.every(detection => {
            // ตรวจสอบค่า confidence ในระดับบนสุด (ถ้ามี)
            if (detection.confidence !== undefined && detection.confidence > 0) {
              return false;
            }
            
            // ตรวจสอบค่า confidence ใน brand_top3 (สำหรับปืน)
            if (detection.brand_top3 && detection.brand_top3.length > 0) {
              const hasBrandConfidence = detection.brand_top3.some(brand => 
                brand.confidence > 0
              );
              if (hasBrandConfidence) return false;
            }
            
            // ตรวจสอบค่า confidence ใน model_top3 (สำหรับปืน)
            if (detection.model_top3 && detection.model_top3.length > 0) {
              const hasModelConfidence = detection.model_top3.some(model => 
                model.confidence > 0
              );
              if (hasModelConfidence) return false;
            }
            
            // ถ้าไม่มีค่า confidence ที่มากกว่า 0 เลย
            return true;
          });
        
        if (allZeroConfidence) {
          // Set as unknown object
          setIsUnknownObject(true);
          setDetectionType('Unknown');
          setCandidates([{
            label: 'วัตถุพยานที่ไม่รู้จัก',
            confidence: 0,
            isUnknown: true
          }]);
        } else {
          setDetectionType('Gun');

          // รองรับ class ใหม่ ['BigGun', 'Pistol', 'Revolver']
          const gunClasses = ['BigGun', 'Pistol', 'Revolver'];

          if (detections.length > 0 && detections[0].brand_top3) {
            // Process brand-based organization
            const brands = {};
            detections.forEach(detection => {
              if (gunClasses.includes(detection.class) && detection.brand_top3) {
                // จำกัดจำนวน Brand ให้แสดงไม่เกิน 3
                const limitedBrandTop3 = detection.brand_top3.slice(0, 3);
                limitedBrandTop3.forEach(brand => {
                  if (brand.confidence > 0) {
                    if (!brands[brand.label]) {
                      brands[brand.label] = {
                        name: brand.label,
                        confidence: brand.confidence,
                        models: []
                      };
                    }
                    // Add models if they exist for this brand
                    if (detection.model_top3 && detection.brand_top3[0]?.label === brand.label) {
                      // จำกัดจำนวน Model ให้แสดงไม่เกิน 3
                      const limitedModelTop3 = detection.model_top3.slice(0, 3);
                      limitedModelTop3.forEach(model => {
                        if (model.confidence > 0) {
                          brands[brand.label].models.push({
                            name: model.label,
                            confidence: model.confidence,
                            brandName: brand.label
                          });
                        }
                      });
                    }
                  }
                });
              }
            });

            // *** เพิ่ม filter เฉพาะ brand ที่มี models ที่ความมั่นใจ > 0 ***
            const filteredBrands = Object.values(brands).filter(brand => brand.models.length > 0);

            // Convert to array and sort by confidence
            const sortedBrands = filteredBrands
              .sort((a, b) => b.confidence - a.confidence)
              .map(brand => ({
                ...brand,
                models: brand.models.sort((a, b) => b.confidence - a.confidence)
              }))
              .slice(0, 3);

            setBrandData(sortedBrands);

            // Also create flat list for selection
            const flatCandidates = [];
            sortedBrands.forEach(brand => {
              if (brand.models.length > 0) {
                // จำกัดจำนวน Model ให้แสดงไม่เกิน 3
                const limitedModels = brand.models.slice(0, 3);
                
                limitedModels.forEach(model => {
                  flatCandidates.push({
                    label: `${brand.name} ${model.name}`,
                    confidence: model.confidence,
                    brandName: brand.name,
                    modelName: model.name
                  });
                });
              }
            });
            
            setCandidates(flatCandidates);
          } else {
            // Fall back to original format
            const formattedCandidates = detections.map(detection => ({
              label: detection.class,
              confidence: detection.confidence
            }));
            setCandidates(formattedCandidates);
          }
        }
      } else if (data.prediction || data.details) {
        // Handle drug detection case
        
        // เพิ่มโค้ดสำหรับตรวจสอบค่า confidence ทั้งหมดเป็น 0 หรือไม่
        // ...

        setDetectionType('Drug');
        
        if (data.details && Array.isArray(data.details)) {
          // *** จำกัดจำนวนยาเสพติดที่แสดงให้ไม่เกิน 3 ***
          const limitedDetails = data.details.slice(0, 3);
          
          const formattedCandidates = limitedDetails.map(detail => ({
            label: detail.pill_name,
            confidence: detail.confidence || data.confidence || 0
          }));
          setCandidates(formattedCandidates);
        } else {
          // Single result case
          const singleCandidate = {
            label: data.prediction,
            confidence: data.confidence || 0
          };
          setCandidates([singleCandidate]);
        }
      } else {
        // No detection data - handle as unknown object
        setIsUnknownObject(true);
        setDetectionType('Unknown');
        setCandidates([{
          label: 'วัตถุพยานที่ไม่รู้จัก',
          confidence: 0,
          isUnknown: true
        }]);
      }
    }
  }, [location.state]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleSelectCandidate = (index) => {
    setSelectedIndex(index);
  };

  const handleConfirm = () => {
    if (candidates.length > 0) {
      const selectedCandidate = candidates[selectedIndex];
      
      let result;
      let evidenceType = isUnknownObject ? 'Unknown' : detectionType;
      
      if (isUnknownObject) {
        result = {
          isUnknown: true,
          prediction: 'Unknown',
          confidence: 0
        };
      } 
      else if(detectionType === 'Gun') {
        result = {
          weaponType: selectedCandidate.label,
          confidence: selectedCandidate.confidence,
          brandName: selectedCandidate.brandName,
          modelName: selectedCandidate.modelName
        };
        if (brandData.length > 0) {
          const selectedBrand = brandData.find(brand => brand.name === selectedCandidate.brandName);
          if (selectedBrand) {
            result.brandConfidence = selectedBrand.confidence;
            result.availableModels = selectedBrand.models.map(model => ({
              name: model.name,
              confidence: model.confidence
            }));
          }
        }
      } 
      else {
        result = {
          prediction: selectedCandidate.label,
          confidence: selectedCandidate.confidence,
          details: [{ pill_name: selectedCandidate.label, confidence: selectedCandidate.confidence }]
        };
      }

      localStorage.setItem('analysisResult', JSON.stringify(result));
      localStorage.setItem('selectedEvidenceType', evidenceType);

      const evidenceData = {
        type: evidenceType,
        result: result,
        imageUrl: imageUrl,
        selectedCandidateIndex: selectedIndex,
        allCandidates: candidates
      };
      
      // Navigate to EvidenceProfile with selected result
      navigate('/evidenceProfile', { 
        state: { 
          type: evidenceType,
          result: result,
          evidence: evidenceData,
          fromCamera: fromCamera,
          sourcePath: sourcePath
        } 
      });
    }
  };

  // Component to render when image is not available
  const NoImageDisplay = ({ message = "การแสดงผลภาพถ่ายมีปัญหา" }) => (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200 h-64 w-full">
      <PiImageBroken className="text-gray-400 text-5xl mb-2" />
      <p className="text-gray-500 text-center">{message}</p>
    </div>
  );

  // Format confidence as percentage
  const formatConfidence = (confidence) => {
    if (confidence === undefined || confidence === null) return '0%';
    return `${Math.round(confidence * 100)}%`;
  };

  // ปรับขนาดความสูงของรูปภาพตามประเภทอุปกรณ์
  const getImageHeight = () => {
    if (isDesktop) return 'h-72'; // Desktop - ภาพใหญ่
    if (isTablet) return 'h-60';  // Tablet - ภาพขนาดกลาง
    return 'h-48';               // Mobile - ภาพเล็ก
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-white">
      {/* Header - คงไว้เหมือนเดิม */}
      <div className="p-4 flex items-center border-b shrink-0">
        <button onClick={handleGoBack} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className={`ml-2 ${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>เลือกวัตถุพยานที่ตรวจพบ</h1>
      </div>
      
      {/* Image Preview - ใช้ DeviceContext ในการกำหนดความสูง */}
      <div className="p-4 border-b shrink-0">
        {imageUrl ? (
          <div className={`relative w-full ${getImageHeight()}`}>
            <img 
              src={imageUrl} 
              alt="Evidence" 
              className="w-full h-full object-contain rounded-lg cursor-pointer" 
              onClick={() => setFullScreen(true)}
            />
            <div className={`absolute top-2 right-2 px-3 py-1 bg-black/50 text-white rounded-full ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {detectionType === 'Gun' ? '🔫 อาวุธปืน (BigGun/Pistol/Revolver)' : 
               detectionType === 'Drug' ? '💊 ยาเสพติด' : 
               '❓ วัตถุพยานที่ไม่รู้จัก'}
            </div>
          </div>
        ) : (
          <NoImageDisplay />
        )}
      </div>
      
      {/* Candidates List - ปรับ padding ตามขนาดจอ */}
      <div className={`flex-1 ${isMobile ? 'p-3' : 'p-4'} overflow-y-auto`}>
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium mb-3`}>
          ผลการตรวจพบ ({candidates.length})
        </h2>

        {isUnknownObject ? (
          <div className={`${isMobile ? 'p-4' : 'p-6'} bg-gray-50 border rounded-lg flex flex-col items-center justify-center space-y-3`}>
            <HelpCircle className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} text-gray-400`} />
            <div className="text-center">
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium`}>วัตถุพยานที่ไม่รู้จัก</h3>
              <p className={`text-gray-500 ${isMobile ? 'text-sm' : 'text-base'}`}>
                ไม่สามารถระบุชนิดของวัตถุพยานได้ หรือความมั่นใจในการระบุต่ำเกินไป
              </p>
            </div>
          </div>
        ) : detectionType === 'Gun' && brandData.length > 0 ? (
          <div className={`space-y-${isMobile ? '2' : '3'}`}>
            {brandData.map((brand, brandIdx) => (
              <div 
                key={`brand-${brandIdx}`}
                className="border rounded-lg overflow-hidden"
              >
                {/* Brand header */}
                <div 
                  onClick={() => toggleBrand(brand.name)}
                  className={`${isMobile ? 'p-3' : 'p-4'} bg-gray-50 flex items-center justify-between cursor-pointer ${
                    expandedBrands[brand.name] ? 'border-b border-gray-200' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium">{brand.name}</div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                      ความมั่นใจ: {formatConfidence(brand.confidence)}
                      {brand.models.length > 0 && ` • ${brand.models.length} รุ่น`}
                    </div>
                  </div>
                  {expandedBrands[brand.name] ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                
                {/* Models for this brand */}
                {expandedBrands[brand.name] && brand.models.length > 0 && (
                  <div className="bg-white divide-y divide-gray-100">
                    {brand.models.map((model, modelIdx) => {
                      // Find index in flat candidates list
                      const candidateIndex = candidates.findIndex(
                        c => c.brandName === brand.name && c.modelName === model.name
                      );
                      
                      return (
                        <div 
                          key={`model-${brandIdx}-${modelIdx}`}
                          className={`${isMobile ? 'p-3' : 'p-4'} flex items-center justify-between ${
                            selectedIndex === candidateIndex ? 'bg-red-50' : ''
                          }`}
                          onClick={() => handleSelectCandidate(candidateIndex)}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{model.name}</div>
                            <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                              ความมั่นใจ: {formatConfidence(model.confidence)}
                            </div>
                          </div>
                          {selectedIndex === candidateIndex && (
                            <div className="w-6 h-6 rounded-full bg-[#990000] flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Original flat list for drugs and fallback
          <div className={`space-y-${isMobile ? '2' : '3'}`}>
            {candidates.length > 0 ? (
              candidates.map((candidate, index) => (
                <div 
                  key={`${candidate.label}-${index}`}
                  className={`${isMobile ? 'p-3' : 'p-4'} border rounded-lg flex items-center justify-between ${
                    selectedIndex === index ? 'border-[#990000] bg-red-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleSelectCandidate(index)}
                >
                  <div className="flex-1">
                    <div className="font-medium">{candidate.label}</div>
                    {!candidate.isUnknown && (
                      <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                        ความมั่นใจ: {formatConfidence(candidate.confidence)}
                      </div>
                    )}
                  </div>
                  {selectedIndex === index && (
                    <div className="w-6 h-6 rounded-full bg-[#990000] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className={`${isMobile ? 'p-3' : 'p-4'} text-center text-gray-500`}>
                ไม่พบวัตถุพยานที่ตรงกับเงื่อนไข
              </div>
            )}
          </div>
        )}

        <div className="h-4"></div>
      </div>
      
      {/* Bottom Action - ปรับ padding ตามขนาดหน้าจอ */}
      <div className={`${isMobile ? 'p-3' : 'p-4'} border-t bg-white shrink-0`}>
        <button
          onClick={handleConfirm}
          disabled={candidates.length === 0}
          className={`w-full ${isMobile ? 'py-3' : 'py-4'} rounded-lg ${
            candidates.length > 0 
              ? 'bg-[#990000] text-white' 
              : 'bg-gray-200 text-gray-500'
          } font-medium`}
        >
          {isUnknownObject ? 'ยืนยันวัตถุไม่ทราบชนิด' : 'ยืนยันการเลือก'}
        </button>
      </div>

      {/* Full Screen Modal for Image - ปรับตาม DeviceContext */}
      {fullScreen && imageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
          {/* ปุ่มปิด Full Screen */}
          <button 
            className={`absolute top-4 right-4 text-white ${isMobile ? 'text-2xl' : 'text-3xl'} p-2 bg-gray-800 rounded-full`}
            onClick={() => setFullScreen(false)}
          >
            <IoClose />
          </button>
          {/* ภาพที่ขยายเต็มจอ */}
          <img 
            src={imageUrl} 
            alt="Full Screen" 
            className={`max-w-full ${isMobile ? 'max-h-[70vh]' : 'max-h-[80vh]'} object-contain mb-4 px-4`} 
          />
          {/* Optional: Display what type of evidence is being shown */}
          <div className={`px-3 py-1 bg-black/70 text-white rounded-full ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {detectionType === 'Gun' ? '🔫 อาวุธปืน (BigGun/Pistol/Revolver)' : 
             detectionType === 'Drug' ? '💊 ยาเสพติด' : 
             '❓ วัตถุพยานที่ไม่รู้จัก'}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateShow;