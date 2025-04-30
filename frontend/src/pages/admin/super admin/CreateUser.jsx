import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const DesktopLayout = ({ formData, handleChange, handleSubmit, handleCancel, roles, loading }) => (
  <div className="h-full flex flex-col">
    <div className="px-6 py-4 flex justify-between items-center flex-shrink-0">
      <h1 className="text-xl font-bold">เพิ่มผู้ใช้ใหม่</h1>
    </div>
    <div className="flex flex-1 items-center justify-center">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow p-6 mb-16">
        <h2 className="text-lg font-medium mb-6">กรอกข้อมูล</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center">
            <label className="w-32 text-sm">คำนำหน้าชื่อ:</label>
            <div className="w-72 relative">
              <select 
                name="title"
                className="w-full border rounded px-3 py-2 appearance-none bg-white"
                value={formData.title}
                onChange={handleChange}
              >
                <option value="">เลือกคำนำหน้าชื่อ</option>
                <option value="นาย">นาย</option>
                <option value="นาง">นาง</option>
                <option value="นางสาว">นางสาว</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="w-1/2 flex items-center">
              <label className="w-32 text-sm">ชื่อจริง:</label>
              <input
                type="text"
                name="firstName"
                placeholder="ระบุชื่อจริง"
                className="flex-1 border rounded px-3 py-2"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div className="w-1/2 flex items-center">
              <label className="w-32 text-sm">นามสกุล:</label>
              <input
                type="text"
                name="lastName"
                placeholder="ระบุนามสกุล"
                className="flex-1 border rounded px-3 py-2"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="w-1/2 flex items-center">
              <label className="w-32 text-sm">อีเมล:</label>
              <input
                type="email"
                name="email"
                placeholder="ระบุอีเมล"
                className="flex-1 border rounded px-3 py-2"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="w-1/2 flex items-center">
              <label className="w-32 text-sm">รหัสผ่าน:</label>
              <input
                type="password"
                name="password"
                placeholder="ระบุรหัสผ่าน"
                className="flex-1 border rounded px-3 py-2"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="w-1/2 flex items-center">
              <label className="w-32 text-sm">ตำแหน่ง:</label>
              <div className="flex-1 relative">
                <select 
                  name="position"
                  className="w-full border rounded px-3 py-2 appearance-none bg-white"
                  value={formData.position}
                  onChange={handleChange}
                >
                  <option value="">เลือกตำแหน่ง</option>
                  <option value="ผู้จัดการ">ผู้จัดการ</option>
                  <option value="พนักงาน">พนักงาน</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="w-1/2 flex items-center">
              <label className="w-32 text-sm">ประเภทผู้ใช้:</label>
              <div className="flex-1 relative">     
                <select
                  name="roleId"
                  className="w-full border rounded px-3 py-2 appearance-none bg-white"
                  value={formData.roleId}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">เลือกประเภทผู้ใช้</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <button 
              type="button" 
              className="px-6 py-2 border border-red-500 text-red-500 rounded"
              onClick={handleCancel}
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 bg-green-500 text-white rounded"
            >
              ยืนยัน
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)

const MobileLayout = ({ formData, handleChange, handleSubmit, handleCancel, roles, loading }) => (
  <div className="h-full flex flex-col">
    <div className="flex justify-between items-center flex-shrink-0 px-6 py-3 border-b-2 bg-white">
      <h1 className="text-lg font-bold">เพิ่มผู้ใช้ใหม่</h1>
    </div>
    <div className="flex-1 flex flex-col items-center justify-center bg-white">
      <form onSubmit={handleSubmit} className="w-full h-full max-w-md p-4 space-y-4">
        <div>
          <label className="block text-sm mb-1">คำนำหน้าชื่อ</label>
          <select
            name="title"
            className="w-full border rounded px-3 py-2 bg-white"
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
          <label className="block text-sm mb-1">ชื่อจริง</label>
          <input
            type="text"
            name="firstName"
            placeholder="ระบุชื่อจริง"
            className="w-full border rounded px-3 py-2"
            value={formData.firstName}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">นามสกุล</label>
          <input
            type="text"
            name="lastName"
            placeholder="ระบุนามสกุล"
            className="w-full border rounded px-3 py-2"
            value={formData.lastName}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">อีเมล</label>
          <input
            type="email"
            name="email"
            placeholder="ระบุอีเมล"
            className="w-full border rounded px-3 py-2"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">รหัสผ่าน</label>
          <input
            type="password"
            name="password"
            placeholder="ระบุรหัสผ่าน"
            className="w-full border rounded px-3 py-2"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">ตำแหน่ง</label>
          <select
            name="position"
            className="w-full border rounded px-3 py-2 bg-white"
            value={formData.position}
            onChange={handleChange}
          >
            <option value="">เลือกตำแหน่ง</option>
            <option value="ผู้จัดการ">ผู้จัดการ</option>
            <option value="พนักงาน">พนักงาน</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">ประเภทผู้ใช้</label>
          <select
            name="roleId"
            className="w-full border rounded px-3 py-2 appearance-none bg-white"
            value={formData.roleId}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">เลือกประเภทผู้ใช้</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
          </select>
        </div>
        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            className="px-4 py-2 border border-red-500 text-red-500 rounded text-sm"
            onClick={handleCancel}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded text-sm"
          >
            ยืนยัน
          </button>
        </div>
      </form>
    </div>
  </div>
)

const CreateUser = () => {
  const [formData, setFormData] = useState({
    idNumber: '',
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    position: '',
    roleId: '',
  })
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // โหลด Role จาก API
    fetch('http://localhost:3001/api/roles')
      .then(res => res.json())
      .then(data => {
        setRoles(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // ใช้ useCallback เพื่อป้องกัน function สร้างใหม่ทุกครั้งที่ render
  const handleChange = React.useCallback((e) => {
    const { name, value } = e.target
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }))
  }, [])

  const handleSubmit = React.useCallback(async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('http://localhost:3001/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          firstname: formData.firstName,
          lastname: formData.lastName,
          email: formData.email,
          password: formData.password,
          role_id: formData.roleId,
          department: formData.department,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด')
      setSuccess('สร้างผู้ใช้สำเร็จ')
      setFormData({
        title: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        department: '',
        roleId: '',
      })
    } catch (err) {
      setError(err.message)
    }
  }, [formData])

  const handleCancel = () => {
    navigate(-1)
  }

  const layoutProps = useMemo(() => ({
    formData,
    handleChange,
    handleSubmit,
    handleCancel,
    roles,
    loading
  }), [formData, handleChange, handleSubmit, handleCancel, roles, loading])

  return (
    <div className="flex-1 overflow-auto h-full w-full">
      <div className="h-full w-full bg-gray-50 flex flex-col">
        <div className="hidden md:flex h-full flex-col">
          <DesktopLayout {...layoutProps} />
        </div>
        <div className="block md:hidden w-full h-full">
          <MobileLayout {...layoutProps} />
        </div>
        {error && <div className="text-red-500 p-2 text-center">{error}</div>}
        {success && <div className="text-green-500 p-2 text-center">{success}</div>}
      </div>
    </div>
  )
}

export default CreateUser