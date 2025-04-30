import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiConfig from '../../config/api';

const API_PATH = '/api';

const GunHistoryProfile = ({ item }) => {
  const [showShareNotification, setShowShareNotification] = useState(false);
  const [detailedData, setDetailedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistoryDetails = async () => {
      if (!item || !item.id) {
        console.log("No item ID provided for fetching details");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${apiConfig.baseUrl}${API_PATH}/history/${item.id}`);
        const data = response.data;
        setDetailedData(data);
        
        // Log the detailed data to console
        console.log('Fetched history item details:', data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching history item details:', err);
        setError('Failed to load item details');
        setLoading(false);
      }
    };

    fetchHistoryDetails();
  }, [item]);

  const calculateOffset = (percent) => {
    const circumference = 2 * Math.PI * 45;
    // คูณ confidence_percentage ด้วย 100
    const confidence = (detailedData?.confidence_percentage || 0) * 100;
    return circumference - (circumference * confidence / 100);
  };

  const handleShare = async () => {
    const pageUrl = window.location.href;
    const shareTitle = `Gun Analysis: ${item?.name || ''}`;
    const shareText = `Gun Analysis Results - Type: ${item?.category || ''}, Confidence: ${detailedData?.confidence_percentage || 0}%`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: pageUrl
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(pageUrl);
        setShowShareNotification(true);
        setTimeout(() => setShowShareNotification(false), 3000);
      } catch (err) {
        console.error('Could not copy URL:', err);
      }
    }
  };

  // Desktop version
  const DesktopView = () => (
    <div className="hidden md:flex flex-row h-full w-full">
      {/* Left column - Gun image */}
      <div className="w-1/2 p-6 flex justify-center items-center">
        <img
          src={detailedData?.image_url || item?.image}
          alt="อาวุธปืน" 
          className="max-w-full h-auto object-contain max-h-96"
        />
      </div>

      {/* Right column - Gun details */}
      <div className="w-1/2 p-6 flex flex-col justify-between h-full">
        {/* Top section with title and share button */}
        <div>
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <h2 className="text-2xl font-medium">{item?.name}</h2>
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
                <div className="flex">
                  <span className="text-gray-600 w-40">ประเภท:</span> 
                  <span>{detailedData?.exhibit?.subcategory || item?.subcategory || ''}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-40">กลไก:</span> 
                  <span>{detailedData?.exhibit?.firearm?.mechanism || item?.firearm?.mechanism || ''}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-40">ยี่ห้อ:</span> 
                  <span>{detailedData?.exhibit?.firearm?.brand || ''}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-40">ซีรี่ส์:</span> 
                  <span>{detailedData?.exhibit?.firearm?.series || ''}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-40">โมเดล:</span> 
                  <span>{detailedData?.exhibit?.firearm?.model || ''}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-40">จุดสังเกตเลขประจำปืน:</span> 
                  <span>{detailedData?.exhibit?.firearm?.serial_info || ''}</span>
                </div>

                <h3 className="text-xl font-medium mb-4">สถานที่พบ</h3>
                <div className="flex">
                  <span className="text-gray-600 w-40">จังหวัด:</span> 
                  <span>{detailedData?.province_name || ''}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-40">อำเภอ:</span> 
                  <span>{detailedData?.district_name || ''}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-40">ตำบล:</span> 
                  <span>{detailedData?.subdistrict_name || ''}</span>
                </div>

                <h3 className="text-xl font-medium mb-4">สภ.ที่พบ</h3>
                <div className="flex">
                  <span className="text-gray-600 w-40">ชื่อสภ:</span> 
                  <span>{detailedData?.place_name || ''}</span>
                </div>
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
                    
                    {/* Progress circle - going clockwise */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke="#8B0000" 
                      strokeWidth="8" 
                      strokeDasharray={2 * Math.PI * 45} 
                      strokeDashoffset={calculateOffset()} 
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
                      {((detailedData?.confidence_percentage || 0) * 100).toFixed(0)}%
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

        {/* Bottom section */}
        <div className="mt-auto">
          {/* You can add buttons or additional information here */}
        </div>
      </div>
    </div>
  );

  // Mobile version
  const MobileView = () => (
    <div className="flex md:hidden flex-col h-full w-full">
      {/* Gun image */}
      <div className="p-4 flex justify-center items-center">
        <img 
          src={detailedData?.image_url || item?.image}
          alt="อาวุธปืน" 
          className="max-w-full h-auto object-contain max-h-60"
        />
      </div>

      {/* Gun title with share button */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-medium">{item?.name}</h2>
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
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">ประเภท:</span> 
              <span className="font-medium">{detailedData?.exhibit?.subcategory || item?.subcategory || ''}</span>
            </div>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">กลไก:</span> 
              <span className="font-medium">{detailedData?.exhibit?.firearm?.mechanism || item?.firearm?.mechanism || ''}</span>
            </div>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">ยี่ห้อ:</span> 
              <span className="font-medium">{detailedData?.exhibit?.firearm?.brand || '-'}</span>
            </div>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">ซีรี่ส์:</span> 
              <span className="font-medium">{detailedData?.exhibit?.firearm?.series || '-'}</span>
            </div>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">โมเดล:</span> 
              <span className="font-medium">{detailedData?.exhibit?.firearm?.model || '-'}</span>
            </div>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">จุดสังเกตเลขประจำปืน:</span> 
              <span className="font-medium">{detailedData?.exhibit?.firearm?.serial_info || '-'}</span>
            </div>

            <h3 className="text-lg font-medium mb-2">สถานที่พบ</h3>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">จังหวัด:</span> 
              <span className="font-medium">{detailedData?.province_name || ''}</span>
            </div>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">อำเภอ:</span> 
              <span className="font-medium">{detailedData?.district_name || ''}</span>
            </div>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">ตำบล:</span> 
              <span className="font-medium">{detailedData?.subdistrict_name || ''}</span>
            </div>

            <h3 className="text-lg font-medium mb-2">สภ.ที่พบ</h3>
            <div className="py-2 flex">
              <span className="text-gray-600 w-32">ชื่อสภ:</span> 
              <span className="font-medium">{detailedData?.place_name || ''}</span>
            </div>
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
                  strokeDashoffset={calculateOffset()} 
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
                  {((detailedData?.confidence_percentage || 0) * 100).toFixed(0)}%
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

  if (loading) {
    return (
      <div className="bg-white w-full h-full flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white w-full h-full flex justify-center items-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white w-full h-full flex flex-col relative">
      <DesktopView />
      <MobileView />
      
      {/* Share notification toast */}
      {showShareNotification && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
          คัดลอกลิงก์สำเร็จแล้ว
        </div>
      )}
    </div>
  );
};

export default GunHistoryProfile;