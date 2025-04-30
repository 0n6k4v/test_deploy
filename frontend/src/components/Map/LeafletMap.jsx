import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, Tooltip, Circle, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import apiConfig from '../../config/api';

const API_PATH = '/api';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Add CSS for custom markers
const addCustomMarkerCSS = () => {
  // Add CSS only if it doesn't already exist
  if (!document.getElementById('custom-marker-styles')) {
    const style = document.createElement('style');
    style.id = 'custom-marker-styles';
    style.innerHTML = `
      .marker-pin {
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        position: absolute;
        transform: rotate(-45deg);
        left: 50%;
        top: 50%;
        margin: -15px 0 0 -15px;
      }
      
      .marker-pin::after {
        content: '';
        width: 24px;
        height: 24px;
        margin: 3px 0 0 3px;
        background: #fff;
        position: absolute;
        border-radius: 50%;
      }
      
      .custom-div-icon i {
        position: absolute;
        width: 22px;
        font-size: 22px;
        left: 0;
        right: 0;
        margin: 10px auto;
        text-align: center;
      }
      
      .custom-div-icon i.awesome {
        margin: 12px auto;
        font-size: 17px;
      }
    `;
    document.head.appendChild(style);
  }
};

// MapController component to handle map interactions
const MapController = ({ selectedAreas, visibleLevels }) => {
  const map = useMap();
  
  useEffect(() => {
    // Function to fit bounds to selected areas
    const fitBoundsToSelection = () => {
      const { provinces, districts, subdistricts } = selectedAreas;
      
      // ตรวจสอบว่าไม่มีพื้นที่ใดถูกเลือกหรือไม่
      const noSelection = 
        (!provinces || provinces.length === 0) && 
        (!districts || districts.length === 0) && 
        (!subdistricts || subdistricts.length === 0);
      
      // ถ้าไม่มีพื้นที่ที่เลือก ให้รีเซ็ตไปยังมุมมองเริ่มต้นของประเทศไทย
      if (noSelection) {
        // ตั้งค่ามุมมองเป็นแบบเริ่มต้น - ใช้ setView แทน fitBounds
        // กำหนดจุดกึ่งกลางประเทศไทยและระดับซูมที่เหมาะสม
        map.setView([13.7563, 100.5018], 6, {
          animate: true,
          duration: 0.5
        });
        return;
      }
      
      // ส่วนโค้ดเดิม - ใช้เมื่อมีพื้นที่ถูกเลือก
      let bounds = null;
      let targetAreas = [];
      
      // Determine which areas to focus on based on selection
      if (subdistricts && subdistricts.length > 0 && visibleLevels.subdistrict) {
        targetAreas = subdistricts;
      } else if (districts && districts.length > 0 && visibleLevels.district) {
        targetAreas = districts;
      } else if (provinces && provinces.length > 0) {
        targetAreas = provinces;
      }

      // If there are target areas, fit bounds to them
      if (targetAreas.length > 0) {
        targetAreas.forEach(area => {
          if (area.geometry && area.geometry.coordinates) {
            // Convert GeoJSON coordinates to Leaflet LatLng
            const latLngs = [];
            
            const processCoordinates = (coords, type) => {
              if (type === 'Polygon') {
                coords.forEach(ring => {
                  ring.forEach(point => {
                    latLngs.push(L.latLng(point[1], point[0]));
                  });
                });
              } else if (type === 'MultiPolygon') {
                coords.forEach(polygon => {
                  polygon.forEach(ring => {
                    ring.forEach(point => {
                      latLngs.push(L.latLng(point[1], point[0]));
                    });
                  });
                });
              }
            };
            
            const geometryType = area.geometry.type;
            processCoordinates(area.geometry.coordinates, geometryType);
            
            // Create bounds and extend with all coordinates
            if (latLngs.length > 0) {
              const areaBounds = L.latLngBounds(latLngs);
              if (bounds === null) {
                bounds = areaBounds;
              } else {
                bounds.extend(areaBounds);
              }
            }
          }
        });
        
        // Fit the map to the bounds with some padding
        if (bounds !== null && bounds.isValid()) {
          map.fitBounds(bounds, { 
            padding: [50, 50],
            maxZoom: 13,
            animate: false // ปิด animation
          });
        }
      }
    };
    
    fitBoundsToSelection();
  }, [map, selectedAreas, visibleLevels]);
  
  return null;
};

// เพิ่ม props เพื่อรับค่า filters และ showElements
const LeafletMap = ({ 
  selectedProvinces = [], 
  selectedDistricts = [], 
  selectedSubdistricts = [], 
  visibleLevels = { province: true, district: false, subdistrict: false },
  onProvinceClick = () => {}, 
  onDistrictSelect = () => {}, 
  onSubdistrictSelect = () => {},
  filters = {
    meth: true,
    heroin: true, 
    cannabis: true,
    cocaine: true,
    ketamine: true
  },
  showElements = {
    routes: true,
    distribution: true,
    hotspots: true
  }
}) => {
  const [thailandGeoJson, setThailandGeoJson] = useState(null);
  const [districtsGeoJson, setDistrictsGeoJson] = useState(null);
  const [subdistrictsGeoJson, setSubdistrictsGeoJson] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // เพิ่ม state สำหรับเก็บข้อมูลที่เกี่ยวข้องกับการกรอง
  const [routes, setRoutes] = useState([]);
  const [distributionPoints, setDistributionPoints] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  
  const mapRef = useRef(null);

  // Add custom marker CSS when component mounts
  useEffect(() => {
    addCustomMarkerCSS();
  }, []);

  // Fetch Thailand provinces GeoJSON and drug-related data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const provincesResponse = await axios.get(`${apiConfig.baseUrl}${API_PATH}/provinces`);
        const geojson = {
          type: "FeatureCollection",
          features: provincesResponse.data.map(p => ({
            type: "Feature",
            properties: {
              id: p.id,
              province_name: p.province_name,
              // ...properties อื่นๆถ้ามี
            },
            geometry: p.geometry
          }))
        };
        setThailandGeoJson(geojson);
        
        // เพิ่ม mock data สำหรับยาเสพติด
        // ในการใช้งานจริงควรดึงจาก API
        setRoutes([
          { id: 1, type: 'meth', path: [[13.7563, 100.5018], [16.8661, 100.2654]] },
          { id: 2, type: 'heroin', path: [[20.1688, 100.4083], [15.8700, 100.5083]] },
          { id: 3, type: 'cannabis', path: [[7.8804, 98.3923], [13.7563, 100.5018]] },
          { id: 4, type: 'meth', path: [[12.9346, 100.9234], [13.7563, 100.5018]] }, // เปลี่ยนจาก cocaine เป็น meth
          { id: 5, type: 'meth', path: [[6.3419, 99.7383], [10.4960, 99.1800]] } // เปลี่ยนจาก ketamine เป็น meth
        ]);
        
        setDistributionPoints([
          { id: 1, type: 'meth', position: [13.7563, 100.5018], label: 'กรุงเทพฯ - ยาเสพติด', icon: '' },
          { id: 2, type: 'heroin', position: [18.7883, 98.9853], label: 'เชียงใหม่ - ยาเสพติด', icon: '' },
          { id: 3, type: 'meth', position: [7.8804, 98.3923], label: 'ภูเก็ต - ยาเสพติด', icon: '' }, // เปลี่ยนจาก cannabis เป็น meth
          { id: 4, type: 'meth', position: [12.9346, 100.9234], label: 'พัทยา - ยาเสพติด', icon: '' }, // เปลี่ยนจาก cocaine เป็น meth
          { id: 5, type: 'meth', position: [6.3419, 99.7383], label: 'สตูล - ยาเสพติด', icon: '' }, // เปลี่ยนจาก ketamine เป็น meth
        ]);
        
        setHotspots([
          { id: 1, type: 'meth', position: [13.7563, 100.5018], radius: 30000 },
          { id: 2, type: 'heroin', position: [18.7883, 98.9853], radius: 20000 },
          { id: 3, type: 'cannabis', position: [7.8804, 98.3923], radius: 25000 },
          { id: 4, type: 'cocaine', position: [12.9346, 100.9234], radius: 15000 },
          { id: 5, type: 'ketamine', position: [6.3419, 99.7383], radius: 18000 }
        ]);
      } catch (error) {
        console.error('Error fetching Thailand GeoJSON:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch districts GeoJSON when provinces are selected or when visibleLevels.district changes
  useEffect(() => {
    const fetchDistrictsData = async () => {
      if (selectedProvinces.length > 0 && visibleLevels.district) {
        try {
          // เริ่มต้นดึงข้อมูลจริงจาก API
          const provinceIds = selectedProvinces.map(p => p.id).join(',');
          const response = await axios.get(`${apiConfig.baseUrl}${API_PATH}/districts?provinces=${provinceIds}`);
          
          // แปลงข้อมูลให้อยู่ในรูปแบบ GeoJSON
          const geojson = {
            type: "FeatureCollection",
            features: response.data.map(district => ({
              type: "Feature",
              properties: {
                id: district.id,
                name: district.district_name || district.amphoe_t || `District ${district.id}`,
                province_id: district.province_id || district.prov_id,
                district_id: district.id
              },
              geometry: district.geometry || district.geom
            }))
          };
          
          setDistrictsGeoJson(geojson);
        } catch (error) {
          console.error('Error fetching districts GeoJSON:', error);
          
          // Fallback to mock data if the API fails
          const mockDistrictsData = {
            type: "FeatureCollection",
            features: selectedProvinces.map(province => ({
              type: "Feature",
              properties: {
                id: `district-${province.id}-1`,
                province_id: province.id,
                name: `อำเภอเมือง${province.province_name}`
              },
              geometry: {
                type: "Polygon",
                coordinates: [[[100.5, 13.7], [100.6, 13.7], [100.6, 13.8], [100.5, 13.8], [100.5, 13.7]]]
              }
            }))
          };
          
          setDistrictsGeoJson(mockDistrictsData);
        }
      } else if (!visibleLevels.district) {
        // Clear districts data when district level is not visible
        setDistrictsGeoJson(null);
      }
    };

    fetchDistrictsData();
  }, [selectedProvinces, visibleLevels.district]);

  // Fetch subdistricts GeoJSON when districts are selected or when visibleLevels.subdistrict changes
  useEffect(() => {
    const fetchSubdistrictsData = async () => {
      if (selectedDistricts.length > 0 && visibleLevels.subdistrict) {
        try {
          // เริ่มต้นดึงข้อมูลจริงจาก API
          const districtIds = selectedDistricts.map(d => d.id).join(',');
          const response = await axios.get(`${apiConfig.baseUrl}${API_PATH}/subdistricts?districts=${districtIds}`);
          
          // แปลงข้อมูลให้อยู่ในรูปแบบ GeoJSON
          const geojson = {
            type: "FeatureCollection",
            features: response.data.map(subdistrict => ({
              type: "Feature",
              properties: {
                id: subdistrict.id,
                name: subdistrict.subdistrict_name || subdistrict.tambon_t || `Subdistrict ${subdistrict.id}`,
                district_id: subdistrict.district_id
              },
              geometry: subdistrict.geometry || subdistrict.geom
            }))
          };
          
          setSubdistrictsGeoJson(geojson);
        } catch (error) {
          console.error('Error fetching subdistricts GeoJSON:', error);
          
          // Fallback to mock data if the API fails
          const mockSubdistrictsData = {
            type: "FeatureCollection",
            features: selectedDistricts.map(district => ({
              type: "Feature",
              properties: {
                id: `subdistrict-${district.id}-1`,
                district_id: district.id,
                name: `ตำบล${district.district_name || 'ทดสอบ'}`
              },
              geometry: {
                type: "Polygon",
                coordinates: [[[100.52, 13.72], [100.55, 13.72], [100.55, 13.75], [100.52, 13.75], [100.52, 13.72]]]
              }
            }))
          };
          
          setSubdistrictsGeoJson(mockSubdistrictsData);
        }
      } else if (!visibleLevels.subdistrict) {
        // Clear subdistricts data when subdistrict level is not visible
        setSubdistrictsGeoJson(null);
      }
    };

    fetchSubdistrictsData();
  }, [selectedDistricts, visibleLevels.subdistrict]);

  // Style function for provinces
  const provinceStyle = (feature) => {
    const isSelected = selectedProvinces.some(p => p.id === feature.properties.id);
    return {
      weight: isSelected ? 2 : 1,
      opacity: 1,
      color: isSelected ? '#2563eb' : '#666',
      dashArray: isSelected ? '' : '',
      fillOpacity: isSelected ? 0.5 : 0.2,
      fillColor: isSelected ? '#93c5fd' : '#e2e8f0',
    };
  };

  // Style function for districts
  const districtStyle = (feature) => {
    const isSelected = selectedDistricts.some(d => d.id === feature.properties.id ||
                                                 d.id === feature.properties.district_id);
    return {
      weight: isSelected ? 2 : 1,
      opacity: 1,
      color: isSelected ? '#dd6b20' : '#a0aec0',
      dashArray: isSelected ? '' : '3',
      fillOpacity: isSelected ? 0.6 : 0.1,
      fillColor: isSelected ? 'rgba(237, 137, 54, 0.6)' : 'transparent',
    };
  };

  // Style function for subdistricts
  const subdistrictStyle = (feature) => {
    const isSelected = selectedSubdistricts.some(sd => sd.id === feature.properties.id);
    return {
      weight: isSelected ? 2 : 1,
      opacity: 1,
      color: isSelected ? '#38a169' : '#cbd5e0',
      dashArray: isSelected ? '' : '3',
      fillOpacity: isSelected ? 0.6 : 0.1,
      fillColor: isSelected ? 'rgba(94, 179, 148, 0.6)' : 'transparent',
    };
  };

  // Event handlers for each area type
  const onEachProvince = (feature, layer) => {
    const provinceName = feature.properties.province_name;
    const provinceId = feature.properties.id;

    layer.on({
      click: () => {
        const province = { 
          id: provinceId, 
          province_name: provinceName,
          geometry: feature.geometry
        };
        onProvinceClick(province, true);
      },
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          color: '#2563eb',
          dashArray: '',
          fillOpacity: 0.7,
        });
        layer.bringToFront();
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(provinceStyle(feature));
      },
    });
    
    layer.bindTooltip(provinceName);
  };

  const onEachDistrict = (feature, layer) => {
    const districtName = feature.properties.name || feature.properties.amphoe_t;
    const districtId = feature.properties.id;
    const provinceId = feature.properties.province_id || feature.properties.prov_id;
    
    layer.on({
      click: () => {
        const district = { 
          id: districtId, 
          district_name: districtName,
          province_id: provinceId,
          geometry: feature.geometry
        };
        onDistrictSelect(district, false, true);
      },
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          color: '#dd6b20',
          dashArray: '',
          fillOpacity: 0.7,
        });
        layer.bringToFront();
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(districtStyle(feature));
      },
    });
    
    layer.bindTooltip(districtName);
  };

  const onEachSubdistrict = (feature, layer) => {
    const subdistrictName = feature.properties.name || feature.properties.tambon_t;
    const subdistrictId = feature.properties.id;
    const districtId = feature.properties.district_id;
    
    layer.on({
      click: () => {
        const subdistrict = { 
          id: subdistrictId, 
          subdistrict_name: subdistrictName,
          district_id: districtId,
          geometry: feature.geometry
        };
        onSubdistrictSelect(subdistrict, false, true);
      },
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          color: '#38a169',
          dashArray: '',
          fillOpacity: 0.7,
        });
        layer.bringToFront();
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(subdistrictStyle(feature));
      },
    });
    
    layer.bindTooltip(subdistrictName);
  };

  // Filter features based on visibility settings and selections
  const filterDistricts = (feature) => {
    if (!visibleLevels.district) return false;
    return selectedProvinces.some(province => 
      feature.properties.province_id === province.id || 
      feature.properties.prov_id === province.id
    );
  };

  const filterSubdistricts = (feature) => {
    if (!visibleLevels.subdistrict) return false;
    return selectedDistricts.some(district => 
      feature.properties.district_id === district.id
    );
  };
  
  // Helper function to get color for drug type
  const getDrugColor = (type) => {
    // ใช้สีม่วงสำหรับยาเสพติดทุกชนิด
    return '#805ad5';
  };
  
  // Helper function to create custom marker icon with Material Icon
  const createCustomMarkerIcon = (type, iconName = 'place') => {
    const color = getDrugColor(type);
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="background-color:${color};" class="marker-pin"></div>
        <i class="material-icons">${iconName}</i>
      `,
      iconSize: [30, 42],
      iconAnchor: [15, 42],
      popupAnchor: [0, -35]
    });
  };
  
  // Filter drug data based on filters
  const filteredRoutes = routes.filter(route => filters[route.type]);
  const filteredDistributionPoints = distributionPoints.filter(point => filters[point.type]);
  const filteredHotspots = hotspots.filter(spot => filters[spot.type]);

  const mapStyle = {
    height: '100%',
    width: '100%',
    border: '1px solid #ddd',
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-xl">กำลังโหลดข้อมูลแผนที่...</div>;
  }

  // Prepare selectedAreas object for MapController
  const selectedAreas = {
    provinces: selectedProvinces,
    districts: selectedDistricts,
    subdistricts: selectedSubdistricts
  };

  // --- ตัวอย่าง dataset พิกัดต่างๆ ในประเทศไทย (mock) ---
  const sampleLocations = [
    { id: 1, name: 'กรุงเทพมหานคร', position: [13.7563, 100.5018], icon: '/Img/icon/ปืน.png', color: '#e53e3e', type: 'อาวุธปืน' },
    { id: 2, name: 'เชียงใหม่', position: [18.7883, 98.9853], icon: '/Img/icon/ยาเสพติด.png', color: '#805ad5', type: 'ยาเสพติด' },
    { id: 3, name: 'ขอนแก่น', position: [16.4419, 102.8350], icon: '/Img/icon/ปืน.png', color: '#e53e3e', type: 'อาวุธปืน' },
    { id: 4, name: 'ภูเก็ต', position: [7.8804, 98.3923], icon: '/Img/icon/ยาเสพติด.png', color: '#805ad5', type: 'ยาเสพติด' },
    { id: 5, name: 'สงขลา', position: [7.2077, 100.5946], icon: '/Img/icon/ปืน.png', color: '#e53e3e', type: 'อาวุธปืน' },
    { id: 6, name: 'นครราชสีมา', position: [14.9799, 102.0977], icon: '/Img/icon/ยาเสพติด.png', color: '#805ad5', type: 'ยาเสพติด' },
    { id: 7, name: 'อุบลราชธานี', position: [15.2447, 104.8470], icon: '/Img/icon/ปืน.png', color: '#e53e3e', type: 'อาวุธปืน' },
    { id: 8, name: 'พิษณุโลก', position: [16.8211, 100.2654], icon: '/Img/icon/ยาเสพติด.png', color: '#805ad5', type: 'ยาเสพติด' },
    { id: 9, name: 'สุราษฎร์ธานี', position: [9.1406, 99.3331], icon: '/Img/icon/ปืน.png', color: '#e53e3e', type: 'อาวุธปืน' },
    { id: 10, name: 'ระยอง', position: [12.6814, 101.2770], icon: '/Img/icon/ยาเสพติด.png', color: '#805ad5', type: 'ยาเสพติด' }
  ];

  return (
    <div className="map-container h-full w-auto">
      {/* Include Material Icons CSS */}
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      
      <MapContainer
        center={[13.7563, 100.5018]}
        zoom={6}
        style={mapStyle}
        maxBounds={[[5.6, 97.3], [20.5, 105.6]]}
        minZoom={5}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Add MapController to handle dynamic map updates */}
        <MapController 
          selectedAreas={selectedAreas} 
          visibleLevels={visibleLevels}
        />
        
        {/* Province Layer */}
        {thailandGeoJson && visibleLevels.province && (
          <GeoJSON
            data={thailandGeoJson}
            onEachFeature={onEachProvince}
            style={provinceStyle}
            key={`provinces-${selectedProvinces.length}`} // Add key for re-rendering
          />
        )}
        
        {/* District Layer */}
        {districtsGeoJson && visibleLevels.district && (
          <GeoJSON
            data={districtsGeoJson}
            onEachFeature={onEachDistrict}
            style={districtStyle}
            filter={filterDistricts}
            key={`districts-${selectedDistricts.length}-${visibleLevels.district}`} // Add key for re-rendering
          />
        )}
        
        {/* Subdistrict Layer */}
        {subdistrictsGeoJson && visibleLevels.subdistrict && (
          <GeoJSON
            data={subdistrictsGeoJson}
            onEachFeature={onEachSubdistrict}
            style={subdistrictStyle}
            filter={filterSubdistricts}
            key={`subdistricts-${selectedSubdistricts.length}-${visibleLevels.subdistrict}`} // Add key for re-rendering
          />
        )}
        
        {/* Distribution Points with Custom Icons */}
        {showElements.distribution && filteredDistributionPoints.map(point => (
          <Marker
            key={`dist-${point.id}`}
            position={point.position}
            icon={createCustomMarkerIcon(point.type, point.icon)}
          >
            <Tooltip permanent={false}>{point.label}</Tooltip>
          </Marker>
        ))}

        {/* ปัก Marker แบบกำหนด Custom Icon จาก dataset ตัวอย่าง */}
        {sampleLocations.map(loc => {
          // สร้าง HTML แตกต่างกันตามประเภทของไอคอน
          let iconHtml = '';
          
          if (loc.icon && loc.icon.startsWith('/')) {
            // ปรับตำแหน่งและขนาดของรูปภาพให้อยู่ในตำแหน่งที่ถูกต้อง
            iconHtml = `
              <div style="background-color:${loc.color};" class="marker-pin"></div>
              <div style="
                width: 18px;
                height: 18px;
                overflow: hidden;
                position: relative;
                top: 11px;
                left: 6px;
              ">
                <div style="
                  width: 100%;
                  height: 100%;
                  background: url('${loc.icon}') center center / contain no-repeat;
                "></div>
              </div>
            `;
          } else {
            // ถ้าเป็น Material Icon หรือค่าว่าง (ใช้ค่าเริ่มต้นตามประเภท)
            const iconName = loc.icon || (loc.type === 'อาวุธปืน' ? 'firearm' : 'medication');
            iconHtml = `
              <div style="background-color:${loc.color};" class="marker-pin"></div>
              <i class="material-icons">${iconName}</i>
            `;
          }
          
          const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: iconHtml,
            iconSize: [30, 42],
            iconAnchor: [15, 42],
            popupAnchor: [0, -35]
          });
          
          return (
            <Marker 
              key={loc.id} 
              position={loc.position}
              icon={customIcon}
            >
              <Popup>{loc.name}</Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;