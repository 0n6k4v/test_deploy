import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaShareSquare } from 'react-icons/fa';
import { IoChevronBack, IoClose } from 'react-icons/io5';
import apiConfig from '../../config/api';

const API_PATH = '/api';

const GunProfile = () => {
  const { id } = useParams();
  const [selectedGun, setSelectedGun] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [fullScreen, setFullScreen] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setError(null);
    setSelectedGun(null);
    setSelectedImage(null);
    fetch(`${apiConfig.baseUrl}${API_PATH}/exhibits/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('ไม่พบข้อมูลปืน');
        return res.json();
      })
      .then(data => {
        // แปลงข้อมูลจาก API ใหม่ให้เข้ากับโครงสร้างเดิม
        const gun = {
          id: data.id,
          image: data.images?.length
            ? data.images.map(img => img.image_url)
            : [],
          mechanism: data.firearm?.mechanism || '',
          brand: data.firearm?.brand || '',
          series: data.firearm?.series || '',
          model: data.firearm?.model || '',
          subcategories: data.subcategory || '',
          caliber: data.firearm?.caliber || [],
        };
        setSelectedGun(gun);
        setSelectedImage(gun.image[0] || null);
      })
      .catch(err => setError(err.message));
  }, [id]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!selectedGun) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-1 h-full overflow-auto bg-white">
      {/* Mobile Design */}
      <div className="md:hidden">
        {/* Header with dark red background */}
        <div className="relative bg-[#800000] rounded-b-full h-96">
          {/* Back Button */}
          <button 
            className="absolute top-4 left-4 z-20 text-white"
            onClick={() => navigate(-1)}
          >
            <IoChevronBack size={28} />
          </button>
          
          {/* Main Gun Image */}
          <div className="flex justify-center items-center h-full">
            <img
              src={selectedImage}
              alt={`${selectedGun.brand} ${selectedGun.model}`}
              className="w-4/5 max-h-64 object-contain"
              onClick={() => setFullScreen(true)}
            />
          </div>
        </div>
        
        {/* Thumbnails */}
        <div className="flex gap-2 mt-4 px-4 overflow-x-auto py-2">
          {selectedGun.image.map((img, index) => (
            <button
              key={index}
              className={`w-16 h-16 rounded flex-shrink-0 ${
                selectedImage === img ? 'border-2 border-black' : 'border border-gray-300'
              }`}
              onClick={() => setSelectedImage(img)}
            >
              <img 
                src={img} 
                alt="Thumbnail" 
                className="w-full h-full object-contain bg-white p-1" 
              />
            </button>
          ))}
        </div>

          {/* Full Screen Modal */}
          {fullScreen && (
            <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
              {/* ปุ่มปิด Full Screen */}
              <button 
                className="absolute top-4 right-4 text-white text-3xl p-2 bg-gray-800 rounded-full"
                onClick={() => setFullScreen(false)}
              >
                <IoClose />
              </button>
              
              {/* ภาพที่ขยายเต็มจอ */}
              <img src={selectedImage} alt="Full Screen" className="max-w-full max-h-[80vh] object-contain mb-4 px-4" />

              {/* Thumbnail ใน Full Screen (Swipe ได้) */}
              <div className="flex overflow-x-auto space-x-2 p-4 bg-gray-900 bg-opacity-50 rounded-lg scrollbar-hide">
                {selectedGun.image.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    className={`w-16 h-16 object-contain bg-white border-2 rounded-lg cursor-pointer ${img === selectedImage ? 'border-red-500' : 'border-gray-300'}`}
                    onClick={() => setSelectedImage(img)}
                  />
                ))}
              </div>
            </div>
          )}
        
        {/* Gun Details */}
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-500 font-medium">
              {selectedGun.brand}
            </h2>
            <FaShareSquare className="text-gray-500" size={20} />
          </div>
          
          <h1 className="text-2xl uppercase font-bold mt-1">
            {selectedGun.series} {selectedGun.model}
          </h1>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-gray-600">ประเภท: {selectedGun.categories}</p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-gray-600">จุดสังเกตประจำปืน:</p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-gray-600 mb-2">กระสุนที่ใช้ร่วมกัน</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedGun.caliber.map((cal, index) => (
                <button 
                  key={index} 
                  className={`px-4 py-2 rounded-full border text-sm 
                    ${cal === "39" ? "bg-black text-white" : "bg-white text-black"}`}
                >
                  {cal}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop Design */}
      <div className="hidden md:flex flex-col relative md:flex-row items-center h-full">
        {/* Back Button */}
        <button 
          className="absolute top-4 left-4 z-20 text-white md:block"
          onClick={() => navigate(-1)}
        >
          <IoChevronBack size={28} />
        </button>
        
        {/* Half Circle Background - Made it larger and more curved */}
        <div className="absolute left-0 top-0 w-2/5 h-full bg-gradient-to-r from-[#990000] to-[#330000] rounded-r-full z-0 hidden md:block"></div>
        
        {/* Left Section - Gun Images */}
        <div className="relative md:w-1/2 flex flex-col items-center z-10 p-6">
          <img
            src={selectedImage}
            alt="Gun"
            className="relative w-full max-w-md mx-auto object-contain"
            onClick={() => setFullScreen(true)}
          />
          <div className="flex gap-2 mt-4 justify-center">
            {selectedGun.image.map((img, index) => (
              <button
                key={index}
                className={`w-16 h-16 border-2 rounded ${
                  selectedImage === img ? "border-red-500" : "border-white"
                }`}
                onClick={() => setSelectedImage(img)}
              >
                <img src={img} alt="Thumbnail" className="w-full h-full object-contain bg-white" />
              </button>
            ))}
          </div>
        </div>

        {/* Full Screen Modal */}
        {fullScreen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
            {/* ปุ่มปิด Full Screen */}
            <button 
              className="absolute top-4 right-4 text-white text-3xl p-2 bg-gray-800 rounded-full"
              onClick={() => setFullScreen(false)}
            >
              <IoClose />
            </button>
            
            {/* ภาพที่ขยายเต็มจอ */}
            <img src={selectedImage} alt="Full Screen" className="max-w-full max-h-[80vh] object-contain mb-4" />

            {/* Thumbnail ใน Full Screen */}
            <div className="flex justify-center space-x-2 p-4 bg-gray-900 bg-opacity-50 rounded-lg">
              {selectedGun.image.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className={`w-16 h-16 object-contain bg-white border-2 rounded-lg cursor-pointer ${img === selectedImage ? 'border-red-500' : 'border-gray-300'}`}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Right Section - Gun Details */}
        <div className="md:w-1/2 p-6 text-gray-900 z-10 md:pl-10 pr-32 pb-24">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-500">{selectedGun.brand}</h2>
            <FaShareSquare className="text-gray-500 cursor-pointer" size={24} />
          </div>
          
          <h1 className="text-4xl font-bold mt-1 tracking-wider uppercase">{selectedGun.series} {selectedGun.model}</h1>
          
          <div className="mt-6 border-t border-gray-200 pt-4">
            <p className="text-gray-600">ประเภท: {selectedGun.subcategories}</p>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <p className="text-gray-600">กลไก: {selectedGun.mechanism}</p>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="font-medium text-gray-600 mb-3">จุดสังเกตประจำปืน:</h3>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="font-medium text-gray-600 mb-3">กระสุนที่ใช้ร่วมกัน</h3>
            <div className="flex gap-2 mt-2 flex-wrap">
              {selectedGun.caliber.map((cal, index) => (
                <button key={index} className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-100 text-gray-700">
                  {cal}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GunProfile;