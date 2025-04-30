import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiEdit } from 'react-icons/fi'
import apiConfig from '../../../config/api';

const DesktopLayout = ({ formData, handleChange, handleSubmit, handleCancel, roles }) => (
  <div className="h-full flex flex-col">
    <div className="px-6 py-4 flex items-center flex-shrink-0 mb-4">
      <div className="bg-gray-100 p-2 rounded-md mr-2">
        <FiEdit size={20} className="text-yellow-600" />
      </div>
      <h1 className="text-base font-medium text-gray-800">แก้ไขโปรไฟล์</h1>
    </div>
    <div className="flex flex-1 items-center justify-center">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow p-6 mb-24">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center pb-4 border-b border-gray-200 mb-4">
            <div className="mr-4 relative">
              {formData.profile_image_url ? (
                <img
                  src={formData.profile_image_url}
                  alt="profile"
                  className="w-16 h-16 rounded-full object-cover border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 border">
                  {formData.firstname ? formData.firstname[0].toUpperCase() : ''}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-base font-medium text-gray-800">{formData.title} {formData.firstname} {formData.lastname}</h2>
              <p className="text-gray-500 text-sm">{formData.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">คำนำหน้าชื่อ</label>
              <select
                name="title"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.title}
                onChange={handleChange}
              >
                <option value="">เลือกคำนำหน้าชื่อ</option>
                <option value="นาย">นาย</option>
                <option value="นาง">นาง</option>
                <option value="นางสาว">นางสาว</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">อีเมล์</label>
              <input
                type="email"
                name="email"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">ชื่อจริง</label>
              <input
                type="text"
                name="firstname"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.firstname}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">นามสกุล</label>
              <input
                type="text"
                name="lastname"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.lastname}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">รหัสผ่าน (ถ้าไม่เปลี่ยนให้เว้นว่าง)</label>
              <input
                type="password"
                name="password"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.password || ''}
                onChange={handleChange}
                placeholder="********"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">แผนก</label>
              <input
                type="text"
                name="department"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.department || ''}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">ประเภทผู้ใช้</label>
              <select
                name="role_id"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.role_id}
                onChange={handleChange}
              >
                <option value="">เลือกประเภทผู้ใช้</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">สถานะ</label>
              <select
                name="is_active"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.is_active ? 'true' : 'false'}
                onChange={e => handleChange({ target: { name: 'is_active', value: e.target.value === 'true' } })}
              >
                <option value="true">เปิดใช้งาน</option>
                <option value="false">ปิดใช้งาน</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              className="px-6 py-2 border border-gray-400 text-gray-600 rounded"
              onClick={handleCancel}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)

const MobileLayout = ({ formData, handleChange, handleSubmit, handleCancel, roles }) => {
  const navigate = useNavigate();
  const [fullScreen, setFullScreen] = useState(false);
  const initial = formData.firstname ? formData.firstname[0].toUpperCase() : '';
  const hasProfileImage = !!formData.profile_image_url;

  return (
    <div className="bg-white min-h-screen pb-16">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between shadow-sm relative">
        <button 
          onClick={handleCancel}
          className="text-gray-700 absolute left-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div className="flex items-center justify-center w-full">
          <h1 className="text-lg font-medium text-gray-800">แก้ไขโปรไฟล์</h1>
        </div>
      </div>

      {/* Profile Photo Section */}
      <div className="flex justify-center mt-6 mb-8">
        <div className="relative">
          <div 
            onClick={() => setFullScreen(true)}
            className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center cursor-pointer overflow-hidden"
          >
            {hasProfileImage ? (
              <img 
                src={formData.profile_image_url} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-blue-500">{initial}</span>
            )}
          </div>
        </div>
      </div>
      
      {/* User Name and Email */}
      <div className="px-4 mb-4 text-center">
        <h2 className="text-base font-medium text-gray-800">{formData.title} {formData.firstname} {formData.lastname}</h2>
        <p className="text-gray-500 text-sm">{formData.email}</p>
      </div>

      {/* Profile Information (Editable) */}
      <form onSubmit={handleSubmit} className="px-4">
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="p-4 border-b">
            <label className="text-sm text-gray-500">คำนำหน้าชื่อ</label>
            <select
              name="title"
              className="w-full p-2 border border-gray-300 rounded-md mt-1"
              value={formData.title}
              onChange={handleChange}
            >
              <option value="">เลือกคำนำหน้าชื่อ</option>
              <option value="นาย">นาย</option>
              <option value="นาง">นาง</option>
              <option value="นางสาว">นางสาว</option>
            </select>
          </div>

          <div className="p-4 border-b">
            <label className="text-sm text-gray-500">ชื่อจริง</label>
            <input
              type="text"
              name="firstname"
              className="w-full p-2 border border-gray-300 rounded-md mt-1"
              value={formData.firstname}
              onChange={handleChange}
            />
          </div>

          <div className="p-4 border-b">
            <label className="text-sm text-gray-500">นามสกุล</label>
            <input
              type="text"
              name="lastname"
              className="w-full p-2 border border-gray-300 rounded-md mt-1"
              value={formData.lastname}
              onChange={handleChange}
            />
          </div>

          <div className="p-4 border-b">
            <label className="text-sm text-gray-500">อีเมล์</label>
            <input
              type="email"
              name="email"
              className="w-full p-2 border border-gray-300 rounded-md mt-1"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="p-4 border-b">
            <label className="text-sm text-gray-500">รหัสผ่าน (ถ้าไม่เปลี่ยนให้เว้นว่าง)</label>
            <input
              type="password"
              name="password"
              className="w-full p-2 border border-gray-300 rounded-md mt-1"
              value={formData.password || ''}
              onChange={handleChange}
              placeholder="********"
              autoComplete="new-password"
            />
          </div>

          <div className="p-4 border-b">
            <label className="text-sm text-gray-500">ระดับผู้ใช้</label>
            <select
              name="role_id"
              className="w-full p-2 border border-gray-300 rounded-md mt-1"
              value={formData.role_id}
              onChange={handleChange}
            >
              <option value="">เลือกประเภทผู้ใช้</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>

          <div className="p-4 border-b">
            <label className="text-sm text-gray-500">แผนก</label>
            <input
              type="text"
              name="department"
              className="w-full p-2 border border-gray-300 rounded-md mt-1"
              value={formData.department || ''}
              onChange={handleChange}
            />
          </div>

          <div className="p-4 border-b">
            <label className="text-sm text-gray-500">สถานะ</label>
            <select
              name="is_active"
              className="w-full p-2 border border-gray-300 rounded-md mt-1"
              value={formData.is_active ? 'true' : 'false'}
              onChange={e => handleChange({ target: { name: 'is_active', value: e.target.value === 'true' } })}
            >
              <option value="true">เปิดใช้งาน</option>
              <option value="false">ปิดใช้งาน</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 pb-8">
          <button
            type="button"
            className="px-6 py-2 border border-gray-400 text-gray-600 rounded"
            onClick={handleCancel}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded"
          >
            บันทึก
          </button>
        </div>
      </form>

      {/* Full Screen Profile Image Modal */}
      {fullScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <button 
            onClick={() => setFullScreen(false)}
            className="absolute top-4 right-4 text-white text-3xl"
          >
            ×
          </button>
          <div className="w-4/5 h-4/5 flex items-center justify-center">
            {hasProfileImage ? (
              <img 
                src={formData.profile_image_url} 
                alt="Profile" 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="w-64 h-64 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-6xl font-bold text-blue-500">{initial}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const EditUserProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    department: '',
    role_id: '',
    is_active: true,
    profile_image_url: '',
  })
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const API_PATH = '/api';

  useEffect(() => {
    // โหลดข้อมูล user
    fetch(`${apiConfig.baseUrl}${API_PATH}/users/list`)
      .then(res => res.json())
      .then(users => {
        const found = users.find(u => String(u.id) === String(id))
        if (found) {
          setFormData({
            title: found.title || '',
            firstname: found.firstname || '',
            lastname: found.lastname || '',
            email: found.email || '',
            password: '',
            department: found.department || '',
            role_id: found.role_id || found.role || '',
            is_active: found.is_active,
            profile_image_url: found.profile_image_url || '',
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
    // โหลด roles
    fetch(`${apiConfig.baseUrl}${API_PATH}/roles`)
      .then(res => res.json())
      .then(setRoles)
  }, [id])

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`${apiConfig.baseUrl}${API_PATH}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role_id: Number(formData.role_id), // แปลงให้เป็นเลข
          is_active: formData.is_active === 'true' || formData.is_active === true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด')
      setSuccess('บันทึกสำเร็จ')
      setTimeout(() => navigate(-1), 1000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCancel = () => navigate(-1)

  if (loading) return <div className="p-8 text-center">กำลังโหลดข้อมูล...</div>

  return (
    <div className="flex-1 overflow-auto h-full w-full">
      <div className="h-full w-full bg-gray-50 flex flex-col">
        <div className="hidden md:flex h-full flex-col">
          <DesktopLayout
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            handleCancel={handleCancel}
            roles={roles}
          />
        </div>
        <div className="md:hidden h-full">
          <MobileLayout
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            handleCancel={handleCancel}
            roles={roles}
          />
        </div>
        {error && <div className="text-red-500 p-2 text-center">{error}</div>}
        {success && <div className="text-green-500 p-2 text-center">{success}</div>}
      </div>
    </div>
  )
}

export default EditUserProfile