import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import apiConfig from '../../config/api';

const API_PATH = '/api';

const RecordBottomBar = ({
  evidenceData,
  firearmInfo,
  province,
  district,
  subdistrict,
  houseNumber,
  village,
  soi,
  road,
  placeName,
  coordinates,
  date,
  time
}) => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [imageData, setImageData] = useState(null);

  // Load image data from localStorage
  useEffect(() => {
    const savedImage = localStorage.getItem('analysisImage');
    if (savedImage) {
      setImageData(savedImage);
    }
  }, []);

  const handleBack = () => {
    // เข้ารหัสข้อมูลที่จำเป็นเป็น URL parameters
    navigate(-1);
    
    // ตั้งค่า timeout เพื่อให้แน่ใจว่าได้ย้อนกลับแล้วก่อนเพิ่ม state
    setTimeout(() => {
      window.history.replaceState({ 
        fromRecord: true,
        type: evidenceData?.type || 'Gun',
        result: evidenceData?.result || evidenceData
      }, '');
    }, 100);
  };

  const dataURLtoFile = (dataUrl, filename) => {
    try {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      return new File([u8arr], filename, { type: mime });
    } catch (error) {
      console.error('Error converting dataURL to File:', error);
      return null;
    }
  };

  const handleSave = async () => {
    // ตั้งค่าสถานะให้กำลังบันทึก
    setIsSaving(true);
    setSaveError(null);
    
    console.log("กำลังเตรียมข้อมูลสำหรับบันทึกประวัติ...");
    console.log("Evidence Data:", evidenceData);
    console.log("Firearm Info:", firearmInfo);
    
    // คำนวณ confidence percentage ตาม evidence type
    let confidencePercentage = 0;
    
    if (evidenceData) {
      if (evidenceData.type === 'Drug' || (evidenceData.result && evidenceData.result.prediction)) {
        // สำหรับยาเสพติด - ดึงค่าความเชื่อมั่นจาก prediction results
        confidencePercentage = 
          evidenceData.result?.confidence_percentage || 
          evidenceData.result?.confidence || 
          evidenceData.confidence_percentage || 
          evidenceData.confidence || 
          0;
      } else {
        // สำหรับปืน - ดึงค่าความเชื่อมั่นจาก result
        confidencePercentage = 
          evidenceData.result?.confidence_score || 
          evidenceData.result?.confidence || 
          evidenceData.confidence_score || 
          evidenceData.confidence || 
          0;
      }
    }
    
    // จัดรูปแบบค่าความเชื่อมั่นเป็นเลขทศนิยม 2 ตำแหน่ง
    confidencePercentage = parseFloat(confidencePercentage).toFixed(2);
    
    try {
      // เตรียมข้อมูล form สำหรับอัปโหลดรูปภาพ
      let formData = new FormData();
      
      // หา exhibit_id จาก evidenceData หรือ firearmInfo
      let exhibit_id = null;
      if (firearmInfo && firearmInfo.exhibit_id) {
        exhibit_id = firearmInfo.exhibit_id;
      } else if (evidenceData) {
        exhibit_id = evidenceData.id || evidenceData.exhibit_id || null;
      }
      
      console.log("Exhibit ID to be used:", exhibit_id);
      
      // ถ้ามีรูปภาพ ให้แปลง dataURL เป็น File และเพิ่มเข้า formData
      if (imageData && imageData.startsWith('data:')) {
        try {
          const imageFile = dataURLtoFile(imageData, 'evidence.jpg');
          if (imageFile) {
            formData.append('image', imageFile);
            console.log("รูปภาพถูกเพิ่มใน FormData");
          }
        } catch (imgError) {
          console.error("Error processing image:", imgError);
        }
      }
      
      // เพิ่มข้อมูลอื่นๆ เข้า formData
      if (exhibit_id) formData.append('exhibit_id', exhibit_id);
      if (province?.id) formData.append('province_id', province.id);
      if (district?.id) formData.append('district_id', district.id);
      if (subdistrict?.id) formData.append('subdistrict_id', subdistrict.id);
      if (houseNumber) formData.append('house_no', houseNumber);
      if (village) formData.append('village_no', village);
      if (soi) formData.append('alley', soi);
      if (road) formData.append('road', road);
      if (placeName) formData.append('place_name', placeName);
      if (date) formData.append('date', date);
      if (time) formData.append('time', time);
      if (coordinates?.lat) formData.append('latitude', coordinates.lat);
      if (coordinates?.lng) formData.append('longitude', coordinates.lng);
      if (confidencePercentage) formData.append('confidence_percentage', confidencePercentage);

      // แสดง console log สำหรับตรวจสอบข้อมูล
      console.log('กำลังบันทึกประวัติ:');
      formData.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });
      
      // เปลี่ยน URL จาก Node.js เป็น FastAPI
      const response = await axios.post(`${apiConfig.baseUrl}${API_PATH}/history`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('บันทึกประวัติสำเร็จ:', response.data);

      navigate('/history', {
        state: {
          popup: {
            open: true,
            type: 'success',
            message: 'บันทึกประวัติสำเร็จ'
          }
        }
      });
      
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการบันทึกประวัติ:', error);
      console.error('รายละเอียดข้อผิดพลาด:', error.response?.data || error.message);
      setSaveError(error.response?.data?.detail || error.response?.data?.error || 'ไม่สามารถบันทึกประวัติได้ โปรดลองอีกครั้ง');
      navigate('/history', {
        state: {
          popup: {
            open: true,
            type: 'fail',
            message: error.response?.data?.detail || error.response?.data?.error || 'ไม่สามารถบันทึกประวัติได้ โปรดลองอีกครั้ง'
          }
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full py-4 px-4 flex justify-between border-t sm:justify-end sm:space-x-4">
      {saveError && (
        <div className="text-red-500 mr-4 self-center text-sm">
          {saveError}
        </div>
      )}
      <button 
        className="px-4 py-1.5 border border-t-2 border-r-2 border-l-2 border-b-4 border-[#6B0000] rounded-lg text-[#900B09]"
        onClick={handleBack}
        disabled={isSaving}
      >
        ย้อนกลับ
      </button>
      <button 
        className={`px-7 py-1.5 border-[#6B0000] border-b-4 ${isSaving ? 'bg-gray-500' : 'bg-[#990000]'} rounded-lg text-white`}
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
      </button>
    </div>
  );
};

export default RecordBottomBar;