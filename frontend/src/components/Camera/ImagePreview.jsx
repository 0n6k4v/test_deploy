import React, { useState, useEffect } from 'react';
import { X, RotateCcw, ArrowLeft, Send } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDevice } from '../../context/DeviceContext';
import apiConfig from '../../config/api';

const API_PATH = '/api';

const ImagePreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDesktop } = useDevice();
  const [imageData, setImageData] = useState(null);
  const [mode, setMode] = useState(null);
  const [resolution, setResolution] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [fromCamera, setFromCamera] = useState(false);
  const [viewMode, setViewMode] = useState('contain');
  const [fromUpload, setFromUpload] = useState(false);

  // Extract image data and mode from navigation state
  useEffect(() => {
    if (location.state && location.state.imageData) {
      setImageData(location.state.imageData);
      setMode(location.state.mode);
      setResolution(location.state.resolution || '');
      setFromCamera(location.state.fromCamera || false);
      setFromUpload(location.state.uploadFromCameraPage || false);
      setViewMode(location.state.viewMode || 'contain');
    } else {
      navigate('/home');
    }
  }, [location.state, navigate]);

  // ไม่จำเป็นต้องมี useEffect สำหรับการ track window resize อีกต่อไป
  // เนื่องจาก DeviceContext จัดการเรื่องนี้ให้แล้ว

  // Handle going back to camera
  const handleRetake = () => {
    navigate('/camera');
  };

  // Handle going back (generic)
  const handleGoBack = () => {
    navigate(-1);
  };

  // Handle close (return to home)
  const handleClose = () => {
    navigate('/home');
  };

  // ปรับปรุงฟังก์ชัน resizeImage ให้รักษาคุณภาพของภาพได้ดีขึ้น
  const resizeImage = (dataUrl, maxWidth = 1600, maxHeight = 1600, quality = 0.95) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        // ถ้าภาพมีขนาดเล็กอยู่แล้ว ไม่ต้อง resize
        if (width <= maxWidth && height <= maxHeight) {
          console.log("Image already small enough, not resizing");
          resolve(dataUrl);
          return;
        }
        
        // คำนวณขนาดใหม่โดยรักษา aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
        }
        
        console.log(`Resizing image from ${img.width}x${img.height} to ${width}x${height}`);
        
        // สร้าง canvas และวาดภาพที่ resize แล้ว
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        // ใช้ imageSmoothingQuality สูงสุด
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // แปลงเป็น data URL ด้วยคุณภาพสูง
        // หากเป็นภาพ PNG ให้ใช้ PNG เพื่อรักษาคุณภาพ
        const imageType = dataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
        const resizedDataUrl = canvas.toDataURL(imageType, quality);
        resolve(resizedDataUrl);
      };
      
      img.onerror = reject;
      img.src = dataUrl;
    });
  };

  // Function to navigate to CandidateShow with unknown object
  const navigateToUnknownObject = () => {
    // Create unknown object result
    const unknownResult = {
      isUnknown: true
    };
    
    navigate('/candidateShow', { 
      state: { 
        result: unknownResult,
        image: imageData,
        fromCamera: fromCamera,
        uploadFromCameraPage: location.state?.uploadFromCameraPage || false,
        sourcePath: location.state?.sourcePath || -1,
        imageData: imageData
      } 
    });
  };

  // แก้ไขฟังก์ชัน handleSubmit
  const handleSubmit = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // ล้างข้อมูลเก่าใน localStorage
      localStorage.removeItem('analysisResult');
      localStorage.removeItem('firearmInfo');
      localStorage.removeItem('currentEvidenceData');
      
      // บันทึกภาพใหม่
      try {
        localStorage.setItem('analysisImage', imageData);
      } catch (storageError) {
        console.warn("Failed to store image in localStorage:", storageError);
        localStorage.setItem('noAnalysisImage', 'true');
      }
      
      // ใช้ภาพต้นฉบับทดลองก่อน หาก resize แล้วยังมีปัญหา
      let imageToSend = imageData;
      
      // ตรวจสอบขนาดไฟล์ภาพ: ทำ resize เฉพาะภาพใหญ่เกินไปเท่านั้น
      const isLargeImage = imageData.length > 1000000; // ประมาณ 1MB
      
      if (isLargeImage) {
        try {
          console.log("Image is large, attempting resize");
          const resizedImage = await resizeImage(imageData, 1600, 1600, 0.95);
          
          // ถ้า resize สำเร็จและได้ภาพที่เล็กลงจริงๆ
          if (resizedImage.length < imageData.length * 0.9) {
            console.log(`Image successfully resized: ${imageData.length} -> ${resizedImage.length}`);
            imageToSend = resizedImage;
          } else {
            console.log("Resize didn't reduce image size significantly, using original");
          }
        } catch (resizeError) {
          console.error("Error resizing image:", resizeError);
          // ถ้า resize ไม่สำเร็จใช้ภาพต้นฉบับ
        }
      } else {
        console.log("Image is small enough, no resize needed");
      }
      
      // สร้าง Blob
      let blob;
      try {
        blob = await fetch(imageToSend).then(r => r.blob());
      } catch (error) {
        console.error("Error creating blob:", error);
        navigateToUnknownObject();
        return;
      }
      
      // สร้าง FormData
      const formData = new FormData();
      formData.append('image', blob, 'image.jpg');
      
      console.log("Form data created, blob size:", blob.size);
      
      // สร้างตัวจับเวลาและตัวควบคุม abort
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // เพิ่มเวลา timeout เป็น 20 วินาที
      
      try {
        // ส่งคำขอไปยัง API
        const response = await fetch(`${apiConfig.baseUrl}${API_PATH}/analyze`, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
        
        // ยกเลิก timeout
        clearTimeout(timeoutId);
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error:", errorData);
          navigateToUnknownObject();
          return;
        }
        
        const result = await response.json();
        console.log("Analysis result:", result);
        
        // ตรวจสอบผลลัพธ์ว่าถูกต้องหรือไม่
        const isValidResult = result && 
          (result.detected_objects || result.detections || result.prediction || result.details);
        
        if (!isValidResult) {
          console.error("Invalid result structure:", result);
          navigateToUnknownObject();
          return;
        }
        
        // บันทึกผลลัพธ์ลงใน localStorage
        localStorage.setItem('analysisResult', JSON.stringify(result));

        // นำทางไปยัง candidateShow
        navigate('/candidateShow', { 
          state: { 
            result: result,
            image: imageData, // ส่งภาพต้นฉบับไปแสดงผล (คุณภาพดี)
            fromCamera: fromCamera,
            uploadFromCameraPage: location.state?.uploadFromCameraPage || false,
            sourcePath: location.state?.sourcePath || -1
          } 
        });
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        if (fetchError.name === 'AbortError') {
          console.log("Request timed out after 20 seconds");
        }
        navigateToUnknownObject();
      }
      
    } catch (err) {
      console.error("Error processing image:", err);
      navigateToUnknownObject();
    } finally {
      setIsProcessing(false);
    }
  };

  // If no image data, don't render anything
  if (!imageData) return null;

  // Mobile Version
  const MobilePreview = () => (
    <div className="fixed inset-0 bg-black flex flex-col h-screen">
      {/* Header */}
      <div className="relative p-4 flex justify-start items-center bg-black/80">
        <button 
          onClick={fromCamera ? handleRetake : handleGoBack}
          className="p-2 rounded-full hover:bg-gray-800/50 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <span className="text-white font-medium ml-4">ตรวจสอบภาพ</span>
        
        {resolution && (
          <span className="ml-auto text-xs text-gray-400">
            {resolution}
          </span>
        )}
      </div>

      {/* Image preview - แก้ไขตรงนี้ */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center">
        <div className="relative w-full h-full max-h-[calc(100vh-180px)]">
          <img 
            src={imageData} 
            alt="Preview" 
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* แสดงป้ายประเภทเฉพาะเมื่อมีการระบุ mode จากการอัพโหลด (ไม่ใช่จากหน้า Camera) */}
        {mode && !fromCamera && (
          <div className="absolute top-4 right-4">
            <span className="px-4 py-2 rounded-full bg-black/50 text-white text-sm">
              {mode === 'ยาเสพติด' ? '🔍 ตรวจจับยาเสพติด' : '🔍 ตรวจจับอาวุธปืน'}
            </span>
          </div>
        )}
        
        {error && (
          <div className="absolute bottom-4 left-0 right-0 mx-auto w-full max-w-md px-4">
            <div className="bg-red-500 text-white p-3 rounded-lg text-center">
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons - ตรึงไว้ด้านล่างเสมอ */}
      <div className="p-6 bg-black/80 space-y-4 w-full">
        <button
          onClick={handleSubmit}
          disabled={isProcessing}
          className={`w-full py-4 ${isProcessing ? 'bg-gray-500' : 'bg-[#990000] hover:bg-red-800'} rounded-full text-white font-medium flex items-center justify-center space-x-2 transition-colors`}
        >
          <Send className="w-5 h-5" />
          <span>{isProcessing ? 'กำลังวิเคราะห์...' : 'ส่งภาพให้ AI วิเคราะห์'}</span>
        </button>
        
        <button
          onClick={fromCamera ? handleRetake : handleGoBack}
          disabled={isProcessing}
          className="w-full py-4 bg-gray-800 hover:bg-gray-700 rounded-full text-white font-medium flex items-center justify-center space-x-2 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          <span>{fromCamera ? 'ถ่ายภาพใหม่' : 'เลือกภาพใหม่'}</span>
        </button>
      </div>
    </div>
  );

  // Desktop Version
  const DesktopPreview = () => (
    <div className="fixed inset-0 bg-gray-900 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 flex justify-start items-center bg-black">
        <button 
          onClick={fromCamera ? handleRetake : handleGoBack}
          className="p-2 rounded-full hover:bg-gray-800/50 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <span className="text-white font-medium text-xl ml-4">ตรวจสอบภาพ</span>
        
        {resolution && (
          <span className="ml-auto text-sm text-gray-400">
            {resolution}
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Image Preview (70%) */}
        <div className="w-8/12 bg-black flex items-center justify-center p-4 overflow-hidden">
          <div className="relative h-full w-full flex items-center justify-center">
            <img 
              src={imageData} 
              alt="Preview" 
              className={`max-h-full max-w-full object-${viewMode} border border-gray-800`}
            />
            
            {/* แสดงป้ายประเภทเฉพาะเมื่อมีการระบุ mode จากการอัพโหลด (ไม่ใช่จากหน้า Camera) */}
            {mode && !fromCamera && (
              <div className="absolute top-4 right-4">
                <span className="px-4 py-2 rounded-full bg-black/50 text-white">
                  {mode === 'ยาเสพติด' ? '🔍 ตรวจจับยาเสพติด' : '🔍 ตรวจจับอาวุธปืน'}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Side - Controls (30%) */}
        <div className="w-4/12 bg-gray-900 p-6 flex flex-col">
          <div className="flex-1"></div> {/* Spacer */}
          
          <div className="space-y-4">
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`w-full py-4 ${isProcessing ? 'bg-gray-500' : 'bg-[#990000] hover:bg-red-800'} rounded-lg text-white font-medium flex items-center justify-center space-x-2 transition-colors`}
            >
              <Send className="w-5 h-5" />
              <span>{isProcessing ? 'กำลังวิเคราะห์...' : 'ส่งภาพให้ AI วิเคราะห์'}</span>
            </button>
            
            <button
              onClick={fromCamera ? handleRetake : handleGoBack}
              disabled={isProcessing}
              className="w-full py-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium flex items-center justify-center space-x-2 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              <span>{fromCamera ? 'ถ่ายภาพใหม่' : 'เลือกภาพใหม่'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="absolute bottom-20 left-0 right-0 mx-auto w-full max-w-md">
          <div className="bg-red-500 text-white p-3 rounded-lg text-center">
            {error}
          </div>
        </div>
      )}
    </div>
  );

  return isDesktop ? <DesktopPreview /> : <MobilePreview />;
};

export default ImagePreview;