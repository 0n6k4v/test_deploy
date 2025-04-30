import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiLoader, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

// --- Desktop Layout ---
const DesktopLayout = ({ 
  loading, error, success, historyData, formData, provinces, districts, subdistricts, 
  handleChange, handleProvinceChange, handleDistrictChange, handleSubmit, saving, onCancel 
}) => (
  <div className="bg-white flex flex-col h-full w-full overflow-hidden">
    {/* Header with back button */}
    <div className="flex items-center border-b p-2 md:p-3">
      <button onClick={onCancel} className="mr-3 text-gray-600 hover:text-gray-900">
        <FiArrowLeft size={20} />
      </button>
      <h1 className="text-base md:text-lg font-bold">แก้ไขข้อมูลประวัติ</h1>
    </div>
    {/* Scrollable form area */}
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
            <FiAlertCircle className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {/* Image preview section */}
        <div className="mb-8 flex justify-center">
          <img 
            src={historyData?.image_url || ''}
            alt="ภาพอาวุธปืน"
            className="max-h-60 object-contain border p-2 rounded-lg"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gun details section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">รายละเอียดอาวุธปืน</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
                <input 
                  type="text" 
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">กลไก</label>
                <input 
                  type="text" 
                  name="mechanism"
                  value={formData.mechanism}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ยี่ห้อ</label>
                <input 
                  type="text" 
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ซีรี่ส์</label>
                <input 
                  type="text" 
                  name="series"
                  value={formData.series}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">โมเดล</label>
                <input 
                  type="text" 
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จุดสังเกตเลขประจำปืน</label>
                <textarea 
                  name="serial_info"
                  value={formData.serial_info}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
            </div>
          </div>
          {/* Location and other details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">รายละเอียดสถานที่และอื่นๆ</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่พบ</label>
                <input 
                  type="date" 
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เวลา</label>
                <input 
                  type="time" 
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ความมั่นใจ (%)</label>
                <input 
                  type="number" 
                  name="confidence_percentage"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.confidence_percentage}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ สภ.</label>
                <input 
                  type="text" 
                  name="place_name"
                  value={formData.place_name}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
                <select 
                  name="province_id" 
                  value={formData.province_id}
                  onChange={handleProvinceChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                >
                  <option value="">เลือกจังหวัด</option>
                  {provinces.map(province => (
                    <option key={province.id} value={province.id}>
                      {province.province_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อำเภอ</label>
                <select 
                  name="district_id" 
                  value={formData.district_id}
                  onChange={handleDistrictChange}
                  disabled={!formData.province_id}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                >
                  <option value="">เลือกอำเภอ</option>
                  {districts.map(district => (
                    <option key={district.id} value={district.id}>
                      {district.district_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ตำบล</label>
                <select 
                  name="subdistrict_id" 
                  value={formData.subdistrict_id}
                  onChange={handleChange}
                  disabled={!formData.district_id}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                >
                  <option value="">เลือกตำบล</option>
                  {subdistricts.map(subdistrict => (
                    <option key={subdistrict.id} value={subdistrict.id}>
                      {subdistrict.subdistrict_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        {/* Action buttons */}
        <div className="mt-8 pt-5 border-t flex flex-col-reverse sm:flex-row sm:gap-3 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-[#b30000] text-white hover:bg-[#900000] focus:outline-none disabled:bg-gray-400 flex items-center justify-center"
          >
            {saving ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                กำลังบันทึก...
              </>
            ) : (
              'บันทึกการเปลี่ยนแปลง'
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
);

// --- Mobile Layout ---
const MobileLayout = ({
  loading, error, success, historyData, formData, provinces, districts, subdistricts,
  handleChange, handleProvinceChange, handleDistrictChange, handleSubmit, saving, onCancel
}) => (
  <div className="bg-white flex flex-col h-full w-full overflow-hidden">
    {/* Mobile Topbar: match History.jsx */}
    <div className="px-4 py-3 flex items-center justify-center relative shadow-[0_1.5px_4px_rgba(0,0,0,0.2)]">
      <button className="absolute left-4" onClick={onCancel}>
        <FiArrowLeft size={24} />
      </button>
      <h1 className="text-lg font-bold text-center flex-1">แก้ไขข้อมูลประวัติ</h1>
    </div>
    {/* Scrollable form area */}
    <div className="flex-1 overflow-auto p-4">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
            <FiAlertCircle className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {/* Image preview section */}
        <div className="mb-8 flex justify-center">
          <img
            src={historyData?.image_url || ''}
            alt="ภาพอาวุธปืน"
            className="max-h-60 object-contain border p-2 rounded-lg"
          />
        </div>
        <div className="grid grid-cols-1 gap-6">
          {/* Gun details section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">รายละเอียดอาวุธปืน</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
                <input
                  type="text"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">กลไก</label>
                <input
                  type="text"
                  name="mechanism"
                  value={formData.mechanism}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ยี่ห้อ</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ซีรี่ส์</label>
                <input
                  type="text"
                  name="series"
                  value={formData.series}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">โมเดล</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จุดสังเกตเลขประจำปืน</label>
                <textarea
                  name="serial_info"
                  value={formData.serial_info}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
            </div>
          </div>
          {/* Location and other details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">รายละเอียดสถานที่และอื่นๆ</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่พบ</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เวลา</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ความมั่นใจ (%)</label>
                <input
                  type="number"
                  name="confidence_percentage"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.confidence_percentage}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ สภ.</label>
                <input
                  type="text"
                  name="place_name"
                  value={formData.place_name}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
                <select
                  name="province_id"
                  value={formData.province_id}
                  onChange={handleProvinceChange}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                >
                  <option value="">เลือกจังหวัด</option>
                  {provinces.map(province => (
                    <option key={province.id} value={province.id}>
                      {province.province_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อำเภอ</label>
                <select
                  name="district_id"
                  value={formData.district_id}
                  onChange={handleDistrictChange}
                  disabled={!formData.province_id}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                >
                  <option value="">เลือกอำเภอ</option>
                  {districts.map(district => (
                    <option key={district.id} value={district.id}>
                      {district.district_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ตำบล</label>
                <select
                  name="subdistrict_id"
                  value={formData.subdistrict_id}
                  onChange={handleChange}
                  disabled={!formData.district_id}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#b30000] focus:border-[#b30000]"
                >
                  <option value="">เลือกตำบล</option>
                  {subdistricts.map(subdistrict => (
                    <option key={subdistrict.id} value={subdistrict.id}>
                      {subdistrict.subdistrict_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        {/* Action buttons */}
        <div className="mt-8 pt-5 border-t flex flex-col-reverse sm:flex-row sm:gap-3 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-[#b30000] text-white hover:bg-[#900000] focus:outline-none disabled:bg-gray-400 flex items-center justify-center"
          >
            {saving ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                กำลังบันทึก...
              </>
            ) : (
              'บันทึกการเปลี่ยนแปลง'
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
);

// --- Main Component ---
const EditGunHistoryProfile = ({ onCancel, onSaved }) => {
  const { id } = useParams();
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const navigate = useNavigate();

  // Form data state
  const [formData, setFormData] = useState({
    subcategory: '',
    mechanism: '',
    brand: '',
    series: '',
    model: '',
    serial_info: '',
    place_name: '',
    province_id: '',
    district_id: '',
    subdistrict_id: '',
    date: '',
    time: '',
    confidence_percentage: 0
  });

  // Fetch history item data and location options
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setLoading(false);
        setError("ไม่พบข้อมูล ID ของรายการที่ต้องการแก้ไข");
        return;
      }
      try {
        setLoading(true);
        // Fetch history item details
        const historyResponse = await axios.get(`http://localhost:3001/api/history/${id}`);
        const historyDetails = historyResponse.data;
        setHistoryData(historyDetails);
        // Set initial form data
        setFormData({
          subcategory: historyDetails.exhibit?.subcategory || '',
          mechanism: historyDetails.exhibit?.firearm?.mechanism || '',
          brand: historyDetails.exhibit?.firearm?.brand || '',
          series: historyDetails.exhibit?.firearm?.series || '',
          model: historyDetails.exhibit?.firearm?.model || '',
          serial_info: historyDetails.exhibit?.firearm?.serial_info || '',
          place_name: historyDetails.place_name || '',
          province_id: historyDetails.province_id || '',
          district_id: historyDetails.district_id || '',
          subdistrict_id: historyDetails.subdistrict_id || '',
          date: formatDateForInput(historyDetails.date),
          time: historyDetails.time || '',
          confidence_percentage: (historyDetails.confidence_percentage || 0) * 100
        });
        // Fetch locations data
        const provincesResponse = await axios.get('http://localhost:3001/api/provinces');
        setProvinces(provincesResponse.data);
        // If province is selected, fetch districts
        if (historyDetails.province_id) {
          const districtsResponse = await axios.get(`http://localhost:3001/api/districts?province_id=${historyDetails.province_id}`);
          setDistricts(districtsResponse.data);
        }
        // If district is selected, fetch subdistricts
        if (historyDetails.district_id) {
          const subdistrictsResponse = await axios.get(`http://localhost:3001/api/subdistricts?district_id=${historyDetails.district_id}`);
          setSubdistricts(subdistrictsResponse.data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data for editing:', err);
        setError('ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, [id]);

  // Format date from DB format to input format (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      let date;
      if (dateString.includes('/')) {
        const [day, month, yearBE] = dateString.split('/');
        const yearCE = parseInt(yearBE) - 543;
        date = new Date(yearCE, parseInt(month) - 1, parseInt(day));
      } else {
        date = new Date(dateString);
      }
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("Error formatting date:", e);
      return '';
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle province change - load districts
  const handleProvinceChange = async (e) => {
    const provinceId = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      province_id: provinceId,
      district_id: '',
      subdistrict_id: ''
    }));
    setDistricts([]);
    setSubdistricts([]);
    if (!provinceId) return;
    try {
      const response = await axios.get(`http://localhost:3001/api/districts?province_id=${provinceId}`);
      setDistricts(response.data);
    } catch (err) {
      console.error("Error loading districts:", err);
    }
  };

  // Handle district change - load subdistricts
  const handleDistrictChange = async (e) => {
    const districtId = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      district_id: districtId,
      subdistrict_id: ''
    }));
    setSubdistricts([]);
    if (!districtId) return;
    try {
      const response = await axios.get(`http://localhost:3001/api/subdistricts?district_id=${districtId}`);
      setSubdistricts(response.data);
    } catch (err) {
      console.error("Error loading subdistricts:", err);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      // เตรียมข้อมูลสำหรับส่ง (แปลง confidence_percentage กลับเป็น 0-1)
      const normalizedData = {
        ...formData,
        confidence_percentage: formData.confidence_percentage / 100
      };

      // ส่งข้อมูลไปอัปเดต
      await axios.put(
        `http://localhost:3001/api/history/${id}`,
        normalizedData
      );

      setSaving(false);
      navigate('/history', {
        state: {
          popup: {
            open: true,
            type: 'success',
            message: 'บันทึกข้อมูลสำเร็จ'
          }
        }
      });
    } catch (err) {
      console.error('Error updating history:', err);
      setSaving(false);
      navigate('/history', {
        state: {
          popup: {
            open: true,
            type: 'fail',
            message: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง'
          }
        }
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-full flex justify-center items-center p-8 bg-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B0000] mb-3"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !historyData) {
    return (
      <div className="w-full h-full flex justify-center items-center p-8 bg-white">
        <div className="flex flex-col items-center text-center">
          <FiAlertCircle size={50} className="text-red-600 mb-4" />
          <h2 className="text-xl font-bold text-red-600 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onCancel || (() => navigate('/history'))}
            className="px-5 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            กลับ
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="w-full h-full flex justify-center items-center p-8 bg-white">
        <div className="flex flex-col items-center text-center">
          <FiCheckCircle size={50} className="text-green-600 mb-4" />
          <h2 className="text-xl font-bold text-green-600 mb-2">บันทึกข้อมูลสำเร็จ</h2>
          <p className="text-gray-600">กำลังกลับไปยังหน้าแสดงข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Responsive Layout
  return (
    <div className="h-full w-full">
      <div className="hidden md:block h-full">
        <DesktopLayout
          loading={loading}
          error={error}
          success={success}
          historyData={historyData}
          formData={formData}
          provinces={provinces}
          districts={districts}
          subdistricts={subdistricts}
          handleChange={handleChange}
          handleProvinceChange={handleProvinceChange}
          handleDistrictChange={handleDistrictChange}
          handleSubmit={handleSubmit}
          saving={saving}
          onCancel={onCancel || (() => navigate('/history'))}
        />
      </div>
      <div className="md:hidden h-full">
        <MobileLayout
          loading={loading}
          error={error}
          success={success}
          historyData={historyData}
          formData={formData}
          provinces={provinces}
          districts={districts}
          subdistricts={subdistricts}
          handleChange={handleChange}
          handleProvinceChange={handleProvinceChange}
          handleDistrictChange={handleDistrictChange}
          handleSubmit={handleSubmit}
          saving={saving}
          onCancel={onCancel || (() => navigate('/history'))}
        />
      </div>
    </div>
  );
};

export default EditGunHistoryProfile;