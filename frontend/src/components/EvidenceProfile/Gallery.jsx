import React, { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import { PiImageBroken } from "react-icons/pi";

const Gallery = ({ evidence, firearmInfo }) => {
  const userImage = localStorage.getItem('analysisImage') || null;
  
  // ใช้ useState สำหรับเก็บรูปภาพจาก firearmInfo
  const [galleryImages, setGalleryImages] = useState([]);
  
  // ทำการแปลงข้อมูลจาก firearmInfo เป็นรูปแบบที่ต้องการในครั้งแรกที่ component โหลด
  useEffect(() => {
    console.log("FirearmInfo in Gallery:", firearmInfo);
    
    // ตรวจสอบว่า images อาจจะอยู่ที่ firearmInfo.images หรือ firearmInfo.exhibit.images
    let images = [];
    
    // กรณีที่ firearmInfo มี images โดยตรง
    if (firearmInfo && firearmInfo.images && firearmInfo.images.length > 0) {
      images = [...firearmInfo.images];
    } 
    // กรณีที่ images อยู่ใน firearmInfo.exhibit
    else if (firearmInfo && firearmInfo.exhibit && firearmInfo.exhibit.images && firearmInfo.exhibit.images.length > 0) {
      images = [...firearmInfo.exhibit.images];
    }
    
    if (images.length > 0) {
      // เรียงลำดับรูปภาพตาม priority ถ้าไม่มี priority ให้เรียงตาม id
      images.sort((a, b) => {
        if (a.priority && b.priority) {
          return a.priority - b.priority;
        } else if (a.priority) {
          return -1; // a มี priority ให้ a มาก่อน
        } else if (b.priority) {
          return 1; // b มี priority ให้ b มาก่อน
        } 
        return a.id - b.id; // ถ้าทั้ง a และ b ไม่มี priority ให้เรียงตาม id
      });
      
      // แปลงข้อมูลให้อยู่ในรูปแบบที่ใช้งานกับ component
      const formattedImages = images.map(img => ({
        id: img.id,
        url: img.image_url,
        name: img.description || `${firearmInfo.brand} ${firearmInfo.model || firearmInfo.series || ''}`,
        description: img.description,
        priority: img.priority
      }));
      
      console.log("Formatted gallery images:", formattedImages);
      setGalleryImages(formattedImages);
    } else {
      // กรณีไม่มีข้อมูลรูปภาพใน firearmInfo ส่ง array ว่างกลับไป
      console.log("No images found in firearmInfo");
      setGalleryImages([]);
    }
  }, [firearmInfo]);
  
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);
  
  // เลือกรูปภาพแรกเป็น default เมื่อข้อมูลรูปภาพพร้อม
  useEffect(() => {
    if (galleryImages.length > 0 && !selectedGalleryImage) {
      setSelectedGalleryImage(galleryImages[0]);
    }
  }, [galleryImages, selectedGalleryImage]);
  
  const userImageSrc = userImage;
  const galleryImageSrc = selectedGalleryImage?.url;
  const [fullScreen, setFullScreen] = useState(false);
  const [galleryFullScreen, setGalleryFullScreen] = useState(false);
  
  // Component to render when image is not available
  const NoImageDisplay = ({ message = "การแสดงผลภาพถ่ายมีปัญหา", subMessage = "ไม่พบภาพที่บันทึกไว้" }) => (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200 h-64 w-full">
      <PiImageBroken className="text-gray-400 text-5xl mb-2" />
      <p className="text-gray-500 text-center">{message}</p>
      <p className="text-gray-400 text-sm text-center mt-1">{subMessage}</p>
    </div>
  );
  
  return (
    <div className="bg-white h-full w-full">
      {/* For mobile view */}
      <div className="flex flex-col md:hidden">
        <div className="px-4">
          <div className="p-3">
            <h3 className="text-base font-medium block pb-2 border-b-2 border-gray-200">ภาพถ่าย</h3>
          </div>
          <div className="flex justify-center items-center py-4">
            {userImage ? (
              <img 
                src={userImageSrc} 
                alt="ภาพวัตถุพยานที่ถ่าย" 
                className="w-full h-auto object-contain max-h-64"
                onClick={() => setFullScreen(true)}
              />
            ) : (
              <NoImageDisplay />
            )}
          </div>
        </div>

        {/* Full Screen Modal for User Image */}
        {fullScreen && userImage && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
            {/* ปุ่มปิด Full Screen */}
            <button 
              className="absolute top-4 right-4 text-white text-3xl p-2 bg-gray-800 rounded-full"
              onClick={() => setFullScreen(false)}
            >
              <IoClose />
            </button>
            
            {/* ภาพที่ขยายเต็มจอ */}
            <img src={userImage} alt="Full Screen" className="max-w-full max-h-[80vh] object-contain mb-4 px-4" />
          </div>
        )}
        
        <div className="px-4">
          <div className="p-3">
            <h3 className="text-base font-medium block pb-2 border-b-2 border-gray-200">ภาพเปรียบเทียบจากคลัง</h3>
          </div>
          <div className="py-2">
            {galleryImages.length > 0 ? (
              selectedGalleryImage ? (
                <img 
                  src={galleryImageSrc} 
                  alt="ภาพวัตถุพยานจากคลัง" 
                  className="w-full h-auto object-contain max-h-64"
                  onClick={() => setGalleryFullScreen(true)}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <NoImageDisplay message="กำลังโหลดภาพ..." subMessage="โปรดรอสักครู่" />
              )
            ) : (
              <NoImageDisplay message="ไม่พบภาพเปรียบเทียบ" subMessage="ไม่มีภาพในฐานข้อมูล" />
            )}
            {selectedGalleryImage && (
              <div className="hidden flex-col items-center justify-center">
                <NoImageDisplay message="การแสดงผลภาพผิดพลาด" subMessage="ไม่สามารถโหลดรูปภาพได้" />
              </div>
            )}
          </div>
          
          <div className="mt-6">
            {galleryImages.length > 0 ? (
              <div className="flex justify-between overflow-x-auto gap-2 pb-2">
                {galleryImages.map((img) => (
                  <div 
                    key={img.id} 
                    className={`flex-shrink-0 cursor-pointer ${
                      selectedGalleryImage?.id === img.id ? 'border-2 border-blue-800 rounded' : 'border border-gray-200 rounded'
                    }`}
                    onClick={() => setSelectedGalleryImage(img)}
                    style={{ width: '70px', height: '70px' }}
                  >
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <img 
                        src={img.url} 
                        alt={img.name}
                        className="max-w-full max-h-full object-contain p-1"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = '<div class="text-xs text-center text-gray-400">ไม่สามารถโหลดรูปได้</div>';
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      
      {/* For desktop view */}
      <div className="hidden md:flex flex-row pl-4 pr-4 relative">
        {/* ส่วนซ้าย: รูปที่ผู้ใช้ถ่าย */}
        <div className="w-1/2">
          <div className="p-3">
            <h3 className="text-base font-medium inline-block pb-2 border-b-2 border-gray-200 w-full">ภาพถ่ายหลักฐาน</h3>
          </div>
          <div className="flex justify-center items-center p-4">
            {userImage ? (
              <img 
                src={userImageSrc} 
                alt="ภาพวัตถุพยานที่ถ่าย" 
                className="w-full h-auto max-h-96 object-contain cursor-pointer"
                onClick={() => setFullScreen(true)}
              />
            ) : (
              <NoImageDisplay />
            )}
          </div>
        </div>

        {/* Full Screen Modal for User Image */}
        {fullScreen && userImage && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
            {/* ปุ่มปิด Full Screen */}
            <button 
              className="absolute top-4 right-4 text-white text-3xl p-2 bg-gray-800 rounded-full"
              onClick={() => setFullScreen(false)}
            >
              <IoClose />
            </button>
            
            {/* ภาพที่ขยายเต็มจอ */}
            <img src={userImage} alt="Full Screen" className="max-w-full max-h-[80vh] object-contain mb-4 px-4" />
          </div>
        )}

        {/* Vertical divider */}
        <div className="block absolute h-[95%] mt-11" style={{ left: '50%', width: '1px', backgroundColor: '#e5e7eb' }}></div>
        
        {/* ส่วนขวา: รูปจาก Gallery เพื่อเปรียบเทียบ */}
        <div className="w-1/2">
          <div className="p-3">
            <h3 className="text-base font-medium inline-block pb-2 border-b-2 border-gray-200 w-full">ภาพจากฐานข้อมูล</h3>
          </div>
          <div className="p-4">
            <div className="w-full">
              {galleryImages.length > 0 ? (
                selectedGalleryImage ? (
                  <img 
                    src={galleryImageSrc} 
                    alt="ภาพวัตถุพยานจากคลัง" 
                    className="w-full h-auto max-h-96 object-contain cursor-pointer"
                    onClick={() => setGalleryFullScreen(true)}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : (
                  <NoImageDisplay message="กำลังโหลดภาพ..." subMessage="โปรดรอสักครู่" />
                )
              ) : (
                <NoImageDisplay message="ไม่พบภาพเปรียบเทียบ" subMessage="ไม่มีภาพในฐานข้อมูล" />
              )}
              {selectedGalleryImage && (
                <div className="hidden flex-col items-center justify-center">
                  <NoImageDisplay message="การแสดงผลภาพผิดพลาด" subMessage="ไม่สามารถโหลดรูปภาพได้" />
                </div>
              )}
            </div>
            
            <div className="mt-6">
              {galleryImages.length > 0 ? (
                <div className="flex justify-center flex-wrap gap-4 pb-2">
                  {galleryImages.map((img) => (
                    <div 
                      key={img.id} 
                      className={`flex-shrink-0 cursor-pointer ${
                        selectedGalleryImage?.id === img.id ? 'border-2 border-blue-800 rounded' : 'border border-gray-200 rounded'
                      }`}
                      onClick={() => setSelectedGalleryImage(img)}
                      style={{ width: '75px', height: '75px' }}
                    >
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <img 
                          src={img.url} 
                          alt={img.name}
                          className="max-w-full max-h-full object-contain p-1"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = '<div class="text-xs text-center text-gray-400">ไม่สามารถโหลดรูปได้</div>';
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      
      {/* Full Screen Modal for Gallery Image with Thumbnails */}
      {galleryFullScreen && selectedGalleryImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
          {/* ปุ่มปิด Full Screen */}
          <button 
            className="absolute top-4 right-4 text-white text-3xl p-2 bg-gray-800 rounded-full"
            onClick={() => setGalleryFullScreen(false)}
          >
            <IoClose />
          </button>
          
          {/* ภาพที่ขยายเต็มจอ */}
          <img 
            src={selectedGalleryImage.url} 
            alt={selectedGalleryImage.name} 
            className="max-w-full max-h-[70vh] object-contain mb-6 px-4" 
          />
          
          {/* แสดงคำอธิบายภาพ หากมี */}
          {selectedGalleryImage.description && (
            <p className="text-white text-center mb-4">
              {selectedGalleryImage.description}
            </p>
          )}
          
          {/* Thumbnails */}
          <div className="flex justify-center gap-4 flex-wrap pb-4 px-4">
            {galleryImages.map((img) => (
              <div 
                key={img.id} 
                className={`flex-shrink-0 cursor-pointer ${
                  selectedGalleryImage.id === img.id ? 'border-2 border-white' : 'border border-gray-600'
                }`}
                onClick={() => setSelectedGalleryImage(img)}
                style={{ width: '80px', height: '80px' }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <img 
                    src={img.url} 
                    alt={img.name}
                    className="max-w-full max-h-full object-contain p-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;