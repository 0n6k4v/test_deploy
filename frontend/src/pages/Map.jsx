import React, { useState, useEffect, useRef, useCallback } from 'react';
import SvgMap from '../components/Map/SvgMap';
import LeafletMap from '../components/Map/LeafletMap';
import axios from 'axios';
import apiConfig from '../config/api';
import StatisticsPanel from '../components/Map/StatisticsPanel';
import { useDevice } from '../context/DeviceContext';

const DesktopLayout = ({
  mapView,
  setMapView,
  selectedAreas,
  filters,
  showElements,
  showFilter,
  setShowFilter,
  provinces,
  districts,
  subdistricts,
  loading,
  searchTerm,
  setSearchTerm,
  selectedProvinces,
  selectedDistricts,
  selectedSubdistricts,
  expandedProvinces,
  expandedDistricts,
  visibleLevels,
  provinceData,
  evidenceTypeFilter,
  showEvidenceFilter,
  setShowEvidenceFilter,
  handleEvidenceFilterChange,
  handleSelectionChange,
  handleProvinceClick,
  handleDistrictSelect,
  handleSubdistrictSelect,
  clearProvinceSelection,
  clearDistrictSelection,
  clearSubdistrictSelection,
  toggleFilter,
  toggleProvinceExpansion,
  toggleDistrictExpansion,
  toggleVisibleLevel,
  getFilteredData
}) => {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex h-full min-h-[600px] sm:h-[calc(100vh-64px)]">
        {/* Main Content (Map) */}
        <div className="flex-grow relative">
          {/* Map View Toggle Overlay */}
          <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md">
            <div className="flex p-1">
              <button
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  mapView === 'leaflet' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setMapView('leaflet')}
              >
                แผนที่เชิงภูมิศาสตร์
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  mapView === 'svg' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setMapView('svg')}
              >
                แผนที่แผนภาพ
              </button>
            </div>
          </div>
          
          {/* Detail Level Selector */}
          <div className="absolute top-16 left-4 bg-white bg-opacity-90 px-4 py-2 rounded-md shadow-md z-20">
            <span className="mr-4 font-medium text-sm">ระดับแสดงผล:</span>
            <label className="inline-flex items-center mr-4 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={visibleLevels.province}
                onChange={() => toggleVisibleLevel('province')}
                className="mr-1 form-checkbox h-4 w-4 text-blue-600 rounded"
              />
              <span>จังหวัด</span>
            </label>
            <label className="inline-flex items-center mr-4 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={visibleLevels.district}
                onChange={() => toggleVisibleLevel('district')}
                className="mr-1 form-checkbox h-4 w-4 text-blue-600 rounded"
                disabled={districts.length === 0}
              />
              <span>อำเภอ</span>
            </label>
            <label className="inline-flex items-center text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={visibleLevels.subdistrict}
                onChange={() => toggleVisibleLevel('subdistrict')}
                className="mr-1 form-checkbox h-4 w-4 text-blue-600 rounded"
                disabled={subdistricts.length === 0}
              />
              <span>ตำบล</span>
            </label>
          </div>
          
          {/* Filter Buttons Group */}
          <div className="absolute top-4 right-4 flex space-x-2 z-20">
            {/* Evidence Type Filter Button */}
            <button
              className="bg-purple-600 text-white px-4 py-2 rounded-md shadow-md text-sm hover:bg-purple-700 transition-colors"
              onClick={() => setShowEvidenceFilter(!showEvidenceFilter)}
            >
              ประเภทวัตถุพยาน
            </button>
            
            {/* Location Filter Button */}
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-md text-sm hover:bg-blue-700 transition-colors"
              onClick={toggleFilter}
            >
              {showFilter ? "ซ่อนตัวเลือก" : "ตัวเลือก"}
            </button>
          </div>

          {/* Selected Items Display Panel */}
          <div className="absolute top-28 left-4 bg-white bg-opacity-85 p-3 rounded-md shadow-lg z-20 max-w-xs text-xs flex flex-col gap-y-3">
             {selectedProvinces.length === 0 && selectedDistricts.length === 0 && selectedSubdistricts.length === 0 && (
                <p className="text-gray-500 italic">ไม่มีรายการที่เลือก</p>
             )}
             {selectedProvinces.length > 0 && (
                 <div>
                    <h2 className="text-sm font-semibold mb-1.5 flex justify-between items-center">
                        <span>จังหวัดที่เลือก ({selectedProvinces.length})</span>
                        <button
                            className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-0.5 rounded text-[10px] ml-2"
                            onClick={clearProvinceSelection}
                            title="ล้างจังหวัดที่เลือกทั้งหมด"
                        >
                            ล้างหมด
                        </button>
                    </h2>
                    <div className="max-h-20 overflow-y-auto border rounded p-1.5 space-y-1">
                        {selectedProvinces.map(province => (
                        <div key={province.id} className="flex justify-between items-center bg-gray-50 px-1 py-0.5 rounded">
                            <span className="truncate mr-1">{province.province_name}</span>
                            <button
                              className="text-red-500 hover:text-red-700 text-xs font-bold"
                              onClick={() => handleProvinceClick(province)}
                              title={`ลบ ${province.province_name}`}
                            >
                              ✕
                            </button>
                        </div>
                        ))}
                    </div>
                </div>
             )}
             {selectedDistricts.length > 0 && (
                 <div>
                    <h2 className="text-sm font-semibold mb-1.5 flex justify-between items-center">
                         <span>อำเภอที่เลือก ({selectedDistricts.length})</span>
                          <button
                            className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-0.5 rounded text-[10px]"
                            onClick={clearDistrictSelection}
                            title="ล้างอำเภอที่เลือกทั้งหมด"
                        >
                            ล้างหมด
                        </button>
                    </h2>
                    <div className="max-h-20 overflow-y-auto border rounded p-1.5 space-y-1">
                        {selectedDistricts.map(district => {
                            const provinceName = provinces.find(p => p.id === district.province_id)?.province_name;
                            const displayName = district.district_name || district.amphoe_t || `ID: ${district.id}`;
                            return (
                                <div key={district.id} className="flex justify-between items-center bg-gray-50 px-1 py-0.5 rounded">
                                    <span className="truncate mr-1" title={`${displayName}${provinceName ? ` (${provinceName})` : ''}`}>
                                        {displayName}
                                        {provinceName && <span className="text-gray-500 text-[10px]"> ({provinceName})</span>}
                                    </span>
                                    <button
                                        className="text-red-500 hover:text-red-700 text-xs font-bold"
                                        onClick={() => handleDistrictSelect(district, true)}
                                        title={`ลบ ${displayName}`}
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
             )}
             {selectedSubdistricts.length > 0 && (
                <div>
                   <h2 className="text-sm font-semibold mb-1.5 flex justify-between items-center">
                       <span>ตำบลที่เลือก ({selectedSubdistricts.length})</span>
                       <button
                          className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-0.5 rounded text-[10px]"
                          onClick={clearSubdistrictSelection}
                          title="ล้างตำบลที่เลือกทั้งหมด"
                      >
                          ล้างหมด
                      </button>
                   </h2>
                   <div className="max-h-20 overflow-y-auto border rounded p-1.5 space-y-1">
                       {selectedSubdistricts.map(subdistrict => {
                           const district = districts.find(d => d.id === subdistrict.district_id);
                           const districtName = district?.district_name || district?.amphoe_t || '';
                           const displayName = subdistrict.subdistrict_name || subdistrict.tambon_t || `ID: ${subdistrict.id}`;
                           return (
                               <div key={subdistrict.id} className="flex justify-between items-center bg-gray-50 px-1 py-0.5 rounded">
                                   <span className="truncate mr-1" title={`${displayName}${districtName ? ` (${districtName})` : ''}`}>
                                       {displayName}
                                       {districtName && <span className="text-gray-500 text-[10px]"> ({districtName})</span>}
                                   </span>
                                   <button
                                       className="text-red-500 hover:text-red-700 text-xs font-bold"
                                       onClick={() => handleSubdistrictSelect(subdistrict, true)}
                                       title={`ลบ ${displayName}`}
                                   >
                                       ✕
                                   </button>
                               </div>
                           );
                       })}
                   </div>
                </div>
             )}
          </div>
          
          {/* Map Legend */}
          <div className="absolute top-16 right-4 bg-white bg-opacity-85 p-3 rounded-md shadow-lg z-20 text-xs">
            <h3 className="font-semibold mb-2">คำอธิบายแผนที่</h3>
            <div className="space-y-2">
              {visibleLevels.province && (
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-300 mr-2 rounded"></div>
                  <span>จังหวัดที่เลือก</span>
                </div>
              )}
              {visibleLevels.district && (
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-orange-200 mr-2 rounded" style={{opacity: 0.6}}></div>
                  <span>อำเภอที่เลือก</span>
                </div>
              )}
              {visibleLevels.subdistrict && (
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-200 mr-2 rounded" style={{opacity: 0.6}}></div>
                  <span>ตำบลที่เลือก</span>
                </div>
              )}
            </div>
          </div>

          {/* Map Component */}
          <div className="relative w-full h-full">
            <div 
              style={{ 
                position: 'absolute', 
                inset: 0, 
                display: mapView === 'leaflet' ? 'block' : 'none',
                zIndex: mapView === 'leaflet' ? 1 : 0,
              }}
            >
              <LeafletMap 
                selectedProvinces={selectedProvinces}
                selectedDistricts={selectedDistricts}
                selectedSubdistricts={selectedSubdistricts}
                visibleLevels={visibleLevels}
                onProvinceClick={handleProvinceClick}
                onDistrictSelect={handleDistrictSelect}
                onSubdistrictSelect={handleSubdistrictSelect}
                filters={filters}
                showElements={showElements}
                evidenceTypeFilter={evidenceTypeFilter}
              />
            </div>
            
            <div 
              style={{ 
                position: 'absolute', 
                inset: 0,
                display: mapView === 'svg' ? 'block' : 'none',
                zIndex: mapView === 'svg' ? 1 : 0,
              }}
            >
              <SvgMap 
                selectedProvinces={selectedProvinces}
                selectedDistricts={selectedDistricts}
                selectedSubdistricts={selectedSubdistricts}
                visibleLevels={visibleLevels}
                onProvinceClick={handleProvinceClick}
                onDistrictSelect={handleDistrictSelect}
                onSubdistrictSelect={handleSubdistrictSelect}
                onSelectionChange={handleSelectionChange}
                filters={filters}
                showElements={showElements}
                evidenceTypeFilter={evidenceTypeFilter}
              />
            </div>
          </div>
          
          {/* Evidence Type Filter Popup */}
          {showEvidenceFilter && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-xl p-4 w-72 max-w-lg overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">ประเภทวัตถุพยาน</h2>
                  <button
                    className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded text-sm"
                    onClick={() => setShowEvidenceFilter(false)}
                  >
                    ปิด
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="evidenceType"
                      value="all"
                      checked={evidenceTypeFilter === 'all'}
                      onChange={() => handleEvidenceFilterChange('all')}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="text-gray-700">ทั้งหมด</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="evidenceType"
                      value="firearms"
                      checked={evidenceTypeFilter === 'firearms'}
                      onChange={() => handleEvidenceFilterChange('firearms')}
                      className="form-radio h-4 w-4 text-red-600"
                    />
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 mr-2 rounded-full"></div>
                      <span className="text-gray-700">อาวุธปืน</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="evidenceType"
                      value="drugs"
                      checked={evidenceTypeFilter === 'drugs'}
                      onChange={() => handleEvidenceFilterChange('drugs')}
                      className="form-radio h-4 w-4 text-purple-600"
                    />
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 mr-2 rounded-full"></div>
                      <span className="text-gray-700">ยาเสพติด</span>
                    </div>
                  </label>
                </div>

                <div className="mt-4">
                  <button
                    className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700"
                    onClick={() => setShowEvidenceFilter(false)}
                  >
                    นำไปใช้
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Hierarchical Filter Popup */}
          {showFilter && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-xl p-4 w-96 max-h-[80vh] max-w-lg overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">ตัวเลือก</h2>
                  <button
                    className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded text-sm"
                    onClick={toggleFilter}
                  >
                    ปิด
                  </button>
                </div>
                {/* Search Box */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="ค้นหาจังหวัด อำเภอ หรือตำบล..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {/* Actions */}
                <div className="flex justify-between mb-4 gap-x-2">
                  <button
                    className="flex-1 bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
                    onClick={clearProvinceSelection}
                    disabled={selectedProvinces.length === 0}
                  >
                    ล้างที่เลือกทั้งหมด
                  </button>
                  <button
                    className="flex-1 bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                    onClick={() => {
                      setVisibleLevels({
                        province: true,
                        district: selectedDistricts.length > 0 || selectedSubdistricts.length > 0,
                        subdistrict: selectedSubdistricts.length > 0
                      });
                      setShowFilter(false);
                    }}
                  >
                    ดูที่เลือกบนแผนที่
                  </button>
                </div>
                {/* Hierarchical List */}
                <div className="overflow-y-auto flex-grow border rounded">
                  {loading ? (
                    <p className="text-gray-500 text-sm p-3 text-center">กำลังโหลดข้อมูล...</p>
                  ) : getFilteredData().length === 0 ? (
                    <p className="text-gray-500 text-sm p-3 text-center">ไม่พบข้อมูลที่ค้นหา</p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {getFilteredData().map(({ province, districts: provinceDistricts }) => {
                        const isProvSelected = selectedProvinces.some(p => p.id === province.id);
                        const isProvinceExpanded = expandedProvinces[province.id] || searchTerm.trim() !== '';
                        return (
                          <li key={province.id} className="border-b last:border-b-0">
                            {/* Province Header */}
                            <div className="flex items-center px-3 py-2 bg-gray-50">
                              <button
                                onClick={() => toggleProvinceExpansion(province.id)}
                                className="mr-2 text-gray-700 hover:text-blue-600"
                              >
                                {isProvinceExpanded ? '▾' : '▸'}
                              </button>
                              <div className="flex items-center flex-grow">
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isProvSelected}
                                    onChange={() => handleProvinceClick(province)}
                                    className="h-4 w-4 text-blue-600 rounded form-checkbox"
                                  />
                                  <span className="ml-2 text-sm">{province.province_name}</span>
                                </label>
                              </div>
                            </div>
                            {isProvinceExpanded && provinceDistricts.length > 0 && provinceDistricts.map(district => {
                              const isDistrictExpanded = expandedDistricts[district.id];
                              const isSelected = selectedDistricts.some(d => d.id === district.id);
                              return (
                                <div key={district.id}>
                                  <div className="flex items-center pl-8 pr-3 py-1 bg-gray-100">
                                    <button
                                      onClick={() => toggleDistrictExpansion(district.id)}
                                      className="mr-2 text-gray-700 hover:text-blue-600"
                                    >
                                      {isDistrictExpanded ? '▾' : '▸'}
                                    </button>
                                    <div className="flex items-center flex-grow">
                                      <label className="flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => handleDistrictSelect(district, isSelected)}
                                          className="h-3 w-3 text-orange-500 rounded form-checkbox"
                                        />
                                        <span className="ml-1 text-xs">{district.district_name || district.amphoe_t || `ID: ${district.id}`}</span>
                                      </label>
                                    </div>
                                  </div>
                                  {isDistrictExpanded && district.subdistricts && district.subdistricts.length > 0 && (
                                    <div className="pl-10 pr-3 py-2 bg-gray-50 flex flex-wrap gap-2">
                                      {district.subdistricts.map(subdistrict => {
                                        const isSelected = selectedSubdistricts.some(sd => sd.id === subdistrict.id);
                                        const displayName = subdistrict.subdistrict_name || subdistrict.tambon_t || `ID: ${subdistrict.id}`;
                                        return (
                                          <label 
                                            key={subdistrict.id} 
                                            className={`inline-flex items-center cursor-pointer px-2 py-1 rounded text-xs
                                              ${isSelected ? 'bg-green-100 border border-green-300' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'}`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() => handleSubdistrictSelect(subdistrict, isSelected)}
                                              className="h-3 w-3 text-green-500 rounded form-checkbox"
                                            />
                                            <span className="ml-1 truncate" title={displayName}>
                                              {displayName}
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Statistics Panel */}
        <div className="w-64 bg-white border-l border-gray-300 shadow-lg overflow-y-auto">
          <StatisticsPanel 
            selectedAreas={selectedAreas}
            provinceData={provinceData}
            isVisible={true}
            evidenceTypeFilter={evidenceTypeFilter}
          />
        </div>
      </div>
    </div>
  );
};

// Mobile version of the map interface
const MobileLayout = ({
  mapView,
  setMapView,
  selectedAreas,
  filters,
  showElements,
  showFilter,
  setShowFilter,
  provinces,
  districts,
  subdistricts,
  loading,
  searchTerm,
  setSearchTerm,
  selectedProvinces,
  selectedDistricts,
  selectedSubdistricts,
  expandedProvinces,
  expandedDistricts,
  visibleLevels,
  provinceData,
  evidenceTypeFilter,
  showEvidenceFilter,
  setShowEvidenceFilter,
  handleEvidenceFilterChange,
  handleSelectionChange,
  handleProvinceClick,
  handleDistrictSelect,
  handleSubdistrictSelect,
  clearProvinceSelection,
  clearDistrictSelection,
  clearSubdistrictSelection,
  toggleFilter,
  toggleProvinceExpansion,
  toggleDistrictExpansion,
  toggleVisibleLevel,
  getFilteredData
}) => {
  const [showStats, setShowStats] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  
  return (
    <div className="flex flex-col h-screen w-full relative">
      {/* Map Container - Takes full height */}
      <div className="h-full w-full relative">
        {/* Map View */}
        <div className="absolute inset-0">
          <div 
            style={{ 
              position: 'absolute', 
              inset: 0, 
              display: mapView === 'leaflet' ? 'block' : 'none',
              zIndex: mapView === 'leaflet' ? 1 : 0,
            }}
          >
            <LeafletMap 
              selectedProvinces={selectedProvinces}
              selectedDistricts={selectedDistricts}
              selectedSubdistricts={selectedSubdistricts}
              visibleLevels={visibleLevels}
              onProvinceClick={handleProvinceClick}
              onDistrictSelect={handleDistrictSelect}
              onSubdistrictSelect={handleSubdistrictSelect}
              filters={filters}
              showElements={showElements}
              evidenceTypeFilter={evidenceTypeFilter}
            />
          </div>
          
          <div 
            style={{ 
              position: 'absolute', 
              inset: 0,
              display: mapView === 'svg' ? 'block' : 'none',
              zIndex: mapView === 'svg' ? 1 : 0,
            }}
          >
            <SvgMap 
              selectedProvinces={selectedProvinces}
              selectedDistricts={selectedDistricts}
              selectedSubdistricts={selectedSubdistricts}
              visibleLevels={visibleLevels}
              onProvinceClick={handleProvinceClick}
              onDistrictSelect={handleDistrictSelect}
              onSubdistrictSelect={handleSubdistrictSelect}
              onSelectionChange={handleSelectionChange}
              filters={filters}
              showElements={showElements}
              evidenceTypeFilter={evidenceTypeFilter}
            />
          </div>
        </div>
        
        {/* Top Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 z-30 bg-white bg-opacity-90 p-2 shadow-md flex justify-between items-center">
          <div className="flex space-x-2">
            <button 
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${mapView === 'leaflet' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setMapView('leaflet')}
            >
              แผนที่ภูมิศาสตร์
            </button>
            <button 
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${mapView === 'svg' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setMapView('svg')}
            >
              แผนภาพ
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowEvidenceFilter(!showEvidenceFilter)}
              className="bg-purple-600 text-white px-3 py-1.5 rounded-md text-xs font-medium"
            >
              ประเภท
            </button>
            <button 
              onClick={toggleFilter}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium"
            >
              พื้นที่
            </button>
          </div>
        </div>
        
        {/* Floating Action Buttons */}
        <div className="absolute bottom-20 right-4 flex flex-col space-y-3 z-30">
          {/* Controls button */}
          <button
            onClick={() => setShowControls(!showControls)}
            className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          
          {/* Legend button */}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <rect x="7" y="7" width="3" height="3"></rect>
              <rect x="14" y="7" width="3" height="3"></rect>
              <rect x="7" y="14" width="3" height="3"></rect>
              <rect x="14" y="14" width="3" height="3"></rect>
            </svg>
          </button>
          
          {/* Stats button */}
          <button
            onClick={() => setShowStats(!showStats)}
            className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </button>
        </div>

        {/* Control Panel Slide-up */}
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-lg z-40 transition-transform transform animate-slide-up">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">ระดับแสดงผล</h3>
                <button onClick={() => setShowControls(false)} className="text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={visibleLevels.province}
                    onChange={() => toggleVisibleLevel('province')}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded"
                  />
                  <span>จังหวัด</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={visibleLevels.district}
                    onChange={() => toggleVisibleLevel('district')}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded"
                    disabled={districts.length === 0}
                  />
                  <span>อำเภอ</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={visibleLevels.subdistrict}
                    onChange={() => toggleVisibleLevel('subdistrict')}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded"
                    disabled={subdistricts.length === 0}
                  />
                  <span>ตำบล</span>
                </label>
              </div>
              
              {selectedProvinces.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">รายการที่เลือก</h4>
                  <div className="max-h-28 overflow-y-auto border rounded-md p-2">
                    {selectedProvinces.map(province => (
                      <div key={province.id} className="flex justify-between items-center p-1 border-b last:border-b-0">
                        <span className="text-sm">{province.province_name}</span>
                        <button
                          className="text-red-500 text-sm"
                          onClick={() => handleProvinceClick(province)}
                        >
                          ลบ
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDistricts.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">อำเภอที่เลือก ({selectedDistricts.length})</h4>
                  <div className="max-h-28 overflow-y-auto border rounded-md p-2">
                    {selectedDistricts.map(district => {
                      const provinceName = provinces.find(p => p.id === district.province_id)?.province_name;
                      const displayName = district.district_name || district.amphoe_t || `ID: ${district.id}`;
                      return (
                        <div key={district.id} className="flex justify-between items-center p-1 border-b last:border-b-0">
                          <span className="text-sm" title={`${displayName}${provinceName ? ` (${provinceName})` : ''}`}>
                            {displayName}
                            {provinceName && <span className="text-gray-500 text-xs"> ({provinceName})</span>}
                          </span>
                          <button
                            className="text-red-500 text-sm"
                            onClick={() => handleDistrictSelect(district, true)}
                          >
                            ลบ
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button 
                    className="mt-2 w-full bg-red-400 text-white py-1.5 rounded-md text-sm"
                    onClick={clearDistrictSelection}
                  >
                    ล้างอำเภอที่เลือกทั้งหมด
                  </button>
                </div>
              )}

              {selectedSubdistricts.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">ตำบลที่เลือก ({selectedSubdistricts.length})</h4>
                  <div className="max-h-28 overflow-y-auto border rounded-md p-2">
                    {selectedSubdistricts.map(subdistrict => {
                      const district = districts.find(d => d.id === subdistrict.district_id);
                      const districtName = district?.district_name || district?.amphoe_t || '';
                      const displayName = subdistrict.subdistrict_name || subdistrict.tambon_t || `ID: ${subdistrict.id}`;
                      return (
                        <div key={subdistrict.id} className="flex justify-between items-center p-1 border-b last:border-b-0">
                          <span className="text-sm" title={`${displayName}${districtName ? ` (${districtName})` : ''}`}>
                            {displayName}
                            {districtName && <span className="text-gray-500 text-xs"> ({districtName})</span>}
                          </span>
                          <button
                            className="text-red-500 text-sm"
                            onClick={() => handleSubdistrictSelect(subdistrict, true)}
                          >
                            ลบ
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button 
                    className="mt-2 w-full bg-red-400 text-white py-1.5 rounded-md text-sm"
                    onClick={clearSubdistrictSelection}
                  >
                    ล้างตำบลที่เลือกทั้งหมด
                  </button>
                </div>
              )}

              <button
                className="mt-4 w-full bg-red-500 text-white py-2 rounded-md"
                onClick={clearProvinceSelection}
                disabled={selectedProvinces.length === 0}
              >
                ล้างที่เลือกทั้งหมด
              </button>
            </div>
          </div>
        )}
        
        {/* Legend Slide-up */}
        {showLegend && (
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-lg z-40 transition-transform transform animate-slide-up">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">คำอธิบายแผนที่</h3>
                <button onClick={() => setShowLegend(false)} className="text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                {visibleLevels.province && (
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-300 mr-3 rounded"></div>
                    <span>จังหวัดที่เลือก</span>
                  </div>
                )}
                {visibleLevels.district && (
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-orange-200 mr-3 rounded" style={{opacity: 0.6}}></div>
                    <span>อำเภอที่เลือก</span>
                  </div>
                )}
                {visibleLevels.subdistrict && (
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-green-200 mr-3 rounded" style={{opacity: 0.6}}></div>
                    <span>ตำบลที่เลือก</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Statistics Panel Slide-up */}
        {showStats && (
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-lg z-40 max-h-[70vh] overflow-y-auto transition-transform transform animate-slide-up">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">สถิติ</h3>
                <button onClick={() => setShowStats(false)} className="text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                </button>
              </div>
              
              <div className="pb-6">
                <StatisticsPanel 
                  selectedAreas={selectedAreas}
                  provinceData={provinceData}
                  isVisible={true}
                  isMobile={true}
                  evidenceTypeFilter={evidenceTypeFilter}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Evidence Type Filter Modal */}
        {showEvidenceFilter && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg w-[80%] max-w-xs overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-lg">ประเภทวัตถุพยาน</h3>
                  <button onClick={() => setShowEvidenceFilter(false)} className="text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                <label className="flex items-center space-x-3 p-2 border rounded-md border-gray-200">
                  <input
                    type="radio"
                    name="evidenceTypeMobile"
                    value="all"
                    checked={evidenceTypeFilter === 'all'}
                    onChange={() => handleEvidenceFilterChange('all')}
                    className="form-radio h-5 w-5 text-blue-600"
                  />
                  <span className="text-gray-700 text-lg">ทั้งหมด</span>
                </label>
                
                <label className="flex items-center space-x-3 p-2 border rounded-md border-gray-200">
                  <input
                    type="radio"
                    name="evidenceTypeMobile"
                    value="firearms"
                    checked={evidenceTypeFilter === 'firearms'}
                    onChange={() => handleEvidenceFilterChange('firearms')}
                    className="form-radio h-5 w-5 text-red-600"
                  />
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 mr-2 rounded-full"></div>
                    <span className="text-gray-700 text-lg">อาวุธปืน</span>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 p-2 border rounded-md border-gray-200">
                  <input
                    type="radio"
                    name="evidenceTypeMobile"
                    value="drugs"
                    checked={evidenceTypeFilter === 'drugs'}
                    onChange={() => handleEvidenceFilterChange('drugs')}
                    className="form-radio h-5 w-5 text-purple-600"
                  />
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-500 mr-2 rounded-full"></div>
                    <span className="text-gray-700 text-lg">ยาเสพติด</span>
                  </div>
                </label>
              </div>
              
              <div className="p-4">
                <button
                  className="w-full py-3 bg-purple-600 text-white rounded-md text-lg font-medium"
                  onClick={() => setShowEvidenceFilter(false)}
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Filter Modal */}
        {showFilter && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg w-[90%] max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-lg">ตัวเลือก</h3>
                  <button onClick={toggleFilter} className="text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                {/* Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="ค้นหาจังหวัด อำเภอ หรือตำบล..."
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2 mb-4">
                  <button
                    className="flex-1 py-2 rounded-md bg-red-500 text-white disabled:opacity-50"
                    onClick={clearProvinceSelection}
                    disabled={selectedProvinces.length === 0}
                  >
                    ล้างที่เลือกทั้งหมด
                  </button>
                  <button
                    className="flex-1 py-2 rounded-md bg-green-500 text-white"
                    onClick={() => {
                      setVisibleLevels({
                        province: true,
                        district: selectedDistricts.length > 0 || selectedSubdistricts.length > 0,
                        subdistrict: selectedSubdistricts.length > 0
                      });
                      setShowFilter(false);
                    }}
                  >
                    ดูที่เลือกบนแผนที่
                  </button>
                </div>
              </div>
              
              {/* Hierarchical List */}
              <div className="overflow-y-auto flex-grow border-t">
                {loading ? (
                  <p className="p-4 text-center text-gray-500">กำลังโหลดข้อมูล...</p>
                ) : getFilteredData().length === 0 ? (
                  <p className="p-4 text-center text-gray-500">ไม่พบข้อมูลที่ค้นหา</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {getFilteredData().map(({ province, districts: provinceDistricts }) => {
                      const isProvSelected = selectedProvinces.some(p => p.id === province.id);
                      const isProvinceExpanded = expandedProvinces[province.id] || searchTerm.trim() !== '';
                      return (
                        <li key={province.id} className="border-b last:border-b-0">
                          {/* Province Header */}
                          <div className="flex items-center px-4 py-3 bg-gray-50">
                            <button
                              onClick={() => toggleProvinceExpansion(province.id)}
                              className="mr-3 text-gray-700"
                            >
                              {isProvinceExpanded ? '▾' : '▸'}
                            </button>
                            <div className="flex items-center flex-grow">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isProvSelected}
                                  onChange={() => handleProvinceClick(province)}
                                  className="h-5 w-5 text-blue-600 rounded form-checkbox"
                                />
                                <span className="ml-2">{province.province_name}</span>
                              </label>
                            </div>
                          </div>
                          {isProvinceExpanded && provinceDistricts.length > 0 && provinceDistricts.map(district => {
                            const isDistrictExpanded = expandedDistricts[district.id];
                            const isSelected = selectedDistricts.some(d => d.id === district.id);
                            return (
                              <div key={district.id}>
                                <div className="flex items-center pl-8 pr-4 py-2 bg-gray-100">
                                  <button
                                    onClick={() => toggleDistrictExpansion(district.id)}
                                    className="mr-3 text-gray-700"
                                  >
                                    {isDistrictExpanded ? '▾' : '▸'}
                                  </button>
                                  <div className="flex items-center flex-grow">
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleDistrictSelect(district, isSelected)}
                                        className="h-4 w-4 text-orange-500 rounded form-checkbox"
                                      />
                                      <span className="ml-2 text-sm">{district.district_name || district.amphoe_t || `ID: ${district.id}`}</span>
                                    </label>
                                  </div>
                                </div>
                                {isDistrictExpanded && district.subdistricts && district.subdistricts.length > 0 && (
                                  <div className="pl-12 pr-4 py-3 bg-gray-50 flex flex-wrap gap-2">
                                    {district.subdistricts.map(subdistrict => {
                                      const isSelected = selectedSubdistricts.some(sd => sd.id === subdistrict.id);
                                      const displayName = subdistrict.subdistrict_name || subdistrict.tambon_t || `ID: ${subdistrict.id}`;
                                      return (
                                        <label 
                                          key={subdistrict.id} 
                                          className={`inline-flex items-center cursor-pointer px-2 py-1 rounded text-xs
                                            ${isSelected ? 'bg-green-100 border border-green-300' : 'bg-gray-50 border border-gray-200'}`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleSubdistrictSelect(subdistrict, isSelected)}
                                            className="h-3 w-3 text-green-500 rounded form-checkbox"
                                          />
                                          <span className="ml-1 truncate" title={displayName}>
                                            {displayName}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Map = () => {
  const API_PATH = '/api';
  const { isMobile, isTablet, isDesktop } = useDevice();
  const [mapView, setMapView] = useState('leaflet');
  const [selectedAreas, setSelectedAreas] = useState({
    provinces: [],
    districts: [],
    subdistricts: []
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    meth: true,
    heroin: true, 
    cannabis: true,
    cocaine: true,
    ketamine: true
  });
  
  const [showElements, setShowElements] = useState({
    routes: true,
    distribution: true,
    hotspots: true
  });
  
  // Evidence Type Filter state
  const [evidenceTypeFilter, setEvidenceTypeFilter] = useState('all');
  const [showEvidenceFilter, setShowEvidenceFilter] = useState(false);
  
  // Shared filter panel state
  const [showFilter, setShowFilter] = useState(false);
  
  // Data states
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search and selection states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvinces, setSelectedProvinces] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [selectedSubdistricts, setSelectedSubdistricts] = useState([]);
  const [expandedProvinces, setExpandedProvinces] = useState({});
  const [expandedDistricts, setExpandedDistricts] = useState({});
  
  // Visible levels state
  const [visibleLevels, setVisibleLevels] = useState({
    province: true,
    district: false,
    subdistrict: false,
  });

  // Evidence type filter handler
  const handleEvidenceFilterChange = useCallback((type) => {
    setEvidenceTypeFilter(type);
  }, []);

  // Provincial drug case data
  const provinceData = [
    { province: 'กรุงเทพมหานคร', cases: 60 },
    { province: 'ชอนแก่น', cases: 35 },
    { province: 'ชัยนาท', cases: 25 },
    { province: 'นครปฐม', cases: 22 },
    { province: 'นครราชสีมา', cases: 15 },
    { province: 'ปทุมธานี', cases: 10 },
    { province: 'พิษณุโลก', cases: 8 },
    { province: 'ภูเก็ต', cases: 6 },
    { province: 'สงขลา', cases: 5 },
    { province: 'สระบุรี', cases: 4 },
    { province: 'อื่นๆ', cases: 3 }
  ];

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [provincesResponse, districtsResponse, subdistrictsResponse] = await Promise.all([
          axios.get(`${apiConfig.baseUrl}${API_PATH}/provinces`),
          axios.get(`${apiConfig.baseUrl}${API_PATH}/districts`),
          axios.get(`${apiConfig.baseUrl}${API_PATH}/subdistricts`)
        ]);
        
        setProvinces(provincesResponse.data);
        setDistricts(districtsResponse.data.map(d => ({
          ...d,
          province_id: d.province_id || d.prov_id || null
        })));
        setSubdistricts(subdistrictsResponse.data.map(sd => ({
          ...sd,
          district_id: sd.district_id || null
        })));
      } catch (error) {
        console.error('Error fetching map data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // --- Selection Handling ---
  const handleSelectionChange = useCallback(selections => {
    if (
      JSON.stringify(selectedProvinces) === JSON.stringify(selections.provinces) &&
      JSON.stringify(selectedDistricts) === JSON.stringify(selections.districts) &&
      JSON.stringify(selectedSubdistricts) === JSON.stringify(selections.subdistricts)
    ) {
      return; // No change
    }
    
    setSelectedProvinces(selections.provinces);
    setSelectedDistricts(selections.districts);
    setSelectedSubdistricts(selections.subdistricts);
    setSelectedAreas(selections);
  }, [selectedProvinces, selectedDistricts, selectedSubdistricts]);

  const handleProvinceClick = useCallback((province, forceSelect = false) => {
    setSelectedProvinces(prevSelected => {
      const isSelected = prevSelected.some(p => p.id === province.id);
      if (!isSelected) {
        setVisibleLevels(prev => ({
          ...prev,
          district: true
        }));
        const newProvinces = [...prevSelected, province];
        handleSelectionChange({
          provinces: newProvinces,
          districts: selectedDistricts,
          subdistricts: selectedSubdistricts
        });
        return newProvinces;
      } else if (!forceSelect) {
        const newDistricts = selectedDistricts.filter(d => d.province_id !== province.id);
        const newSubdistricts = selectedSubdistricts.filter(sd => sd.province_id !== province.id);
        const newProvinces = prevSelected.filter(p => p.id !== province.id);
        
        handleSelectionChange({
          provinces: newProvinces,
          districts: newDistricts,
          subdistricts: newSubdistricts
        });
        
        setSelectedDistricts(newDistricts);
        setSelectedSubdistricts(newSubdistricts);
        return newProvinces;
      }
      return prevSelected;
    });
  }, [handleSelectionChange, selectedDistricts, selectedSubdistricts]);

  const handleDistrictSelect = useCallback((district, isSelected, forceSelect = false) => {
    setSelectedDistricts(prevSelected => {
      const alreadySelected = prevSelected.some(d => d.id === district.id);
      if (!alreadySelected) {
        setVisibleLevels(prev => ({
          ...prev,
          subdistrict: true
        }));
        const newDistricts = [...prevSelected, district];
        handleSelectionChange({
          provinces: selectedProvinces,
          districts: newDistricts,
          subdistricts: selectedSubdistricts
        });
        return newDistricts;
      } else if (!forceSelect) {
        const newSubdistricts = selectedSubdistricts.filter(sd => sd.district_id !== district.id);
        const newDistricts = prevSelected.filter(d => d.id !== district.id);
        
        handleSelectionChange({
          provinces: selectedProvinces,
          districts: newDistricts,
          subdistricts: newSubdistricts
        });
        
        setSelectedSubdistricts(newSubdistricts);
        return newDistricts;
      }
      return prevSelected;
    });
  }, [handleSelectionChange, selectedProvinces, selectedSubdistricts]);

  const handleSubdistrictSelect = useCallback((subdistrict, isSelected, forceSelect = false) => {
    setSelectedSubdistricts(prevSelected => {
      const alreadySelected = prevSelected.some(sd => sd.id === subdistrict.id);
      if (!alreadySelected) {
        const newSubdistricts = [...prevSelected, subdistrict];
        handleSelectionChange({
          provinces: selectedProvinces,
          districts: selectedDistricts,
          subdistricts: newSubdistricts
        });
        return newSubdistricts;
      } else if (!forceSelect) {
        const newSubdistricts = prevSelected.filter(sd => sd.id !== subdistrict.id);
        handleSelectionChange({
          provinces: selectedProvinces,
          districts: selectedDistricts,
          subdistricts: newSubdistricts
        });
        return newSubdistricts;
      }
      return prevSelected;
    });
  }, [handleSelectionChange, selectedProvinces, selectedDistricts]);

  const clearProvinceSelection = useCallback(() => {
    setSelectedProvinces([]);
    setSelectedDistricts([]);
    setSelectedSubdistricts([]);
    handleSelectionChange({
      provinces: [],
      districts: [],
      subdistricts: []
    });
  }, [handleSelectionChange]);

  const clearDistrictSelection = useCallback(() => {
    setSelectedDistricts([]);
    setSelectedSubdistricts([]);
    handleSelectionChange({
      provinces: selectedProvinces,
      districts: [],
      subdistricts: []
    });
  }, [handleSelectionChange, selectedProvinces]);

  const clearSubdistrictSelection = useCallback(() => {
    setSelectedSubdistricts([]);
    handleSelectionChange({
      provinces: selectedProvinces,
      districts: selectedDistricts,
      subdistricts: []
    });
  }, [handleSelectionChange, selectedProvinces, selectedDistricts]);

  // --- UI Controls ---
  const toggleFilter = useCallback(() => {
    setShowFilter(prev => !prev);
  }, []);

  const toggleProvinceExpansion = useCallback((provinceId) => {
    setExpandedProvinces(prev => ({
      ...prev,
      [provinceId]: !prev[provinceId]
    }));
  }, []);

  const toggleDistrictExpansion = useCallback((districtId) => {
    setExpandedDistricts(prev => ({
      ...prev,
      [districtId]: !prev[districtId]
    }));
  }, []);

  const toggleVisibleLevel = useCallback((level) => {
    setVisibleLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  }, []);
  
  // --- Filtered Data ---
  const getFilteredData = useCallback(() => {
    if (!searchTerm.trim() || !provinces.length) {
      return provinces.map(province => {
        const provinceDistricts = districts.filter(d => d.province_id === province.id);
        return {
          province,
          districts: provinceDistricts.map(district => ({
            ...district,
            subdistricts: subdistricts.filter(sd => sd.district_id === district.id)
          }))
        };
      });
    }
    
    const term = searchTerm.toLowerCase().trim();
    const matchingProvinces = provinces.filter(province => 
      province.province_name?.toLowerCase().includes(term)
    );
    const matchingDistricts = districts.filter(district => 
      (district.district_name || district.amphoe_t || '')
        ?.toLowerCase().includes(term)
    );
    const matchingSubdistricts = subdistricts.filter(subdistrict => 
      (subdistrict.subdistrict_name || subdistrict.tambon_t || '')
        ?.toLowerCase().includes(term)
    );
    
    const matchingDistrictProvinceIds = new Set(
      matchingDistricts.map(d => d.province_id)
    );
    const matchingSubdistrictProvinceIds = new Set(
      matchingSubdistricts.map(sd => sd.province_id)
    );
    
    const allMatchingProvinceIds = new Set([
      ...matchingProvinces.map(p => p.id),
      ...matchingDistrictProvinceIds,
      ...matchingSubdistrictProvinceIds
    ]);
    
    const allMatchingProvinces = provinces.filter(p => allMatchingProvinceIds.has(p.id));
    
    return allMatchingProvinces.map(province => {
      if (matchingProvinces.some(p => p.id === province.id)) {
        return {
          province,
          districts: districts.filter(d => d.province_id === province.id).map(district => ({
            ...district,
            subdistricts: subdistricts.filter(sd => sd.district_id === district.id)
          }))
        };
      } else {
        const matchingDistrictsInProvince = matchingDistricts.filter(d => d.province_id === province.id);
        return {
          province,
          districts: matchingDistrictsInProvince.map(district => ({
            ...district,
            subdistricts: matchingSubdistricts.filter(sd => sd.district_id === district.id)
          }))
        };
      }
    });
  }, [provinces, districts, subdistricts, searchTerm]);

  // Common props to pass to both layouts
  const sharedProps = {
    mapView,
    setMapView,
    selectedAreas,
    filters,
    showElements,
    showFilter,
    setShowFilter,
    provinces,
    districts,
    subdistricts,
    loading,
    searchTerm,
    setSearchTerm,
    selectedProvinces,
    selectedDistricts,
    selectedSubdistricts,
    expandedProvinces,
    expandedDistricts,
    visibleLevels,
    provinceData,
    evidenceTypeFilter,
    showEvidenceFilter,
    setShowEvidenceFilter,
    handleEvidenceFilterChange,
    handleSelectionChange,
    handleProvinceClick,
    handleDistrictSelect,
    handleSubdistrictSelect,
    clearProvinceSelection,
    clearDistrictSelection,
    clearSubdistrictSelection,
    toggleFilter,
    toggleProvinceExpansion,
    toggleDistrictExpansion,
    toggleVisibleLevel,
    getFilteredData
  };

  // Add keyframe animation for mobile slide-up panels
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      .animate-slide-up {
        animation: slideUp 0.3s ease-out forwards;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <>
      <div className="hidden md:block w-full h-full">
        <DesktopLayout {...sharedProps} />
      </div>
      <div className="md:hidden w-full h-full">
        <MobileLayout {...sharedProps} />
      </div>
    </>
  );
};

export default Map;