import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import apiConfig from '../config/api';
import { FiFilter, FiPlus, FiEye, FiEdit, FiTrash, FiMapPin, FiCalendar, FiTag, FiArrowLeft, FiChevronLeft, FiChevronRight, FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";

// --- Date Parsing (BE to CE) ---
const parseDateBE = (dateString) => {
  if (!dateString) return null;
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const yearBE = parseInt(parts[2], 10);
  const yearCE = yearBE - 543;

  if (isNaN(day) || isNaN(month) || isNaN(yearCE)) return null;

  const date = new Date(Date.UTC(yearCE, month, day));
  if (date.getUTCFullYear() !== yearCE || date.getUTCMonth() !== month || date.getUTCDate() !== day) {
      return null;
  }
  return date;
};

// --- Filter Pop Up ---
const FilterPopup = ({ isOpen, onClose, filters, onFilterChange, onClearFilters, onApplyFilters }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [sectionsOpen, setSectionsOpen] = useState({
    category: true,
    date: true,
    location: true,
  });

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    if (isOpen) {
        setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const toggleSection = (sectionName) => {
    setSectionsOpen(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    const currentCategories = localFilters.categories || [];
    const newCategories = checked
      ? [...currentCategories, value]
      : currentCategories.filter((cat) => cat !== value);
    setLocalFilters({ ...localFilters, categories: newCategories });
  };

  const handleDateRangeChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setLocalFilters({ ...localFilters, dateRange: value, customDate: '' });
    } else {
      if (localFilters.dateRange === value) {
        setLocalFilters({ ...localFilters, dateRange: null });
      }
    }
  };

  const handleCustomDateChange = (e) => {
    setLocalFilters({ ...localFilters, customDate: e.target.value, dateRange: null });
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters({ ...localFilters, [name]: value });
  };

  const handleApplyFilters = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClearInternal = () => {
      onClearFilters();
  };

  const handleClose = () => {
    setLocalFilters(filters);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full h-full md:w-full md:h-[70vh] md:max-w-[650px] md:max-h-[90vh] md:rounded-lg shadow-lg flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
           <h2 className="text-xl md:text-2xl font-semibold">เลือกตัวกรองผลลัพธ์</h2>
           <button
             onClick={handleClose}
             className="text-gray-500 hover:text-gray-700"
           >
             <FiX size={24} />
           </button>
        </div>
        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4">
              <div className="border-b pb-4">
                 <button
                    onClick={() => toggleSection('category')}
                    className="flex justify-between items-center w-full font-semibold mb-3 text-left"
                    >
                    หมวดหมู่
                    {sectionsOpen.category ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                    </button>
                    {sectionsOpen.category && (
                    <div className="flex flex-wrap gap-4 sm:gap-6">
                        <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="w-4 h-4 accent-[#b30000]"
                            value="อาวุธปืน"
                            checked={localFilters.categories?.includes("อาวุธปืน") || false}
                            onChange={handleCategoryChange}
                        /> อาวุธปืน
                        </label>
                        <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="w-4 h-4 accent-[#b30000]"
                            value="ยาเสพติด"
                            checked={localFilters.categories?.includes("ยาเสพติด") || false}
                            onChange={handleCategoryChange}
                        /> ยาเสพติด
                        </label>
                    </div>
                    )}
              </div>
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
                       ={[
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
                        <div className="flex flex-col sm:flex-row sm:items-center">
                        <label className="font-normal w-full sm:w-auto mb-2 sm:mb-0 sm:mr-4">กำหนดเอง</label>
                        <input
                            type="text"
                            placeholder="28 ธ.ค. 22 - 10 ม.ค. 23"
                            className="p-2 border rounded-lg w-full sm:w-[60%] focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                            disabled
                        />
                        </div>
                    </div>
                    )}
               </div>
               <div className="pb-4">
                    <button
                    onClick={() => toggleSection('location')}
                    className="flex justify-between items-center w-full font-semibold mb-3 text-left"
                    >
                    จังหวัด/อำเภอ/ตำบล
                    {sectionsOpen.location ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                    </button>
                    {sectionsOpen.location && (
                    <div className="space-y-4">
                        <div className="flex justify-start items-center mb-2">
                        <button className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-100 text-sm">
                            <FiMapPin className="inline mr-1" /> เลือกจากแผนที่
                        </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
                            <select name="province" value={localFilters.province || ''} onChange={handleLocationChange} className="p-2 border rounded-lg w-full focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]">
                                <option value="">กรอกหรือเลือกจังหวัด</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">อำเภอ</label>
                            <select name="district" value={localFilters.district || ''} onChange={handleLocationChange} className="p-2 border rounded-lg w-full focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]">
                                <option value="">กรอกหรือเลือกอำเภอ</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ตำบล</label>
                            <select name="subdistrict" value={localFilters.subdistrict || ''} onChange={handleLocationChange} className="p-2 border rounded-lg w-full focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]">
                                <option value="">กรอกหรือเลือกตำบล</option>
                            </select>
                        </div>
                        </div>
                    </div>
                    )}
               </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between p-4 border-t gap-3 flex-shrink-0 bg-white">
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
      </div>
    </div>
  );
};

const Popup = ({ open, type, message, countdown, onClose }) => {
  if (!open) return null;
  let icon, color;
  if (type === 'success') {
    icon = <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
    color = 'text-green-600';
  } else {
    icon = <svg className="w-8 h-8 text-red-600 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
    color = 'text-red-600';
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg flex flex-col items-center justify-center w-80 h-64 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
          aria-label="ปิด"
        >
          <FiX size={22} />
        </button>
        {icon}
        <div className={`font-semibold text-lg mb-4 mt-2 text-center ${color}`}>{message}</div>
        <div className="mt-4 text-gray-500 text-sm">
          ปิดอัตโนมัติใน {countdown} วินาที
        </div>
      </div>
    </div>
  );
};

const initialFilters = {
    categories: [],
    dateRange: null,
    customDate: '',
    province: '',
    district: '',
    subdistrict: '',
};

const History = () => {
    const navigate = useNavigate();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState(initialFilters);
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [popup, setPopup] = useState({ open: false, type: '', message: '' });
    const [popupCountdown, setPopupCountdown] = useState(5);
    const API_PATH = '/api';

    useEffect(() => {
        const fetchHistoryData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const response = await axios.get(`${apiConfig.baseUrl}${API_PATH}/history`);
                
                // Format API data to match the structure we're using
                const formattedData = response.data.map(item => {
                    // Format date from MySQL format (YYYY-MM-DD) to Thai format (DD/MM/YYYY BE)
                    let dateString = '';
                    if (item.date) {
                        const date = new Date(item.date);
                        const day = date.getDate().toString().padStart(2, '0');
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const year = date.getFullYear() + 543; // Convert to Buddhist Era (BE)
                        dateString = `${day}/${month}/${year}`;
                    }

                    // Get category directly from exhibit.category
                    let category = "ไม่ระบุหมวดหมู่";
                    if (item.exhibit && item.exhibit.category) {
                        category = item.exhibit.category; // Use exhibit's category directly
                    }

                    // Format exhibit name - for firearms, combine brand, series, model
                    let exhibitName = 'ไม่ระบุชื่อ';
                    if (item.exhibit) {
                        if (item.exhibit.firearm) {
                            // For firearms, combine brand, series, and model
                            const parts = [
                                item.exhibit.firearm.brand,
                                item.exhibit.firearm.series,
                                item.exhibit.firearm.model
                            ].filter(Boolean); // Remove empty/null values
                            
                            exhibitName = parts.length > 0 ? parts.join(' ') : item.exhibit.subcategory || 'ไม่ระบุชื่อ';
                        } else {
                            // For non-firearms
                            exhibitName = item.exhibit.subcategory || item.exhibit.category || 'ไม่ระบุชื่อ';
                        }
                    }

                    // Format location using the provided location names
                    let locationParts = [];
                    
                    // Add place_name if available
                    if (item.place_name) locationParts.push(item.place_name);
                    
                    // Add location names from the API response
                    if (item.subdistrict_name) locationParts.push(`ต.${item.subdistrict_name}`);
                    if (item.district_name) locationParts.push(`อ.${item.district_name}`);
                    if (item.province_name) locationParts.push(`จ.${item.province_name}`);
                    
                    // Add address parts if available
                    const addressParts = [];
                    if (item.house_no) addressParts.push(`บ้านเลขที่ ${item.house_no}`);
                    if (item.village_no) addressParts.push(`หมู่ ${item.village_no}`);
                    if (item.alley) addressParts.push(`ซอย${item.alley}`);
                    if (item.road) addressParts.push(`ถนน${item.road}`);
                    
                    if (addressParts.length > 0) {
                        locationParts.push(addressParts.join(' '));
                    }
                    
                    // Join with commas
                    const location = locationParts.join(', ') || 'ไม่ระบุสถานที่';

                    // Get image - prioritize history image, then exhibit image
                    let imageUrl = item.image_url;
                    
                    // If no history image, try to get exhibit image
                    if (!imageUrl && item.exhibit && item.exhibit.images && item.exhibit.images.length > 0) {
                        // Sort by priority if available and take the first one
                        const sortedImages = [...item.exhibit.images].sort((a, b) => 
                            (a.priority || 999) - (b.priority || 999)
                        );
                        imageUrl = sortedImages[0].image_url;
                    }

                    return {
                        id: item.id,
                        date: dateString,
                        category,
                        image: imageUrl,
                        name: exhibitName,
                        location,
                        // Add timestamps for sorting if needed
                        timestamp: new Date(`${item.date}T${item.time || '00:00:00'}`).getTime(),
                        // Store the original data for detailed view
                        originalData: item
                    };
                });
                
                // Sort by date (newest first)
                formattedData.sort((a, b) => b.timestamp - a.timestamp);
                
                setData(formattedData);
                setFilteredData(formattedData); // Initialize filtered data with all data
                setIsLoading(false);
            } catch (err) {
                console.error("Error fetching history data:", err);
                setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
                setIsLoading(false);
                
                // Fallback to mock data if API fails
                setData(historyData);
                setFilteredData(historyData);
            }
        };

        fetchHistoryData();
    }, []);

    useEffect(() => {
        let dataToFilter = data.length > 0 ? [...data] : [];

        if (appliedFilters.categories && appliedFilters.categories.length > 0) {
            dataToFilter = dataToFilter.filter(item => appliedFilters.categories.includes(item.category));
        }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        if (appliedFilters.dateRange) {
            let startDate = new Date(today);
            switch (appliedFilters.dateRange) {
                case 'today':
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
                dataToFilter = dataToFilter.filter(item => {
                    const itemDate = parseDateBE(item.date);
                    return itemDate && itemDate >= startDate && itemDate <= today;
                });
            }
        } else if (appliedFilters.customDate) {
            try {
                const [year, month, day] = appliedFilters.customDate.split('-').map(Number);
                const customDateUTC = new Date(Date.UTC(year, month - 1, day));

                if (!isNaN(customDateUTC)) {
                    dataToFilter = dataToFilter.filter(item => {
                        const itemDate = parseDateBE(item.date);
                        return itemDate &&
                            itemDate.getUTCFullYear() === customDateUTC.getUTCFullYear() &&
                            itemDate.getUTCMonth() === customDateUTC.getUTCMonth() &&
                            itemDate.getUTCDate() === customDateUTC.getUTCDate();
                    });
                }
            } catch (e) {
                console.error("Error parsing custom date:", e);
            }
        }

        if (appliedFilters.province) {
            dataToFilter = dataToFilter.filter(item => item.location.toLowerCase().includes(appliedFilters.province.toLowerCase()));
        }
        if (appliedFilters.district) {
            dataToFilter = dataToFilter.filter(item => item.location.toLowerCase().includes(appliedFilters.district.toLowerCase()));
        }
        if (appliedFilters.subdistrict) {
            dataToFilter = dataToFilter.filter(item => item.location.toLowerCase().includes(appliedFilters.subdistrict.toLowerCase()));
        }

        setFilteredData(dataToFilter);
        setCurrentPage(1);
    }, [appliedFilters, data]);

    useEffect(() => {
        let timer;
        if ((popup.type === 'success' || popup.type === 'fail') && popup.open) {
            if (popupCountdown > 0) {
                timer = setTimeout(() => setPopupCountdown(popupCountdown - 1), 1000);
            } else {
                setPopup({ ...popup, open: false });
            }
        }
        return () => clearTimeout(timer);
    }, [popup, popupCountdown]);

    useEffect(() => {
        if ((popup.type === 'success' || popup.type === 'fail') && popup.open) {
            setPopupCountdown(5);
        }
    }, [popup.type, popup.open]);

    useEffect(() => {
        if (location.state && location.state.popup) {
            setPopup(location.state.popup);
            setPopupCountdown(5);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const getFilterLabels = () => {
      const labels = [];
      if (appliedFilters.categories && appliedFilters.categories.length > 0) {
          appliedFilters.categories.forEach(cat => { labels.push({ type: 'category', value: cat, label: cat }); });
      }
      if (appliedFilters.dateRange) {
          const dateLabels = { 'today': 'วันนี้', 'last7days': '7 วันล่าสุด', 'last1month': '1 เดือนล่าสุด', 'last6months': '6 เดือนล่าสุด', 'last1year': '1 ปีล่าสุด' };
          labels.push({ type: 'date', value: appliedFilters.dateRange, label: dateLabels[appliedFilters.dateRange] });
      } else if (appliedFilters.customDate) {
          try { labels.push({ type: 'date', value: 'custom', label: `วันที่: ${appliedFilters.customDate}` }); } catch (e) {}
      }
      if (appliedFilters.province) { labels.push({ type: 'location', value: 'province', label: `จังหวัด: ${appliedFilters.province}` }); }
      if (appliedFilters.district) { labels.push({ type: 'location', value: 'district', label: `อำเภอ: ${appliedFilters.district}` }); }
      if (appliedFilters.subdistrict) { labels.push({ type: 'location', value: 'subdistrict', label: `ตำบล: ${appliedFilters.subdistrict}` }); }
      return labels;
    };

    const removeFilter = (type, value) => {
        const newFilters = { ...appliedFilters };
        if (type === 'category') { newFilters.categories = newFilters.categories.filter(cat => cat !== value); }
        else if (type === 'date') { if (value === 'custom') { newFilters.customDate = ''; } else { newFilters.dateRange = null; } }
        else if (type === 'location') { newFilters[value] = ''; }
        setAppliedFilters(newFilters);
        setFilters(newFilters);
    };

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
    };
    const handleRowsPerPageChange = (e) => {
        setRowsPerPage(parseInt(e.target.value));
        setCurrentPage(1);
    };

    const handleFilterChange = (newLocalFilters) => {};

    const handleApplyFilters = (newAppliedFilters) => {
        setAppliedFilters(newAppliedFilters);
        setFilters(newAppliedFilters);
    };

    const handleClearFilters = () => {
        setAppliedFilters(initialFilters);
        setFilters(initialFilters);
        setIsFilterOpen(false);
    };

    const FilterTags = ({ labels, onRemove }) => {
        if (labels.length === 0) return null;
        return (
            <div className="flex flex-wrap gap-2 mb-4 px-4 md:px-6">
                {labels.map((item, index) => (
                    <div key={`${item.type}-${item.value}-${index}`} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                        <span>{item.label}</span>
                        <button onClick={() => onRemove(item.type, item.value)} className="ml-2 text-gray-500 hover:text-red-500"> <FiX size={16} /> </button>
                    </div>
                ))}
            </div>
        );
    };

    const handleViewDetail = (item) => {
        navigate('/history/detail', { state: { item } });
    };
    
    const handleDeleteHistory = async (id) => {
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประวัตินี้?')) {
            try {
                await axios.delete(apiConfig.getUrl(`/api/history/${id}`));
                
                const updatedData = data.filter(item => item.id !== id);
                setData(updatedData);
                
                alert('ลบประวัติสำเร็จ');
            } catch (error) {
                console.error('Error deleting history:', error);
                alert('เกิดข้อผิดพลาดในการลบประวัติ');
            }
        }
    };

    return (
        <div className="w-full h-full">
            <Popup
              open={popup.open}
              type={popup.type}
              message={popup.message}
              countdown={popupCountdown}
              onClose={() => setPopup({ ...popup, open: false })}
            />
            <div className="md:hidden">
                <div className="px-4 py-3 flex items-center justify-center relative shadow-[0_1.5px_4px_rgba(0,0,0,0.2)]">
                    <button className="absolute left-4" onClick={() => navigate(-1)}><FiArrowLeft size={24} /></button>
                    <h1 className="text-lg font-bold text-center flex-1">ประวัติการพบวัตถุพยาน</h1>
                </div>
                <div className="px-4 sm:px-6 pt-4 flex justify-between items-center mb-4">
                    <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 px-3 py-2 border rounded bg-white hover:bg-gray-100 text-sm">
                        <FiFilter size={16} /> ตัวกรอง
                    </button>
                    <button 
                        className="flex items-center gap-1 px-2 py-2 rounded bg-[#b30000] text-white hover:bg-[#990000]"
                        onClick={() => navigate('/saveToHistory')} 
                    >
                        <FiPlus size={16} />
                    </button>
                </div>
                <FilterPopup
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onApplyFilters={handleApplyFilters}
                    onClearFilters={handleClearFilters}
                />
                <FilterTags labels={getFilterLabels()} onRemove={removeFilter} />
                {isLoading ? (
                    <div className="flex justify-center items-center min-h-[65vh]">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#b30000]"></div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col justify-center items-center min-h-[65vh] text-center text-red-500">
                        <p>{error}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="mt-4 px-4 py-2 bg-[#b30000] text-white rounded hover:bg-[#990000]"
                        >
                            ลองใหม่
                        </button>
                    </div>
                ) : (
                    <div className="pr-4 pb-32 pl-4 grid grid-cols-1 gap-4">
                        {currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <div key={item.id || item.name + item.date} className="border rounded-lg p-4 shadow bg-white flex flex-row items-start space-x-4 relative">
                                    <div className="w-1/4 min-w-24">
                                        <img src={item.image} alt={item.name} className="w-full h-32 object-contain" />
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <div className="font-bold text-md">{item.name}</div>
                                        <div className="flex items-center gap-2 text-gray-600 text-sm mt-2"> 
                                            <FiTag /> {item.category} 
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 text-sm"> 
                                            <FiCalendar /> {item.date} 
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 text-sm"> 
                                            <FiMapPin /> {item.location} 
                                        </div>
                                        <div className="pt-2 w-full flex justify-end mt-auto">
                                            <button 
                                                onClick={() => handleViewDetail(item)} 
                                                className="px-3 py-1 bg-[#7a0000] text-white rounded hover:bg-[#5a0000] text-xs"
                                            > 
                                                ดูรายละเอียด 
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-10 col-span-1">ไม่พบข้อมูลตามตัวกรอง</div>
                        )}
                    </div>
                )}
                {!isLoading && !error && filteredData.length > 0 && (
                    <div className="fixed bottom-16 left-0 right-0 bg-white shadow-md p-2 flex flex-col border-t">
                        <div className="flex justify-between items-center pt-1">
                            <div className="text-gray-600 text-xs sm:text-sm pl-2">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} จาก {filteredData.length}</div>
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
            <div className="hidden md:block h-full">
                <div className="h-full w-full flex flex-col overflow-hidden">
                    <div className="px-6 py-4 flex justify-between items-center flex-shrink-0">
                        <h1 className="text-xl font-bold">ประวัติการพบวัตถุพยาน</h1>
                    </div>
                    <div className="px-6 flex justify-between items-center mb-4 flex-shrink-0">
                        <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 px-4 py-2 border rounded bg-white hover:bg-gray-100">
                            <FiFilter size={18} /> ตัวกรอง
                        </button>
                        <button 
                            className="flex items-center gap-2 px-4 py-2 rounded bg-[#b30000] text-white hover:bg-[#990000]"
                            onClick={() => navigate('/saveToHistory')}
                        >
                            <FiPlus size={18} /><b> เพิ่มประวัติการค้นพบ</b>
                        </button>
                    </div>
                    <FilterPopup
                        isOpen={isFilterOpen}
                        onClose={() => setIsFilterOpen(false)}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onApplyFilters={handleApplyFilters}
                        onClearFilters={handleClearFilters}
                    />
                    <FilterTags labels={getFilterLabels()} onRemove={removeFilter} />
                    <div className="px-6 pb-6 flex flex-col flex-grow overflow-hidden">
                        <div className="bg-white rounded shadow-md flex flex-col flex-grow overflow-hidden">
                            <div className="flex-grow overflow-auto">
                                {isLoading ? (
                                    <div className="flex justify-center items-center h-64">
                                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#b30000]"></div>
                                    </div>
                                ) : error ? (
                                    <div className="text-center text-red-500 py-10">
                                        <p>{error}</p>
                                        <button 
                                            onClick={() => window.location.reload()} 
                                            className="mt-4 px-4 py-2 bg-[#b30000] text-white rounded hover:bg-[#990000]"
                                        >
                                            ลองใหม่
                                        </button>
                                    </div>
                                ) : (
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
                                                    <tr key={item.id || item.name + item.date} className="border-t hover:bg-red-50 transition-colors">
                                                        <td className="p-3 align-top">{item.date}</td>
                                                        <td className="p-3 align-top">{item.category}</td>
                                                        <td className="p-3 align-top">
                                                            <img src={item.image} alt={item.name} className="w-12 h-12 object-contain" />
                                                        </td>
                                                        <td className="p-3 align-top">{item.name}</td>
                                                        <td className="p-3 align-top">{item.location}</td>
                                                        <td className="p-3 align-top">
                                                            <div className="flex gap-1">
                                                                <button 
                                                                    title="ดูรายละเอียด" 
                                                                    onClick={() => handleViewDetail(item)} 
                                                                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                                                                >
                                                                    <FiEye size={18} />
                                                                </button>
                                                                <button 
                                                                    title="แก้ไข" 
                                                                    className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded"
                                                                    onClick={() => navigate(`/history/edit/${item.id}`)}
                                                                >
                                                                    <FiEdit size={18} />
                                                                </button>
                                                                <button 
                                                                    title="ลบ" 
                                                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                                                                    onClick={() => handleDeleteHistory(item.id)}
                                                                >
                                                                    <FiTrash size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        ) : (
                                            <tbody>
                                                <tr>
                                                    <td colSpan="6" className="text-center text-gray-500 py-10">
                                                        ไม่พบข้อมูลตามตัวกรอง
                                                    </td>
                                                </tr>
                                            </tbody>
                                        )}
                                    </table>
                                )}
                            </div>
                        </div>
                        {!isLoading && !error && filteredData.length > 0 && (
                            <div className="w-full bg-[#e6f0fa] py-2 px-4 flex justify-between items-center text-sm text-gray-700 font-medium rounded-b-lg border-t flex-shrink-0">
                                <span className="text-gray-600">
                                    {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} จาก {filteredData.length}
                                </span>
                                <div className="flex items-center text-gray-600">
                                    <span className="mr-2">แถว ต่อ หน้า:</span>
                                    <select className="bg-transparent border-none text-gray-600 font-semibold focus:outline-none cursor-pointer" value={rowsPerPage} onChange={handleRowsPerPageChange}>
                                        <option value="5">5</option>
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button title="หน้าแรก" onClick={() => handlePageChange(1)} disabled={currentPage === 1} className={`p-1 rounded ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-200"}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M8.354 1.646a.5.5 0 0 0-.708 0l-6 6a.5.5 0 0 0 0 .708l6 6a.5.5 0 0 0 .708-.708L2.707 8l5.647-5.646a.5.5 0 0 0 0-.708"/>
                                        <path d="M12.354 1.646a.5.5 0 0 0-.708 0l-6 6a.5.5 0 0 0 0 .708l-6 6a.5.5 0 0 0-.708-.708L6.707 8l5.647-5.646a.5.5 0 0 0 0-.708"/>
                                        </svg>
                                    </button>
                                    <button title="หน้าก่อน" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={`p-1 rounded ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-200"}`}>
                                        <FiChevronLeft size={16} />
                                    </button>
                                    <span className="font-semibold px-1">
                                        <span className="text-black">{currentPage}</span>
                                        <span className="px-1 text-gray-400">/</span>
                                        <span className="text-gray-500">{totalPages}</span>
                                    </span>
                                    <button title="หน้าถัดไป" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`p-1 rounded ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-200"}`}>
                                        <FiChevronRight size={16} />
                                    </button>
                                    <button title="หน้าสุดท้าย" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className={`p-1 rounded ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:bg-gray-200"}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M3.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L9.293 8l-5.647-5.646a.5.5 0 0 1 0-.708"/>
                                        <path d="M7.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L13.293 8l-5.647-5.646a.5.5 0 0 1 0-.708"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default History;