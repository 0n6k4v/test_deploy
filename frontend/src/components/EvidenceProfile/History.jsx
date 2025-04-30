import React, { useState, useEffect, useCallback } from "react";
import { FiFilter, FiPlus, FiEye, FiEdit, FiTrash, FiMapPin, FiCalendar, FiTag, FiArrowLeft, FiChevronLeft, FiChevronRight, FiX, FiChevronDown, FiChevronUp, FiLoader } from "react-icons/fi";
import { PiImageBroken } from "react-icons/pi";
import axios from 'axios';
import SearchableDropdown from '../Record/SearchableDropdown';
import { useNavigate } from 'react-router-dom';
import apiConfig from '../../config/api';

const API_PATH = '/api';

// --- Date Parsing (BE to CE) ---
const parseDateBE = (dateString) => {
  if (!dateString) return null;
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const yearBE = parseInt(parts[2], 10);
  const yearCE = yearBE - 543;

  if (isNaN(day) || isNaN(month || isNaN(yearCE)) || isNaN(yearCE)) return null;

  // Create date in UTC to avoid timezone issues during comparisons
  const date = new Date(Date.UTC(yearCE, month, day));
  // Check if the constructed date is valid (e.g., avoids Feb 30th)
  if (date.getUTCFullYear() !== yearCE || date.getUTCMonth() !== month || date.getUTCDate() !== day) {
      return null;
  }
  return date;
};

// Format dates from API (YYYY-MM-DD) to Thai format (DD/MM/YYYY BE)
const formatDateToBE = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const yearCE = date.getFullYear();
    const yearBE = yearCE + 543;
    return `${day}/${month}/${yearBE}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

// --- Filter Pop Up ---
const FilterPopup = ({ 
    isOpen, 
    onClose, 
    filters, 
    onFilterChange, 
    onClearFilters, 
    onApplyFilters,
    preloadedData = null // Add new prop for preloaded data
}) => {
  // Create a local state to track filter changes before applying
  const [localFilters, setLocalFilters] = useState(filters);
  // State to manage collapsible sections (all open by default)
  const [sectionsOpen, setSectionsOpen] = useState({
    date: true,
    location: true,
  });
  
  // Use preloaded data if available, otherwise use local state
  const [provinceList, setProvinceList] = useState(preloadedData?.provinceList || []);
  const [districtList, setDistrictList] = useState(preloadedData?.districtList || []);
  const [subdistrictList, setSubdistrictList] = useState(preloadedData?.subdistrictList || []);
  
  const [provinces, setProvinces] = useState(preloadedData?.provinces || []);
  const [districts, setDistricts] = useState(preloadedData?.districts || []);
  const [subdistricts, setSubdistricts] = useState(preloadedData?.subdistricts || []);
  
  const [loading, setLoading] = useState(preloadedData ? preloadedData.loading : false);

  // State for custom date range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Fetch location data only if not preloaded
  useEffect(() => {
    if (isOpen && !preloadedData && provinces.length === 0) {
      setLoading(true);
      Promise.all([
        axios.get(`${apiConfig.baseUrl}${API_PATH}/provinces`),
        axios.get(`${apiConfig.baseUrl}${API_PATH}/districts`),
        axios.get(`${apiConfig.baseUrl}${API_PATH}/subdistricts`)
      ]).then(([provincesRes, districtsRes, subdistrictsRes]) => {
        setProvinceList(provincesRes.data);
        setProvinces(provincesRes.data.map(p => ({
          value: p.province_name,
          label: p.province_name,
          id: p.id
        })));
        setDistrictList(districtsRes.data);
        setSubdistrictList(subdistrictsRes.data);
        setLoading(false);
      }).catch(err => {
        console.error("Failed to fetch location data:", err);
        setLoading(false);
      });
    }
  }, [isOpen, provinces.length, preloadedData]);

  // Update local filters when props change (e.g., when filters are cleared externally)
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Update local filters and reset sections when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
      
      // Set startDate and endDate from previous filters
      if (filters.customDateRange) {
        setStartDate(filters.customDateRange.startDate || '');
        setEndDate(filters.customDateRange.endDate || '');
      } else {
        setStartDate('');
        setEndDate('');
      }
      
      // If province is selected, load districts
      if (filters.province && provinceList.length > 0) {
        const provinceObj = provinceList.find(p => p.province_name === filters.province);
        if (provinceObj) {
          const filteredDistricts = districtList.filter(d => d.province_id === provinceObj.id);
          setDistricts(filteredDistricts.map(d => ({
            value: d.district_name || d.amphoe_t,
            label: d.district_name || d.amphoe_t,
            id: d.id
          })));
          
          // If district is selected, load subdistricts
          if (filters.district) {
            const districtObj = districtList.find(d => 
              (d.district_name || d.amphoe_t) === filters.district && 
              d.province_id === provinceObj.id
            );
            if (districtObj) {
              const filteredSubdistricts = subdistrictList.filter(sd => sd.district_id === districtObj.id);
              setSubdistricts(filteredSubdistricts.map(sd => ({
                value: sd.subdistrict_name || sd.tambon_t,
                label: sd.subdistrict_name || sd.tambon_t,
                id: sd.id
              })));
            }
          }
        }
      }
    }
  }, [isOpen, filters, provinceList, districtList, subdistrictList]);

  if (!isOpen) return null;

  // Handler to toggle section visibility
  const toggleSection = (sectionName) => {
    setSectionsOpen(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  // Handler for date range radio/checkbox changes
  const handleDateRangeChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      // When a preset range is checked, clear customDate
      setLocalFilters({ ...localFilters, dateRange: value, customDate: '' });
    } else {
      // If the currently selected range is unchecked, clear it
      if (localFilters.dateRange === value) {
        setLocalFilters({ ...localFilters, dateRange: null });
      }
    }
  };
  
  // Handler for custom date change
  const handleCustomDateChange = (e) => {
    // When custom date is set, clear preset dateRange
    setLocalFilters({ ...localFilters, customDate: e.target.value, dateRange: null });
  };
  
  // Handlers for location
  const handleProvinceChange = (e) => {
    const province = e.target.value;
    // Reset district and subdistrict when province changes
    setLocalFilters({ 
      ...localFilters, 
      province: province,
      district: '',
      subdistrict: '' 
    });
    
    // Load districts for selected province
    const provinceObj = provinceList.find(p => p.province_name === province);
    if (provinceObj) {
      const filteredDistricts = districtList.filter(d => d.province_id === provinceObj.id);
      setDistricts(filteredDistricts.map(d => ({
        value: d.district_name || d.amphoe_t,
        label: d.district_name || d.amphoe_t,
        id: d.id
      })));
      setSubdistricts([]);
    } else {
      setDistricts([]);
      setSubdistricts([]);
    }
  };
  
  const handleDistrictChange = (e) => {
    const district = e.target.value;
    // Reset subdistrict when district changes
    setLocalFilters({ 
      ...localFilters, 
      district: district,
      subdistrict: '' 
    });
    
    // Load subdistricts for selected district and province
    const provinceObj = provinceList.find(p => p.province_name === localFilters.province);
    if (provinceObj) {
      const districtObj = districtList.find(d => 
        (d.district_name || d.amphoe_t) === district && 
        d.province_id === provinceObj.id
      );
      if (districtObj) {
        const filteredSubdistricts = subdistrictList.filter(sd => sd.district_id === districtObj.id);
        setSubdistricts(filteredSubdistricts.map(sd => ({
          value: sd.subdistrict_name || sd.tambon_t,
          label: sd.subdistrict_name || sd.tambon_t,
          id: sd.id
        })));
      } else {
        setSubdistricts([]);
      }
    }
  };
  
  const handleSubdistrictChange = (e) => {
    const subdistrict = e.target.value;
    setLocalFilters({ 
      ...localFilters, 
      subdistrict: subdistrict 
    });
  };
  
  // Handle apply filters
  const handleApplyFilters = () => {
    // Create updated filters object including custom date range
    const updatedFilters = {
      ...localFilters,
      customDateRange: (startDate || endDate) ? {
        startDate,
        endDate: endDate || startDate // Use startDate if endDate is not provided
      } : null
    };
    
    // Clear other date selections if custom date range is selected
    if (startDate || endDate) {
      updatedFilters.dateRange = null;
      updatedFilters.customDate = '';
    }
    
    onApplyFilters(updatedFilters);
    onClose(); // Close after applying
  };
  
  // Handle clear filters
  const handleClearInternal = () => {
    setStartDate('');
    setEndDate('');
    onClearFilters();
  };
  
  // Handle close without applying
  const handleClose = () => {
    // Reset local state to reflect the currently applied filters before closing
    setLocalFilters(filters);
    onClose();
  };

  return (
    // Modal backdrop: Full screen
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full h-full md:w-full md:h-[70vh] md:max-w-[650px] md:max-h-[90vh] md:rounded-lg shadow-lg flex flex-col overflow-hidden">

        {/* Header: Title + Close Button */}
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
           <h2 className="text-xl md:text-2xl font-semibold">เลือกตัวกรองผลลัพธ์</h2>
           <button
             onClick={handleClose}
             className="text-gray-500 hover:text-gray-700"
           >
             <FiX size={24} />
           </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4">
          {/* --- Collapsible Section: Date --- */}
          <div className="border-b pb-4">
            <button
              onClick={() => toggleSection('date')}
              className="flex justify-between items-center w-full font-semibold mb-3 text-left"
            >
              วัน/เดือน/ปี
              {sectionsOpen.date ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
            </button>
            {sectionsOpen.date && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
                  {[
                    { value: 'today', label: 'วันนี้' },
                    { value: 'last7days', label: '7 วันล่าสุด' },
                    { value: 'last1month', label: '1 เดือนล่าสุด' },
                    { value: 'last6months', label: '6 เดือนล่าสุด' },
                    { value: 'last1year', label: '1 ปีล่าสุด' },
                  ].map(option => (
                    <label key={option.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-[#b30000]"
                        value={option.value}
                        checked={localFilters.dateRange === option.value}
                        onChange={handleDateRangeChange}
                      /> {option.label}
                    </label>
                  ))}
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="font-normal">กำหนดช่วงวันที่เอง</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <label className="text-sm text-gray-600 mb-1 block">จากวันที่</label>
                      <input
                        type="date"
                        className="p-2 border rounded-lg w-full focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (localFilters.dateRange) {
                            setLocalFilters({ ...localFilters, dateRange: null });
                          }
                        }}
                        max={endDate || undefined}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm text-gray-600 mb-1 block">ถึงวันที่</label>
                      <input
                        type="date"
                        className="p-2 border rounded-lg w-full focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          if (localFilters.dateRange) {
                            setLocalFilters({ ...localFilters, dateRange: null });
                          }
                        }}
                        min={startDate || undefined}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* --- Collapsible Section: Location --- */}
          <div className="pb-4">
            <button
              onClick={() => toggleSection('location')}
              className="flex justify-between items-center w-full font-semibold mb-3 text-left"
            >
              จังหวัด/อำเภอ/ตำบล
              {sectionsOpen.location ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
            </button>
            {sectionsOpen.location && (
              <div className="space-y-4 relative">
                {loading ? (
                  <div className="flex justify-center py-4">
                    <FiLoader className="animate-spin text-[#b30000]" size={24} />
                    <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="relative z-30">
                      <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
                      <SearchableDropdown
                        options={provinces}
                        value={localFilters.province}
                        onChange={handleProvinceChange}
                        placeholder="กรอกหรือเลือกจังหวัด"
                      />
                    </div>
                    <div className="relative z-20">
                      <label className="block text-sm font-medium text-gray-700 mb-1">อำเภอ</label>
                      <SearchableDropdown
                        options={districts}
                        value={localFilters.district}
                        onChange={handleDistrictChange}
                        placeholder="กรอกหรือเลือกอำเภอ"
                        disabled={!localFilters.province}
                      />
                    </div>
                    <div className="relative z-10"> {/* Add lower z-index to this div */}
                      <label className="block text-sm font-medium text-gray-700 mb-1">ตำบล</label>
                      <SearchableDropdown
                        options={subdistricts}
                        value={localFilters.subdistrict}
                        onChange={handleSubdistrictChange}
                        placeholder="กรอกหรือเลือกตำบล"
                        disabled={!localFilters.district}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div> {/* End Scrollable Content Area */}

        {/* Footer: Action Buttons (Fixed Bottom) */}
        <div className="flex flex-col sm:flex-row justify-between p-4 border-t gap-3 flex-shrink-0 bg-white relative">
          <button
            onClick={handleClearInternal}
            className="w-full sm:w-auto px-4 py-2 border rounded-lg text-[#b30000] border-[#b30000] hover:bg-red-50 order-2 sm:order-1"
          >
            ล้างการคัดกรองทั้งหมด
          </button>
          <button
            onClick={handleApplyFilters}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#b30000] text-white hover:bg-[#990000] order-1 sm:order-2"
          >
            คัดกรองผลลัพธ์
          </button>
        </div>
      </div> {/* End Modal Content */}
    </div> // End Modal Backdrop
  );
};

// --- Initial Filters ---
const initialFilters = {
  dateRange: null,
  customDate: '',
  customDateRange: null, // เพิ่ม field ใหม่
  province: '',
  district: '',
  subdistrict: '',
};

// --- Main History Component ---
const History = ({ firearmInfo }) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    // 'filters' now represents the state *before* applying, used to populate the popup
    const [filters, setFilters] = useState(initialFilters);
    // 'appliedFilters' represents the currently active filters used for data filtering
    const [appliedFilters, setAppliedFilters] = useState(initialFilters);
    const [historyData, setHistoryData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Add state for location data
    const [provinceList, setProvinceList] = useState([]);
    const [districtList, setDistrictList] = useState([]);
    const [subdistrictList, setSubdistrictList] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [subdistricts, setSubdistricts] = useState([]);
    const [locationLoading, setLocationLoading] = useState(false);

    const navigate = useNavigate();

    const handleViewDetail = (item) => {
        navigate('/history/detail', { 
            state: { 
                item: {
                    ...item,
                    originalData: item.originalData || {}
                }
            } 
        });
    };

    // Fetch location data when component mounts
    useEffect(() => {
        const fetchLocationData = async () => {
            try {
                setLocationLoading(true);
                const [provincesRes, districtsRes, subdistrictsRes] = await Promise.all([
                    axios.get(`${apiConfig.baseUrl}${API_PATH}/provinces`),
                    axios.get(`${apiConfig.baseUrl}${API_PATH}/districts`),
                    axios.get(`${apiConfig.baseUrl}${API_PATH}/subdistricts`)
                ]);

                setProvinceList(provincesRes.data);
                setProvinces(provincesRes.data.map(p => ({
                    value: p.province_name,
                    label: p.province_name,
                    id: p.id
                })));
                setDistrictList(districtsRes.data);
                setSubdistrictList(subdistrictsRes.data);
                setLocationLoading(false);
            } catch (err) {
                console.error("Failed to fetch location data:", err);
                setLocationLoading(false);
            }
        };

        fetchLocationData();
    }, []);

    // --- Fetch history data from API ---
    useEffect(() => {
        const fetchHistoryData = async () => {
            if (!firearmInfo || !firearmInfo.exhibit_id) {
                setLoading(false);
                setError("No exhibit ID provided");
                return;
            }

            try {
                setLoading(true);
                setError(null);
                
                // ใช้ ID จาก firearmInfo เพื่อดึงข้อมูลประวัติ
                const exhibitId = firearmInfo.exhibit_id;
                
                // ปรับ URL API ให้ถูกต้อง - ต้องเปลี่ยนเป็น URL ที่ถูกต้องของระบบคุณ
                const response = await axios.get(`${apiConfig.baseUrl}${API_PATH}/history/exhibit/${exhibitId}`);
                
                // ตรวจสอบว่ามีข้อมูลหรือไม่
                if (!response.data) {
                    setError("ไม่พบข้อมูลประวัติ");
                    setLoading(false);
                    return;
                }
                
                // ตรวจสอบโครงสร้างข้อมูล
                if (typeof response.data === 'string' || 
                    (Array.isArray(response.data) && typeof response.data[0] === 'string')) {
                    console.error("API returned HTML instead of JSON");
                    setError("ได้รับข้อมูลในรูปแบบที่ไม่ถูกต้อง โปรดตรวจสอบ API endpoint");
                    setLoading(false);
                    return;
                }
                
                const historyItems = Array.isArray(response.data) ? response.data : [response.data];
                
                // แปลงข้อมูล
                const formattedData = historyItems.map(item => ({
                    id: item.id,
                    date: formatDateToBE(item.date),
                    time: item.time ? item.time.substring(0, 5) : '',
                    category: item.exhibit?.category || 'อาวุธปืน',
                    image: item.image_url || (item.exhibit?.images?.[0]?.image_url || ''),
                    name: item.exhibit?.firearm?.brand
                        ? `${item.exhibit.firearm.brand} ${item.exhibit.firearm.series || ''} ${item.exhibit.firearm.model || ''}`.trim()
                        : 'ไม่ระบุรุ่น',
                    place_name: item.place_name || 'ไม่ระบุชื่อสถานที่',
                    location: [item.province_name, item.district_name, item.subdistrict_name]
                        .filter(Boolean)
                        .join(', ') || 'ไม่ระบุสถานที่',
                    originalData: item
                }));
                
                setHistoryData(formattedData);
                setFilteredData(formattedData);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching history data:", err);
                setError(err.response?.data?.error || "Failed to fetch history data");
                setLoading(false);
            }
        };

        fetchHistoryData();
    }, [firearmInfo]);

    // --- Filtering Logic ---
    useEffect(() => {
      if (historyData.length === 0) return;
      
      let data = [...historyData]; // Start with original data
  
      // 1. Filter by Date
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
  
      if (appliedFilters.dateRange) {
        let startDate = new Date(today);
        switch (appliedFilters.dateRange) {
            case 'today':
                // Start date is already today
                break;
            case 'last7days':
                startDate.setUTCDate(today.getUTCDate() - 7);
                break;
            case 'last1month':
                startDate.setUTCMonth(today.getUTCMonth() - 1);
                break;
            case 'last6months':
                 startDate.setUTCMonth(today.getUTCMonth() - 6);
                break;
            case 'last1year':
                startDate.setUTCFullYear(today.getUTCFullYear() - 1);
                break;
            default:
                startDate = null;
        }
  
        if (startDate) {
          // Filter items with date >= startDate and <= today
          data = data.filter(item => {
             const itemDate = parseDateBE(item.date);
             return itemDate && itemDate >= startDate && itemDate <= today;
         });
       }
      } else if (appliedFilters.customDateRange) {
        // Filter by custom date range
        try {
          let startDateFilter = null;
          let endDateFilter = null;
          
          if (appliedFilters.customDateRange.startDate) {
            const [startYear, startMonth, startDay] = appliedFilters.customDateRange.startDate.split('-').map(Number);
            startDateFilter = new Date(Date.UTC(startYear, startMonth - 1, startDay));
          }
          
          if (appliedFilters.customDateRange.endDate) {
            const [endYear, endMonth, endDay] = appliedFilters.customDateRange.endDate.split('-').map(Number);
            // Set end date to end of day for inclusive filtering
            endDateFilter = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999));
          }
          
          if (startDateFilter && endDateFilter) {
            // Filter between start and end
            data = data.filter(item => {
              const itemDate = parseDateBE(item.date);
              return itemDate && itemDate >= startDateFilter && itemDate <= endDateFilter;
            });
          } else if (startDateFilter) {
            // Filter from start date only
            data = data.filter(item => {
              const itemDate = parseDateBE(item.date);
              return itemDate && itemDate >= startDateFilter;
            });
          } else if (endDateFilter) {
            // Filter until end date only
            data = data.filter(item => {
              const itemDate = parseDateBE(item.date);
              return itemDate && itemDate <= endDateFilter;
            });
          }
        } catch (e) {
          console.error("Error parsing custom date range:", e);
        }
      } else if (appliedFilters.customDate) {
        // โค้ดเดิมสำหรับ customDate ที่มีอยู่แล้ว...
      }
  
      // 2. Filter by Location (now using exact matches)
      if (appliedFilters.province) {
        data = data.filter(item => {
          const locationParts = item.location.split(', ');
          // Check if province exists in the location string
          return locationParts.some(part => 
            part === appliedFilters.province || 
            part.includes(appliedFilters.province)
          );
        });
      }
      
      if (appliedFilters.district) {
        data = data.filter(item => {
          const locationParts = item.location.split(', ');
          // Check if district exists in the location string
          return locationParts.some(part => 
            part === appliedFilters.district || 
            part.includes(appliedFilters.district)
          );
        });
      }
      
      if (appliedFilters.subdistrict) {
        data = data.filter(item => {
          const locationParts = item.location.split(', ');
          // Check if subdistrict exists in the location string
          return locationParts.some(part => 
            part === appliedFilters.subdistrict || 
            part.includes(appliedFilters.subdistrict)
          );
        });
      }
  
      setFilteredData(data);
      setCurrentPage(1); // Reset page when filters change
    }, [appliedFilters, historyData]);

    // --- Helper function to generate readable filter label ---
    const getFilterLabels = () => {
      const labels = [];
      if (appliedFilters.dateRange) {
          const dateLabels = { 'today': 'วันนี้', 'last7days': '7 วันล่าสุด', 'last1month': '1 เดือนล่าสุด', 'last6months': '6 เดือนล่าสุด', 'last1year': '1 ปีล่าสุด' };
          labels.push({ type: 'date', value: appliedFilters.dateRange, label: dateLabels[appliedFilters.dateRange] });
      } else if (appliedFilters.customDateRange) {
          // Format dates for display
          let dateRangeLabel = '';
          const startDate = appliedFilters.customDateRange.startDate ? 
            new Date(appliedFilters.customDateRange.startDate).toLocaleDateString('th-TH', {day: '2-digit', month: 'short', year: '2-digit'}) : '';
          
          const endDate = appliedFilters.customDateRange.endDate ? 
            new Date(appliedFilters.customDateRange.endDate).toLocaleDateString('th-TH', {day: '2-digit', month: 'short', year: '2-digit'}) : '';
          
          if (startDate && endDate) {
            dateRangeLabel = `${startDate} - ${endDate}`;
          } else if (startDate) {
            dateRangeLabel = `จากวันที่ ${startDate}`;
          } else if (endDate) {
            dateRangeLabel = `ถึงวันที่ ${endDate}`;
          }
          
          labels.push({ type: 'date', value: 'customRange', label: `วันที่: ${dateRangeLabel}` });
      } else if (appliedFilters.customDate) {
          // โค้ดเดิมสำหรับ customDate ที่มีอยู่แล้ว...
      }
      if (appliedFilters.province) { labels.push({ type: 'location', value: 'province', label: `จังหวัด: ${appliedFilters.province}` }); }
      if (appliedFilters.district) { labels.push({ type: 'location', value: 'district', label: `อำเภอ: ${appliedFilters.district}` }); }
      if (appliedFilters.subdistrict) { labels.push({ type: 'location', value: 'subdistrict', label: `ตำบล: ${appliedFilters.subdistrict}` }); }
      return labels;
    };
    
    // --- Remove a single filter tag ---
    const removeFilter = (type, value) => {
        const newFilters = { ...appliedFilters };
        if (type === 'category') { newFilters.categories = newFilters.categories.filter(cat => cat !== value); }
        else if (type === 'date') { 
            if (value === 'customRange') {
                newFilters.customDateRange = null;
            } else if (value === 'custom') {
                newFilters.customDate = '';
            } else {
                newFilters.dateRange = null;
            }
        }
        else if (type === 'location') { newFilters[value] = ''; }
        setAppliedFilters(newFilters); // Apply the change immediately
        setFilters(newFilters); // Keep the popup state consistent
    };

    // --- Pagination Calculations ---
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    // --- Event Handlers ---
    const handlePageChange = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
    };
    const handleRowsPerPageChange = (e) => {
        setRowsPerPage(parseInt(e.target.value));
        setCurrentPage(1);
    };

    // --- Filter Handlers ---
    const handleFilterChange = useCallback((newLocalFilters) => { // Called when FilterPopup's internal state changes (before applying)
    }, []);

    // Called when clicking "คัดกรองผลลัพธ์" in FilterPopup
    const handleApplyFilters = useCallback((newAppliedFilters) => {
        setAppliedFilters(newAppliedFilters); // Set the active filters
        setFilters(newAppliedFilters); // Sync the state for the popup for next open
    }, []);

    // Called when clicking "ล้างการคัดกรองทั้งหมด" in FilterPopup
    const handleClearFilters = useCallback(() => {
        setAppliedFilters(initialFilters); // Clear active filters
        setFilters(initialFilters); // Clear state for the popup
        setIsFilterOpen(false); // Ensure popup closes
    }, []);

    // --- Filter Tags Component ---
    const FilterTags = ({ labels, onRemove }) => {
        if (labels.length === 0) return null;
        return (
            <div className="flex flex-wrap gap-2 mb-4 px-4 md:px-6"> {/* Adjusted padding */}
                {labels.map((item, index) => (
                    <div key={`${item.type}-${item.value}-${index}`} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                        <span>{item.label}</span>
                        <button onClick={() => onRemove(item.type, item.value)} className="ml-2 text-gray-500 hover:text-red-500"> <FiX size={16} /> </button>
                    </div>
                ))}
            </div>
        );
    };

    // --- Modified FilterPopup Component ---
    const FilterPopupWithData = () => {
        return (
            <FilterPopup
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                onFilterChange={handleFilterChange}
                onApplyFilters={handleApplyFilters}
                onClearFilters={handleClearFilters}
                // Pass preloaded data
                preloadedData={{
                    provinceList,
                    districtList,
                    subdistrictList,
                    provinces,
                    districts,
                    subdistricts,
                    loading: locationLoading
                }}
            />
        );
    };

    // Component to render when image is not available
    const NoImageDisplay = ({ message = "ไม่พบรูปภาพ", subMessage = "", small = false }) => (
        <div className={`flex flex-col items-center justify-center ${small ? 'p-1' : 'p-3'} bg-gray-50 rounded-lg border border-gray-200 ${small ? 'h-12 w-12' : 'h-32 w-full'}`}>
            <PiImageBroken className={`text-gray-400 ${small ? 'text-lg mb-0' : 'text-3xl mb-2'}`} />
            {!small && (
                <>
                    <p className="text-gray-500 text-xs text-center">{message}</p>
                    {subMessage && <p className="text-gray-400 text-xs text-center mt-1">{subMessage}</p>}
                </>
            )}
        </div>
    );

    // Render loading spinner
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white h-full">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b30000]"></div>
                    <p className="mt-4 text-gray-600">กำลังโหลดประวัติ...</p>
                </div>
            </div>
        );
    }

    // Render error message with refresh button
    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white h-full">
                <div className="flex flex-col items-center text-center px-4">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่สามารถโหลดข้อมูลได้</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    {!firearmInfo?.exhibit_id && (
                        <p className="text-gray-500 mb-4">ไม่พบรหัสวัตถุพยาน (Exhibit ID)</p>
                    )}
                    <button 
                        onClick={() => {
                            setLoading(true);
                            setError(null);
                            // ถ้าข้อมูลประวัติยังไม่โหลด ให้โหลดใหม่
                            if (historyData.length === 0) {
                                // ให้โหลดข้อมูลประวัติใหม่ทั้งหมด
                                const fetchHistoryData = async () => {
                                    if (!firearmInfo || !firearmInfo.exhibit_id) {
                                        setLoading(false);
                                        setError("No exhibit ID provided");
                                        return;
                                    }
                    
                                    try {
                                        // ใช้ ID จาก firearmInfo เพื่อดึงข้อมูลประวัติ
                                        const exhibitId = firearmInfo.exhibit_id;
                                        
                                        const response = await axios.get(`${apiConfig.baseUrl}${API_PATH}/history/exhibit/${exhibitId}`);
                                        
                                        // ตรวจสอบว่ามีข้อมูลหรือไม่
                                        if (!response.data) {
                                            setError("ไม่พบข้อมูลประวัติ");
                                            setLoading(false);
                                            return;
                                        }
                                        
                                        // ตรวจสอบโครงสร้างข้อมูล
                                        if (typeof response.data === 'string' || 
                                            (Array.isArray(response.data) && typeof response.data[0] === 'string')) {
                                            console.error("API returned HTML instead of JSON");
                                            setError("ได้รับข้อมูลในรูปแบบที่ไม่ถูกต้อง โปรดตรวจสอบ API endpoint");
                                            setLoading(false);
                                            return;
                                        }
                                        
                                        const historyItems = Array.isArray(response.data) ? response.data : [response.data];
                                        
                                        // แปลงข้อมูล
                                        const formattedData = historyItems.map(item => ({
                                            id: item.id,
                                            date: formatDateToBE(item.date),
                                            time: item.time ? item.time.substring(0, 5) : '',
                                            category: item.exhibit?.category || 'อาวุธปืน',
                                            image: item.image_url || (item.exhibit?.images?.[0]?.image_url || ''),
                                            name: item.exhibit?.firearm?.brand
                                                ? `${item.exhibit.firearm.brand} ${item.exhibit.firearm.series || ''} ${item.exhibit.firearm.model || ''}`.trim()
                                                : 'ไม่ระบุรุ่น',
                                            place_name: item.place_name || 'ไม่ระบุชื่อสถานที่',
                                            location: [item.province_name, item.district_name, item.subdistrict_name]
                                                .filter(Boolean)
                                                .join(', ') || 'ไม่ระบุสถานที่',
                                            originalData: item
                                        }));
                                        
                                        setHistoryData(formattedData);
                                        setFilteredData(formattedData);
                                        setLoading(false);
                                    } catch (err) {
                                        console.error("Error fetching history data:", err);
                                        setError(err.response?.data?.error || "เกิดข้อผิดพลาดในเชื่อมต่อฐานข้อมูล");
                                        setLoading(false);
                                    }
                                };
                                
                                fetchHistoryData();
                            }
                            
                            // ถ้าข้อมูลตำแหน่งยังไม่โหลด ให้โหลดใหม่
                            if (provinces.length === 0) {
                                // โหลดข้อมูลตำแหน่งใหม่
                                const fetchLocationData = async () => {
                                    try {
                                        setLocationLoading(true);
                                        const [provincesRes, districtsRes, subdistrictsRes] = await Promise.all([
                                            axios.get(`${apiConfig.baseUrl}${API_PATH}/provinces`),
                                            axios.get(`${apiConfig.baseUrl}${API_PATH}/districts`),
                                            axios.get(`${apiConfig.baseUrl}${API_PATH}/subdistricts`)
                                        ]);

                                        setProvinceList(provincesRes.data);
                                        setProvinces(provincesRes.data.map(p => ({
                                            value: p.province_name,
                                            label: p.province_name,
                                            id: p.id
                                        })));
                                        setDistrictList(districtsRes.data);
                                        setSubdistrictList(subdistrictsRes.data);
                                        setLocationLoading(false);
                                    } catch (err) {
                                        console.error("Failed to fetch location data:", err);
                                        setLocationLoading(false);
                                    }
                                };

                                fetchLocationData();
                            }
                        }}
                        className="px-4 py-2 bg-[#b30000] text-white rounded-md hover:bg-[#900000] transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                        </svg>
                        โหลดข้อมูลใหม่
                    </button>
                </div>
            </div>
        );
    }

    // --- JSX Structure (Mobile/Desktop Layouts) ---
    return (
        <div className='flex-1 overflow-auto bg-white'>
            {/* --- Mobile Display --- */}
            <div className="md:hidden">
                 {/* Headers */}
                <div className="px-4 sm:px-6 pt-4 flex justify-between items-center mb-4">
                  <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 px-3 py-2 border rounded bg-white hover:bg-gray-100 text-sm"> <FiFilter size={16} /> ตัวกรอง </button>
                </div>

                {/* Render FilterPopup with preloaded data */}
                <FilterPopupWithData />

                {/* Render Filter Tags based on appliedFilters */}
                <FilterTags labels={getFilterLabels()} onRemove={removeFilter} />

                {/* Cards (Mobile) */}
                <div className="pr-4 pb-32 pl-4 grid grid-cols-1 gap-4">
                    {currentItems.length > 0 ? (
                         currentItems.map((item) => (
                         <div key={item.id} className="border rounded-lg p-4 shadow bg-white flex flex-col items-start space-y-2 relative">
                            {item.image ? (
                                <div className="w-full h-48 relative">
                                    <img 
                                        src={item.image} 
                                        alt={item.name} 
                                        className="w-full h-full object-contain self-center" 
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.nextElementSibling.style.display = 'block';
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-full">
                                    <NoImageDisplay message="ไม่พบรูปภาพ" subMessage="ไม่มีรูปในฐานข้อมูล" />
                                </div>
                            )}
                            <div className="hidden w-full h-full">
                                <NoImageDisplay message="ไม่สามารถโหลดรูปได้" subMessage="รูปภาพอาจถูกลบหรือย้าย" />
                            </div>
                            <div className="font-bold text-md">{item.name}</div>
                            <div className="flex items-center gap-2 text-gray-600 text-sm"> <FiTag /> {item.category} </div>
                            <div className="flex items-center gap-2 text-gray-600 text-sm"> <FiCalendar /> {item.date} {item.time} </div>
                            <div className="flex items-center gap-2 text-gray-600 text-sm"> 
                                <FiMapPin /> {item.place_name || ''} {item.place_name && item.location ? '- ' : ''}{item.location} 
                            </div>
                            <div className="pt-2 w-full flex justify-end"> 
                                <button 
                                    onClick={() => handleViewDetail(item)} 
                                    className="px-3 py-1 bg-[#7a0000] text-white rounded hover:bg-[#5a0000] text-xs"
                                > 
                                    ดูรายละเอียด 
                                </button> 
                            </div>
                         </div>
                        ))
                    ) : ( <div className="text-center text-gray-500 py-10 col-span-1"> ไม่พบข้อมูลตามตัวกรอง </div> )}
                </div>

                {/* Mobile Pagination */}
                {filteredData.length > 0 && (
                  <div className="fixed bottom-[74px] left-0 right-0 bg-white p-2 flex flex-col border-t border-b z-20">
                    <div className="flex justify-between items-center pt-1">
                      <div className="text-gray-600 text-xs sm:text-sm pl-2">
                        {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} จาก {filteredData.length}
                      </div>
                      <div className="flex items-center text-gray-600 text-xs sm:text-sm">
                        <span className="mr-1 sm:mr-2">แถว:</span>
                        <select className="bg-transparent border rounded px-1 sm:px-2 py-1 text-gray-600 text-xs sm:text-sm focus:outline-none cursor-pointer" value={rowsPerPage} onChange={handleRowsPerPageChange}>
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="20">20</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 pr-2">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={`p-1 rounded ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}>
                          <FiChevronLeft size={18} />
                        </button>
                        <span className="font-medium text-xs sm:text-sm">{currentPage}/{totalPages}</span>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`p-1 rounded ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}>
                          <FiChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* --- Desktop Display --- */}
            <div className="hidden md:block h-full">
                <div className="h-full w-full flex flex-col overflow-hidden">
                    <div className="px-6 pt-4 flex justify-between items-center mb-4 flex-shrink-0">
                        <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 px-4 py-2 border rounded bg-white hover:bg-gray-100"> <FiFilter size={18} /> ตัวกรอง </button>
                    </div>

                    {/* Render FilterPopup with preloaded data */}
                    <FilterPopupWithData />

                     {/* Render Filter Tags based on appliedFilters */}
                    <FilterTags labels={getFilterLabels()} onRemove={removeFilter} />

                    {/* Table Container */}
                    <div className="px-6 pb-6 h-[65vh] flex flex-col flex-grow overflow-hidden">
                        <div className="bg-white rounded shadow-md flex flex-col flex-grow overflow-hidden">
                             <div className="flex-grow overflow-auto">
                                <table className="w-full table-fixed border-collapse">
                                    <thead>
                                        <tr className="bg-gray-200 sticky top-0 z-10">
                                            <th className="p-3 text-left w-[15%] font-semibold">วัน/เดือน/ปี</th>
                                            <th className="p-3 text-left w-[15%] font-semibold">หมวดหมู่</th>
                                            <th className="p-3 text-left w-[10%] font-semibold">รูปภาพ</th>
                                            <th className="p-3 text-left w-[20%] font-semibold">ชื่อ</th>
                                            <th className="p-3 text-left w-[25%] font-semibold">สถานที่พบ</th>
                                            <th className="p-3 text-left w-[15%] font-semibold">การจัดการ</th>
                                        </tr>
                                    </thead>
                                    {currentItems.length > 0 ? (
                                        <tbody>
                                            {currentItems.map((item) => (
                                                <tr key={item.id} className="border-t hover:bg-red-50 transition-colors">
                                                    <td className="p-3 align-top">{item.date} {item.time}</td> 
                                                    <td className="p-3 align-top">{item.category}</td> 
                                                    <td className="p-3 align-top">
                                                        {item.image ? (
                                                            <div className="relative w-12 h-12">
                                                                <img 
                                                                    src={item.image} 
                                                                    alt={item.name} 
                                                                    className="w-12 h-12 object-contain" 
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        e.target.nextElementSibling.style.display = 'flex';
                                                                    }}
                                                                />
                                                                <div className="hidden absolute inset-0">
                                                                    <NoImageDisplay small={true} />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <NoImageDisplay small={true} />
                                                        )}
                                                    </td> 
                                                    <td className="p-3 align-top">{item.name}</td> 
                                                    <td className="p-3 align-top">
                                                        {item.place_name && <div className="font-medium">{item.place_name}</div>}
                                                        <div>{item.location}</div>
                                                    </td> 
                                                    <td className="p-3 align-top"> 
                                                        <div className="flex gap-1"> 
                                                            <button 
                                                                title="ดูรายละเอียด" 
                                                                onClick={() => handleViewDetail(item)} 
                                                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                                                            >
                                                                <FiEye size={18} />
                                                            </button> 
                                                            <button title="แก้ไข" className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded">
                                                                <FiEdit size={18} />
                                                            </button> 
                                                            <button title="ลบ" className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded">
                                                                <FiTrash size={18} />
                                                            </button> 
                                                        </div> 
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    ) : ( <tbody> <tr> <td colSpan="6" className="text-center text-gray-500 py-10"> ไม่พบข้อมูลตามตัวกรอง </td> </tr> </tbody> )}
                                </table>
                            </div>

                            {/* Desktop Pagination */}
                            {filteredData.length > 0 && (
                             <div className="w-full bg-[#e6f0fa] py-2 px-4 flex justify-between items-center text-sm text-gray-700 font-medium rounded-b-lg border-t flex-shrink-0">
                                 <span className="text-gray-600"> {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} จาก {filteredData.length} </span>
                                 <div className="flex items-center text-gray-600"> <span className="mr-2">แถว ต่อ หน้า:</span> <select className="bg-transparent border-none text-gray-600 font-semibold focus:outline-none cursor-pointer" value={rowsPerPage} onChange={handleRowsPerPageChange}> <option value="5">5</option> <option value="10">10</option> <option value="20">20</option> </select> </div>
                                 <div className="flex items-center gap-1">
                                      <button title="หน้าแรก" onClick={() => handlePageChange(1)} disabled={currentPage === 1} className={`p-1 rounded ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-200"}`}> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8.354 1.646a.5.5 0 0 0-.708 0l-6 6a.5.5 0 0 0 0 .708l6 6a.5.5 0 0 0 .708-.708L2.707 8l5.647-5.646a.5.5 0 0 0 0-.708"/><path d="M12.354 1.646a.5.5 0 0 0-.708 0l-6 6a.5.5 0 0 0 0 .708l6 6a.5.5 0 0 0 .708-.708L6.707 8l5.647-5.646a.5.5 0 0 0 0-.708"/></svg> </button>
                                      <button title="หน้าก่อน" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={`p-1 rounded ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-200"}`}> <FiChevronLeft size={16} /> </button>
                                      <span className="font-semibold px-1"> <span className="text-black">{currentPage}</span> <span className="px-1 text-gray-400">/</span> <span className="text-gray-500">{totalPages}</span> </span>
                                      <button title="หน้าถัดไป" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`p-1 rounded ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-200"}`}> <FiChevronRight size={16} /> </button>
                                      <button title="หน้าสุดท้าย" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className={`p-1 rounded ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-200"}`}> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l6 6a.5.5 0 0 1-.708-.708L9.293 8 3.646 2.354a.5.5 0 0 1 0-.708"/><path d="M7.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l6 6a.5.5 0 0 1-.708-.708L13.293 8 7.646 2.354a.5.5 0 0 1 0-.708"/></svg> </button>
                                 </div>
                             </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default History;