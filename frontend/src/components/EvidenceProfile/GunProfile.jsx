import React, { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { PiImageBroken } from "react-icons/pi";

const GunProfile = ({ analysisResult, firearmInfo, isLoading, apiError }) => {
  // State for share notification
  const [showShareNotification, setShowShareNotification] = useState(false);
  // State for fullscreen mode
  const [fullScreen, setFullScreen] = useState(false);

  // Get the image from localStorage if available
  const imageUrl = localStorage.getItem('analysisImage');

  // Confidence from AI
  const confidence = analysisResult && analysisResult.confidence
    ? Math.round(analysisResult.confidence * 100)
    : 65;

  const calculateOffset = (percent) => {
    const circumference = 2 * Math.PI * 45;
    return circumference - (circumference * percent / 100);
  };

  // Function to handle share button click
  const handleShare = async () => {
    const pageUrl = window.location.href;
    const shareTitle = `Gun Analysis`;
    const shareText = `Gun Analysis Results - Confidence: ${confidence}%`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: pageUrl
        });
      } catch (err) {
        // ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(pageUrl);
        setShowShareNotification(true);
        setTimeout(() => setShowShareNotification(false), 3000);
      } catch (err) {
        // ignore
      }
    }
  };

  // Component to render when image is not available
  const NoImageDisplay = ({ message = "การแสดงผลภาพถ่ายมีปัญหา" }) => (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200 h-64 w-full">
      <PiImageBroken className="text-gray-400 text-5xl mb-2" />
      <p className="text-gray-500 text-center">{message}</p>
    </div>
  );

  // Loading component for API fetching
  const LoadingState = () => (
    <div className="flex justify-center items-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#990000]"></div>
      <span className="ml-3 text-gray-600">กำลังค้นหาข้อมูลอาวุธ...</span>
    </div>
  );

  // Error state when API call fails
  const ErrorState = ({ message }) => (
    <div className="p-4 text-red-600 text-sm">
      เกิดข้อผิดพลาดในการค้นหาข้อมูล: {message}
    </div>
  );

  // Render firearm information from API
  const renderFirearmInfo = () => {
    if (isLoading) {
      return <LoadingState />;
    }

    if (apiError) {
      return <ErrorState message={apiError} />;
    }

    if (!firearmInfo) {
      return (
        <div className="mt-6">
          <h4 className="font-medium mb-2 text-red-600">ไม่พบข้อมูลในฐานข้อมูล</h4>
          <p className="text-gray-500 text-sm">
            ไม่สามารถค้นหาข้อมูลอาวุธปืนนี้ จากฐานข้อมูลได้ อาจเป็นเพราะ:
          </p>
          <ul className="text-gray-500 text-sm list-disc list-inside ml-2 mt-2">
            <li>อาวุธนี้ไม่มีอยู่ในฐานข้อมูล</li>
            <li>ชื่อยี่ห้อหรือรุ่นไม่ตรงกับในฐานข้อมูล</li>
            <li>อาจมีปัญหาในการเชื่อมต่อกับฐานข้อมูล</li>
          </ul>
          <p className="mt-4 text-sm">
            <span className="font-medium">ยี่ห้อที่ระบบตรวจพบ:</span> {analysisResult?.brandName || 'ไม่ทราบ'}
          </p>
          <p className="text-sm">
            <span className="font-medium">รุ่นที่ระบบตรวจพบ:</span> {analysisResult?.modelName || 'ไม่ทราบ'}
          </p>
        </div>
      );
    }
    return (
      <div className="mt-6">
        <div className="py-2 flex"><span className="text-gray-600 w-40">ยี่ห้อ:</span> <span>{firearmInfo.brand}</span></div>
        <div className="py-2 flex"><span className="text-gray-600 w-40">ซีรีส์:</span> <span>{firearmInfo.series || '-'}</span></div>
        <div className="py-2 flex"><span className="text-gray-600 w-40">รุ่น:</span> <span>{firearmInfo.model}</span></div>
        <div className="py-2 flex"><span className="text-gray-600 w-40">กลไก:</span> <span>{firearmInfo.mechanism}</span></div>
        {firearmInfo.exhibit && (
          <>
            <div className="py-2 flex"><span className="text-gray-600 w-40">หมวดหมู่:</span> <span>{firearmInfo.exhibit.category}</span></div>
            <div className="py-2 flex"><span className="text-gray-600 w-40">ประเภทย่อย:</span> <span>{firearmInfo.exhibit.subcategory}</span></div>
          </>
        )}
      </div>
    );
  };

  // Desktop version
  const DesktopView = () => (
    <div className="hidden md:flex flex-row h-full w-full">
      {/* Left column - Gun image */}
      <div className="w-1/2 p-6 flex justify-center items-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="อาวุธปืน"
            className="max-w-full h-auto object-contain max-h-96 cursor-pointer"
            onClick={() => setFullScreen(true)}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : (
          <NoImageDisplay />
        )}
        <div className="hidden flex-col items-center justify-center">
          <NoImageDisplay message="การแสดงผลภาพผิดพลาด" />
        </div>
      </div>

      {/* Right column - Gun details */}
      <div className="w-1/2 p-6 flex flex-col justify-between h-full">
        {/* Top section with title and share button */}
        <div>
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <h2 className="text-2xl font-medium">
              {firearmInfo ? (
                <>
                  {firearmInfo.brand && <span>{firearmInfo.brand}</span>}
                  {firearmInfo.series && <span className="ml-2">{firearmInfo.series}</span>}
                  {firearmInfo.model && <span className="ml-2">{firearmInfo.model}</span>}
                </>
              ) : (
                <>อาวุธปืน {analysisResult?.brandName && <span>{analysisResult.brandName}</span>} {analysisResult?.modelName && <span className="ml-1">{analysisResult.modelName}</span>}</>
              )}
            </h2>
            <button
              className="text-gray-600 hover:text-gray-800 focus:outline-none"
              onClick={handleShare}
              aria-label="แชร์"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>

          {/* Details section with confidence meter to the right */}
          <div className="mb-8">
            <div className="flex flex-row">
              {/* Details column */}
              <div className="space-y-4 w-1/2">
                <h3 className="text-xl font-medium mb-4">รายละเอียด</h3>
                {renderFirearmInfo()}
              </div>

              {/* Confidence meter on the right */}
              <div className="flex flex-col items-center justify-top w-1/2">
                <div className="w-24 h-24 relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#e6e6e6"
                      strokeWidth="8"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#8B0000"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 45}
                      strokeDashoffset={calculateOffset(confidence)}
                      transform="rotate(-90 50 50)"
                    />
                    {/* Text in the middle */}
                    <text
                      x="50"
                      y="50"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="20"
                      fontWeight="bold"
                      fill="#8B0000"
                    >
                      {confidence}%
                    </text>
                  </svg>
                </div>
                <div className="mt-2">
                  <p className="text-gray-600">ความมั่นใจ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile version
  const MobileView = () => (
    <div className="flex md:hidden flex-col h-full w-full">
      {/* Gun image */}
      <div className="p-4 flex justify-center items-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="อาวุธปืน"
            className="max-w-full h-auto object-contain max-h-60 cursor-pointer"
            onClick={() => setFullScreen(true)}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : (
          <NoImageDisplay />
        )}
        <div className="hidden flex-col items-center justify-center">
          <NoImageDisplay message="การแสดงผลภาพผิดพลาด" />
        </div>
      </div>

      {/* Gun title with share button */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-medium">
          {firearmInfo ? (
            <>
              {firearmInfo.brand && <span>{firearmInfo.brand}</span>}
              {firearmInfo.series && <span className="ml-2">{firearmInfo.series}</span>}
              {firearmInfo.model && <span className="ml-2">{firearmInfo.model}</span>}
            </>
          ) : (
            <>อาวุธปืน {analysisResult?.brandName && <span>{analysisResult.brandName}</span>} {analysisResult?.modelName && <span className="ml-1">{analysisResult.modelName}</span>}</>
          )}
        </h2>
        <button
          className="text-gray-600 hover:text-gray-800 focus:outline-none"
          onClick={handleShare}
          aria-label="แชร์"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>

      {/* Details section with confidence meter on right side */}
      <div className="px-4 mt-4">
        <div className="flex items-start">
          {/* Details on left */}
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-2">รายละเอียด</h3>
            {isLoading ? (
              <LoadingState />
            ) : apiError ? (
              <ErrorState message={apiError} />
            ) : !firearmInfo ? (
              <div className="py-2">
                <span className="text-red-600 font-medium">ไม่พบข้อมูลในฐานข้อมูล</span>
                <p className="text-gray-500 text-sm mt-2">
                  ไม่สามารถค้นหาข้อมูลอาวุธปืนนี้ จากฐานข้อมูลได้
                </p>
                <p className="mt-4 text-sm">
                  <span className="font-medium">ยี่ห้อที่ระบบตรวจพบ:</span> {analysisResult?.brandName || 'ไม่ทราบ'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">รุ่นที่ระบบตรวจพบ:</span> {analysisResult?.modelName || 'ไม่ทราบ'}
                </p>
              </div>
            ) : (
              <>
                <div className="py-2 flex">
                  <span className="text-gray-600 w-32">ยี่ห้อ:</span> 
                  <span className="font-medium">{firearmInfo.brand}</span>
                </div>
                <div className="py-2 flex">
                  <span className="text-gray-600 w-32">ซีรีส์:</span> 
                  <span className="font-medium">{firearmInfo.series || '-'}</span>
                </div>
                <div className="py-2 flex">
                  <span className="text-gray-600 w-32">รุ่น:</span> 
                  <span className="font-medium">{firearmInfo.model}</span>
                </div>
                <div className="py-2 flex">
                  <span className="text-gray-600 w-32">กลไก:</span> 
                  <span className="font-medium">{firearmInfo.mechanism}</span>
                </div>
                {firearmInfo.exhibit && (
                  <>
                    <div className="py-2 flex">
                      <span className="text-gray-600 w-32">หมวดหมู่:</span> 
                      <span className="font-medium">{firearmInfo.exhibit.category}</span>
                    </div>
                    <div className="py-2 flex">
                      <span className="text-gray-600 w-32">ประเภทย่อย:</span> 
                      <span className="font-medium">{firearmInfo.exhibit.subcategory}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          
          {/* Confidence meter on right */}
          <div className="ml-4 flex-shrink-0">
            <div className="w-20 h-20 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e6e6e6"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#8B0000"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={calculateOffset(confidence)}
                  transform="rotate(-90 50 50)"
                />
                <text
                  x="50"
                  y="50"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="20"
                  fontWeight="bold"
                  fill="#8B0000"
                >
                  {confidence}%
                </text>
              </svg>
            </div>
            <div className="text-center mt-1">
              <p className="text-gray-600 text-sm">ความมั่นใจ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white w-full h-full flex flex-col relative">
      <DesktopView />
      <MobileView />

      {/* Full Screen Modal for Image */}
      {fullScreen && imageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
          {/* ปุ่มปิด Full Screen */}
          <button 
            className="absolute top-4 right-4 text-white text-3xl p-2 bg-gray-800 rounded-full"
            onClick={() => setFullScreen(false)}
          >
            <IoClose />
          </button>
          
          {/* ภาพที่ขยายเต็มจอ */}
          <img src={imageUrl} alt="Full Screen" className="max-w-full max-h-[80vh] object-contain mb-4 px-4" />
        </div>
      )}

      {/* Share notification toast */}
      {showShareNotification && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
          คัดลอกลิงก์สำเร็จแล้ว
        </div>
      )}
    </div>
  );
};

export default GunProfile;