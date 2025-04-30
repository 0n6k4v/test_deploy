import { useState, useEffect } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend } from "chart.js";
import axios from 'axios';
import apiConfig from '../config/api';

const API_PATH = '/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

const Statistics = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    mostFrequentProvince: { name: 'ไม่มีข้อมูล', count: 0 },
    totalExhibits: 0,
    totalFirearms: 0,
    totalDrugs: 0,
    firearmsByBrand: { labels: [], data: [] },
    exhibitsByDate: { labels: [], data: [] },
    drugsByType: { labels: [], data: [], colors: [] }
  });

  // Fetch history data from API
  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiConfig.baseUrl}${API_PATH}/history`);
        setHistoryData(response.data);
        processHistoryData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching history data:', err);
        setError('ไม่สามารถดึงข้อมูลประวัติได้');
        setLoading(false);
      }
    };

    fetchHistoryData();
  }, []);

  // Process history data for dashboard stats
  const processHistoryData = (data) => {
    if (!data || data.length === 0) return;

    // Count exhibits by province
    const provinceCount = {};
    // Count firearms by province
    const firearmProvinceCount = {};
    // Count drugs by province
    const drugProvinceCount = {};
    // Firearms data
    const firearmBrands = {};
    let mostCommonFirearm = { brand: 'ไม่มีข้อมูล', count: 0 };
    // Drugs data
    const drugTypes = {};
    let mostCommonDrug = { type: 'ไม่มีข้อมูล', count: 0 };
    
    // แยกข้อมูลตามประเภทของวัตถุพยาน (สำหรับกราฟแท่ง Top 10)
    const exhibitsByCategory = {};
    
    // แยกข้อมูลตามวันที่เพื่อใช้คำนวณเปอร์เซ็นต์การเปลี่ยนแปลง
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // ข้อมูลยาเสพติดตามวันที่
    const drugsByDate = {};
    // ข้อมูลยาเสพติดตามประเภท
    const drugsByType = {};
    
    // คำนวณวันเริ่มต้นของช่วงเวลาปัจจุบัน (7 วันล่าสุด) และช่วงเวลาก่อนหน้า (7 วันก่อนหน้านั้น)
    const currentPeriodStart = new Date(today);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - 6); // 7 วันล่าสุด (วันนี้ + 6 วันก่อนหน้านี้)
    
    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 7); // 7 วันก่อนหน้าช่วงปัจจุบัน
    
    // ตัวแปรสำหรับนับจำนวนในแต่ละช่วงเวลา
    let currentPeriodTotal = 0;
    let previousPeriodTotal = 0;
    
    let currentPeriodFirearms = 0;
    let previousPeriodFirearms = 0;
    
    let currentPeriodDrugs = 0;
    let previousPeriodDrugs = 0;
    
    // ข้อมูลจังหวัดในแต่ละช่วงเวลา
    const currentPeriodProvinces = {};
    const previousPeriodProvinces = {};
    
    // ข้อมูลจังหวัดสำหรับอาวุธปืนในแต่ละช่วงเวลา
    const currentPeriodFirearmProvinces = {};
    const previousPeriodFirearmProvinces = {};
    
    // ข้อมูลจังหวัดสำหรับยาเสพติดในแต่ละช่วงเวลา
    const currentPeriodDrugProvinces = {};
    const previousPeriodDrugProvinces = {};
    
    // Initialize data for drugs by date (last 7 days)
    const last7Days = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      last7Days[dateString] = 0;
      drugsByDate[dateString] = 0;
    }
    
    data.forEach(item => {
      // ประมวลผลจังหวัดและประเภทของวัตถุพยาน
      if (item.province_name) {
        provinceCount[item.province_name] = (provinceCount[item.province_name] || 0) + 1;
        
        // นับประเภทวัตถุพยานทั้งหมด (สำหรับกราฟแท่ง Top 10)
        if (item.exhibit && item.exhibit.category) {
          exhibitsByCategory[item.exhibit.category] = (exhibitsByCategory[item.exhibit.category] || 0) + 1;
        }
        
        // นับอาวุธปืนตามจังหวัด
        if (item.exhibit && item.exhibit.category && 
            (item.exhibit.category.toLowerCase().includes('อาวุธ') || 
             item.exhibit.category.toLowerCase().includes('firearm'))) {
          firearmProvinceCount[item.province_name] = (firearmProvinceCount[item.province_name] || 0) + 1;
          
          // นับอาวุธปืนตามยี่ห้อ
          if (item.exhibit.firearm && item.exhibit.firearm.brand) {
            const brand = item.exhibit.firearm.brand;
            firearmBrands[brand] = (firearmBrands[brand] || 0) + 1;
            
            // บันทึกยี่ห้อปืนที่พบมากที่สุด
            if (firearmBrands[brand] > mostCommonFirearm.count) {
              mostCommonFirearm = { brand, count: firearmBrands[brand] };
            }
          }
        }
        
        // นับยาเสพติดตามจังหวัดและประเภท
        if (item.exhibit && item.exhibit.category && 
            (item.exhibit.category.toLowerCase().includes('ยา') || 
             item.exhibit.category.toLowerCase().includes('drug'))) {
          drugProvinceCount[item.province_name] = (drugProvinceCount[item.province_name] || 0) + 1;
          
          // นับยาเสพติดตามประเภท
          if (item.exhibit.subcategory) {
            const type = item.exhibit.subcategory;
            drugTypes[type] = (drugTypes[type] || 0) + 1;
            
            // บันทึกประเภทยาเสพติดที่พบมากที่สุด
            if (drugTypes[type] > mostCommonDrug.count) {
              mostCommonDrug = { type, count: drugTypes[type] };
            }
            
            // นับยาเสพติดตามประเภทสำหรับกราฟวงกลม
            drugsByType[type] = (drugsByType[type] || 0) + 1;
          }
          
          // นับยาเสพติดตามวันที่
          if (item.date) {
            const itemDate = item.date.split('T')[0]; // Format: YYYY-MM-DD
            if (drugsByDate.hasOwnProperty(itemDate)) {
              drugsByDate[itemDate]++;
            }
          }
        }
        
        // คำนวณตามช่วงเวลาเพื่อหาเปอร์เซ็นต์การเปลี่ยนแปลง
        if (item.date) {
          const itemDate = new Date(item.date);
          
          // ตรวจสอบว่าวัตถุพยานนี้อยู่ในช่วง 7 วันปัจจุบันหรือไม่
          if (itemDate >= currentPeriodStart && itemDate <= today) {
            currentPeriodTotal++;
            
            // นับจำนวนจังหวัดในช่วงปัจจุบัน
            currentPeriodProvinces[item.province_name] = (currentPeriodProvinces[item.province_name] || 0) + 1;
            
            // นับจำนวนอาวุธปืนและยาเสพติดในช่วงปัจจุบัน
            if (item.exhibit && item.exhibit.category) {
              if (item.exhibit.category.toLowerCase().includes('อาวุธ') || 
                  item.exhibit.category.toLowerCase().includes('firearm')) {
                currentPeriodFirearms++;
                currentPeriodFirearmProvinces[item.province_name] = (currentPeriodFirearmProvinces[item.province_name] || 0) + 1;
              } else if (item.exhibit.category.toLowerCase().includes('ยา') || 
                         item.exhibit.category.toLowerCase().includes('drug')) {
                currentPeriodDrugs++;
                currentPeriodDrugProvinces[item.province_name] = (currentPeriodDrugProvinces[item.province_name] || 0) + 1;
              }
            }
          }
          // ตรวจสอบว่าวัตถุพยานนี้อยู่ในช่วง 7 วันก่อนหน้าหรือไม่
          else if (itemDate >= previousPeriodStart && itemDate < currentPeriodStart) {
            previousPeriodTotal++;
            
            // นับจำนวนจังหวัดในช่วงก่อนหน้า
            previousPeriodProvinces[item.province_name] = (previousPeriodProvinces[item.province_name] || 0) + 1;
            
            // นับจำนวนอาวุธปืนและยาเสพติดในช่วงก่อนหน้า
            if (item.exhibit && item.exhibit.category) {
              if (item.exhibit.category.toLowerCase().includes('อาวุธ') || 
                  item.exhibit.category.toLowerCase().includes('firearm')) {
                previousPeriodFirearms++;
                previousPeriodFirearmProvinces[item.province_name] = (previousPeriodFirearmProvinces[item.province_name] || 0) + 1;
              } else if (item.exhibit.category.toLowerCase().includes('ยา') || 
                         item.exhibit.category.toLowerCase().includes('drug')) {
                previousPeriodDrugs++;
                previousPeriodDrugProvinces[item.province_name] = (previousPeriodDrugProvinces[item.province_name] || 0) + 1;
              }
            }
          }
        }
      }
    });

    // ฟังก์ชันสำหรับคำนวณเปอร์เซ็นต์การเปลี่ยนแปลง (จากช่วงก่อนหน้าถึงช่วงปัจจุบัน)
    const calculateChangePercent = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? "+100.0%" : "+0.0%";
      }
      
      const changePercent = ((current - previous) / previous) * 100;
      const sign = changePercent >= 0 ? "+" : "";
      return `${sign}${changePercent.toFixed(1)}%`;
    };
    
    // หาจังหวัดที่พบวัตถุพยานมากที่สุดในช่วงปัจจุบัน และคำนวณ % การเปลี่ยนแปลง
    let maxCurrentProvinceCount = 0;
    let currentTopProvince = "";
    Object.entries(currentPeriodProvinces).forEach(([province, count]) => {
      if (count > maxCurrentProvinceCount) {
        maxCurrentProvinceCount = count;
        currentTopProvince = province;
      }
    });
    
    // คำนวณเปอร์เซ็นต์การเปลี่ยนแปลงของจังหวัดที่พบวัตถุพยานมากที่สุด
    const previousCountForTopProvince = previousPeriodProvinces[currentTopProvince] || 0;
    const provinceChangePercent = calculateChangePercent(maxCurrentProvinceCount, previousCountForTopProvince);
    
    // หาจังหวัดที่พบอาวุธปืนมากที่สุดในช่วงปัจจุบัน และคำนวณ % การเปลี่ยนแปลง
    let maxCurrentFirearmProvinceCount = 0;
    let currentTopFirearmProvince = "";
    Object.entries(currentPeriodFirearmProvinces).forEach(([province, count]) => {
      if (count > maxCurrentFirearmProvinceCount) {
        maxCurrentFirearmProvinceCount = count;
        currentTopFirearmProvince = province;
      }
    });
    
    // คำนวณเปอร์เซ็นต์การเปลี่ยนแปลงของจังหวัดที่พบอาวุธปืนมากที่สุด
    const previousCountForTopFirearmProvince = previousPeriodFirearmProvinces[currentTopFirearmProvince] || 0;
    const firearmProvinceChangePercent = calculateChangePercent(maxCurrentFirearmProvinceCount, previousCountForTopFirearmProvince);
    
    // หาจังหวัดที่พบยาเสพติดมากที่สุดในช่วงปัจจุบัน และคำนวณ % การเปลี่ยนแปลง
    let maxCurrentDrugProvinceCount = 0;
    let currentTopDrugProvince = "";
    Object.entries(currentPeriodDrugProvinces).forEach(([province, count]) => {
      if (count > maxCurrentDrugProvinceCount) {
        maxCurrentDrugProvinceCount = count;
        currentTopDrugProvince = province;
      }
    });
    
    // คำนวณเปอร์เซ็นต์การเปลี่ยนแปลงของจังหวัดที่พบยาเสพติดมากที่สุด
    const previousCountForTopDrugProvince = previousPeriodDrugProvinces[currentTopDrugProvince] || 0;
    const drugProvinceChangePercent = calculateChangePercent(maxCurrentDrugProvinceCount, previousCountForTopDrugProvince);

    // Find most frequent province
    let maxCount = 0;
    let mostFrequentProvince = { name: 'ไม่มีข้อมูล', count: 0 };
    Object.entries(provinceCount).forEach(([province, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentProvince = { name: province, count };
      }
    });

    // Find most frequent province for firearms
    let maxFirearmCount = 0;
    let mostFrequentFirearmProvince = { name: 'ไม่มีข้อมูล', count: 0 };
    Object.entries(firearmProvinceCount).forEach(([province, count]) => {
      if (count > maxFirearmCount) {
        maxFirearmCount = count;
        mostFrequentFirearmProvince = { name: province, count };
      }
    });
    
    // Find most frequent province for drugs
    let maxDrugCount = 0;
    let mostFrequentDrugProvince = { name: 'ไม่มีข้อมูล', count: 0 };
    Object.entries(drugProvinceCount).forEach(([province, count]) => {
      if (count > maxDrugCount) {
        maxDrugCount = count;
        mostFrequentDrugProvince = { name: province, count };
      }
    });

    // Count total exhibits by type
    const totalExhibits = data.length;
    let totalFirearms = 0;
    let totalDrugs = 0;

    data.forEach(item => {
      if (item.exhibit && item.exhibit.category) {
        if (item.exhibit.category.toLowerCase().includes('อาวุธ') || 
            item.exhibit.category.toLowerCase().includes('firearm')) {
          totalFirearms++;
        } else if (item.exhibit.category.toLowerCase().includes('ยา') || 
                  item.exhibit.category.toLowerCase().includes('drug')) {
          totalDrugs++;
        }
      }
    });

    // คำนวณเปอร์เซ็นต์การเปลี่ยนแปลงของจำนวนวัตถุพยาน อาวุธปืน และยาเสพติดทั้งหมด
    const totalExhibitsChangePercent = calculateChangePercent(currentPeriodTotal, previousPeriodTotal);
    const totalFirearmsChangePercent = calculateChangePercent(currentPeriodFirearms, previousPeriodFirearms);
    const totalDrugsChangePercent = calculateChangePercent(currentPeriodDrugs, previousPeriodDrugs);

    // เตรียมข้อมูล Top 10 ประเภทวัตถุพยานทั้งหมด เรียงจากน้อยไปมาก
    const sortedExhibitsByCategory = Object.entries(exhibitsByCategory)
      .sort((a, b) => a[1] - b[1])  // เรียงจากน้อยไปมาก
      .slice(0, 10);  // เลือกเฉพาะ 10 อันดับแรก
    
    const exhibitsByCategoryChart = {
      labels: sortedExhibitsByCategory.map(item => item[0]),
      data: sortedExhibitsByCategory.map(item => item[1])
    };

    // Prepare firearm brand data for chart (top 5 brands)
    const sortedFirearmBrands = Object.entries(firearmBrands)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const firearmsByBrand = {
      labels: sortedFirearmBrands.map(item => item[0]),
      data: sortedFirearmBrands.map(item => item[1])
    };

    // Group exhibits by date (last 7 days)
    const last7Days2 = {};
    const today2 = new Date();
    
    // Initialize the last 7 days with 0 values
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today2);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      last7Days2[dateString] = 0;
    }

    // Count items by date
    data.forEach(item => {
      if (item.date) {
        const itemDate = item.date.split('T')[0]; // Format: YYYY-MM-DD
        if (last7Days2.hasOwnProperty(itemDate)) {
          last7Days2[itemDate]++;
        }
      }
    });

    // Format date labels for display (as short day name)
    const dateLabels = Object.keys(last7Days2).map(dateStr => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('th-TH', { weekday: 'short' });
    });

    const exhibitsByDate = {
      labels: dateLabels,
      data: Object.values(last7Days2)
    };

    // Prepare drug types data for chart
    const sortedDrugTypes = Object.entries(drugsByType)
      .sort((a, b) => b[1] - a[1]);
    
    const drugsByTypeChart = {
      labels: sortedDrugTypes.map(item => item[0]),
      data: sortedDrugTypes.map(item => item[1]),
      colors: sortedDrugTypes.map((_, index) => chartColors[index % chartColors.length])
    };

    // Update dashboard stats
    setDashboardStats({
      mostFrequentProvince: {
        name: mostFrequentProvince.name, 
        count: mostFrequentProvince.count,
        change: provinceChangePercent
      },
      mostFrequentFirearmProvince: {
        name: mostFrequentFirearmProvince.name,
        count: mostFrequentFirearmProvince.count,
        change: firearmProvinceChangePercent
      },
      mostFrequentDrugProvince: {
        name: mostFrequentDrugProvince.name,
        count: mostFrequentDrugProvince.count,
        change: drugProvinceChangePercent
      },
      totalExhibits: {
        value: totalExhibits,
        change: totalExhibitsChangePercent
      },
      totalFirearms: {
        value: totalFirearms,
        change: totalFirearmsChangePercent
      },
      totalDrugs: {
        value: totalDrugs,
        change: totalDrugsChangePercent
      },
      firearmsByBrand,
      exhibitsByDate,
      drugsByType: drugsByTypeChart,
      mostCommonFirearm,
      mostCommonDrug,
      exhibitsByCategoryChart
    });
  };

  // Check screen size on component mount and when the window resizes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ฟังก์ชันสำหรับการเพิ่มเครื่องหมายจุลภาค (,) ขั้นหลักของตัวเลข
  const formatNumber = (num) => {
    return typeof num === 'string' && !isNaN(Number(num)) 
      ? parseInt(num).toLocaleString('th-TH')
      : typeof num === 'number' 
        ? num.toLocaleString('th-TH')
        : num;
  };

  // Create summary data from real data
  const summaryData = [
    { 
      title: "พื้นที่พบมากทีสุด", 
      value: dashboardStats?.mostFrequentProvince?.name || "ไม่มีข้อมูล", 
      imageUrl: "/Img/icon/gps.png", 
      change: dashboardStats?.mostFrequentProvince?.change || "+0.0%" 
    },
    { 
      title: "วัตถุพยานทั้งหมด", 
      value: dashboardStats?.totalExhibits?.value || 0, 
      imageUrl: "/Img/icon/all.png", 
      change: dashboardStats?.totalExhibits?.change || "+0.0%" 
    },
    { 
      title: "อาวุธปืนทั้งหมด", 
      value: dashboardStats?.totalFirearms?.value || 0, 
      imageUrl: "/Img/icon/gun.png", 
      change: dashboardStats?.totalFirearms?.change || "+0.0%" 
    },
    { 
      title: "ยาเสพติดทั้งหมด", 
      value: dashboardStats?.totalDrugs?.value || 0, 
      imageUrl: "/Img/icon/drug.png", 
      change: dashboardStats?.totalDrugs?.change || "+0.0%" 
    },
  ];

  // Create bar chart data from firearms by brand
  const barData = {
    labels: dashboardStats.firearmsByBrand.labels.length > 0 
      ? dashboardStats.firearmsByBrand.labels 
      : ["Glock", "Baretta", "CZ", "COLT", "Smith&Wesson"],
    datasets: [
      {
        label: "จำนวน",
        data: dashboardStats.firearmsByBrand.data.length > 0 
          ? dashboardStats.firearmsByBrand.data 
          : [300, 97, 15, 150, 70],
        backgroundColor: "#10B981",
      },
    ],
  };

  // Create line chart data from exhibits by date
  const lineData = {
    labels: dashboardStats.exhibitsByDate.labels.length > 0 
      ? dashboardStats.exhibitsByDate.labels 
      : ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"],
    datasets: [
      {
        label: "จำนวน",
        data: dashboardStats.exhibitsByDate.data.length > 0 
          ? dashboardStats.exhibitsByDate.data 
          : [2, 6, 11, 1, 9, 4, 13],
        borderColor: "#3B82F6",
        fill: false,
      },
    ],
  };

  // Create doughnut chart data from drugs by type
  const doughnutData = {
    labels: dashboardStats.drugsByType.labels.length > 0 
      ? dashboardStats.drugsByType.labels 
      : ["ประเภท A", "ประเภท B", "ประเภท C", "ประเภท D"],
    datasets: [
      {
        data: dashboardStats.drugsByType.data.length > 0 
          ? dashboardStats.drugsByType.data 
          : [5000, 7000, 6500, 4800],
        backgroundColor: dashboardStats.drugsByType.colors.length > 0
          ? dashboardStats.drugsByType.colors
          : ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
      },
    ],
  };

  // เพิ่ม options ที่เหมาะสมกับแต่ละประเภทกราฟ
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 5,
        bottom: 5,
        left: 5,
        right: 5
      }
    },
    plugins: {
      legend: {
        display: true,
        position: isMobile ? 'bottom' : 'top',
        labels: {
          boxWidth: isMobile ? 10 : 15,
          padding: isMobile ? 5 : 10,
          font: {
            size: isMobile ? 9 : 11
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        bodyFont: {
          size: 11
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString('th-TH');
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: isMobile ? 8 : 10
          },
          callback: function(value) {
            return value.toLocaleString('th-TH');
          }
        },
        grid: {
          display: true,
          drawBorder: false
        }
      },
      x: {
        ticks: {
          font: {
            size: isMobile ? 8 : 10
          }
        },
        grid: {
          display: false
        }
      }
    }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 5,
        bottom: 5,
        left: 5,
        right: 5
      }
    },
    plugins: {
      legend: {
        display: true,
        position: isMobile ? 'bottom' : 'top',
        labels: {
          boxWidth: isMobile ? 10 : 15,
          padding: isMobile ? 5 : 10,
          font: {
            size: isMobile ? 9 : 11
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString('th-TH');
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: isMobile ? 8 : 10
          },
          precision: 0,
          callback: function(value) {
            return value.toLocaleString('th-TH');
          }
        },
        grid: {
          display: true,
          drawBorder: false
        }
      },
      x: {
        ticks: {
          font: {
            size: isMobile ? 8 : 10
          }
        },
        grid: {
          display: false
        }
      }
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 4
      },
      line: {
        tension: 0.2
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: isMobile ? '65%' : '60%',
    layout: {
      padding: 10
    },
    plugins: {
      legend: {
        display: true,
        position: isMobile ? 'bottom' : 'right',
        align: 'center',
        labels: {
          boxWidth: isMobile ? 10 : 12,
          padding: isMobile ? 3 : 5,
          font: {
            size: isMobile ? 8 : 10
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        bodyFont: {
          size: 11
        },
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            let value = context.raw || 0;
            return `${label}: ${value.toLocaleString('th-TH')}`;
          }
        }
      }
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="h-full w-full bg-[#F8F9FA] flex flex-col overflow-hidden">
        <div className="px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h1 className="text-xl font-bold">แดชบอร์ด</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6">
          {/* Tabs */}
          <div className="flex space-x-4 md:space-x-6 mb-4 border-b overflow-x-auto no-scrollbar">
            {["overview", "gun", "drugs"].map((tab) => (
              <div
                key={tab}
                className={`cursor-pointer pb-2 text-center transition-all whitespace-nowrap px-2 ${
                  activeTab === tab ? "border-b-2 border-red-800 font-semibold" : "text-gray-600"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "overview" ? "ภาพรวม" : tab === "gun" ? "อาวุธปืน" : "ยาเสพติด"}
              </div>
            ))}
          </div>

          {/* Summary Stats - แสดงเฉพาะใน tab overview */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 lg:grid-cols-4">
              {summaryData.map((item, index) => (
                <div key={index} className="p-3 bg-white shadow rounded flex items-center hover:shadow-md transition-shadow duration-200">
                  <div className="mr-2 md:mr-3">
                    <img src={item.imageUrl} alt={item.title} className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-xs text-gray-600 truncate">{item.title}</p>
                    <p className="text-sm md:text-base font-bold">{formatNumber(item.value)}</p>
                    <p className={`text-xs ${item.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                      {item.change}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-3 pb-16 md:pb-6">
            {activeTab === "overview" && (
              <>
                <div className="p-3 bg-white shadow rounded lg:col-span-2 h-44 sm:h-48 md:h-56 lg:h-[240px] hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  <div className="h-full w-full flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1 flex-shrink-0">Top 10 วัตถุพยานทุกประเภท</h3>
                    <div className="flex-grow relative w-full">
                      {/* เปลี่ยนจากการใช้ข้อมูล barData เป็น top10ExhibitsData */}
                      <Bar 
                        data={{
                          labels: dashboardStats.exhibitsByCategoryChart?.labels || ["ไม่มีข้อมูล"],
                          datasets: [
                            {
                              label: "จำนวน",
                              data: dashboardStats.exhibitsByCategoryChart?.data || [0],
                              backgroundColor: "#10B981",
                            },
                          ],
                        }} 
                        options={barOptions} 
                      />
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-gray-300 shadow rounded lg:row-span-2 flex justify-center items-center min-h-[120px] sm:min-h-[150px] md:min-h-[200px] lg:min-h-[480px] hover:shadow-md transition-shadow duration-200">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700 mb-2">พื้นที่พบวัตถุพยาน</p>
                    <p className="text-sm text-gray-600">(พื้นที่สำหรับแผนที่)</p>
                  </div>
                </div>
                <div className="p-3 bg-white shadow rounded h-44 sm:h-48 md:h-56 lg:h-[240px] hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  <div className="h-full w-full flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1 flex-shrink-0">จำนวนวัตถุพยานรายวัน</h3>
                    <div className="flex-grow relative w-full">
                      <Line data={lineData} options={lineOptions} />
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-white shadow rounded h-44 sm:h-48 md:h-56 lg:h-[240px] hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  <div className="h-full w-full flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1 flex-shrink-0">สัดส่วนประเภทยาเสพติด</h3>
                    <div className="flex-grow relative w-full">
                      <Doughnut data={doughnutData} options={doughnutOptions} />
                    </div>
                  </div>
                </div>
              </>
            )}
            {activeTab === "gun" && (
              <>
                {/* สร้าง Summary Cards สำหรับหน้าอาวุธปืน - 3 cards ขนาดเท่ากับตอนมี 4 อัน และชิดซ้าย */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
                  {/* พื้นที่ที่พบปืนมากที่สุด */}
                  <div className="p-3 bg-white shadow rounded flex items-center hover:shadow-md transition-shadow duration-200">
                    <div className="mr-2 md:mr-3">
                      <img src="/Img/icon/gps.png" alt="พื้นที่พบมากที่สุด" className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-xs text-gray-600 truncate">พื้นที่พบปืนมากที่สุด</p>
                      <p className="text-sm md:text-base font-bold">{dashboardStats?.mostFrequentFirearmProvince?.name || "ไม่มีข้อมูล"}</p>
                      <p className={`text-xs ${dashboardStats?.mostFrequentProvince?.change?.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                        {dashboardStats?.mostFrequentProvince?.change || "+0.0%"}
                      </p>
                    </div>
                  </div>
                  
                  {/* ปืนที่พบทั้งหมด */}
                  <div className="p-3 bg-white shadow rounded flex items-center hover:shadow-md transition-shadow duration-200">
                    <div className="mr-2 md:mr-3">
                      <img src="/Img/icon/gun.png" alt="ปืนทั้งหมด" className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-xs text-gray-600 truncate">ปืนที่พบทั้งหมด</p>
                      <p className="text-sm md:text-base font-bold">{formatNumber(dashboardStats?.totalFirearms?.value || 0)}</p>
                      <p className={`text-xs ${dashboardStats?.totalFirearms?.change?.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                        {dashboardStats?.totalFirearms?.change || "+0.0%"}
                      </p>
                    </div>
                  </div>
                  
                  {/* ปืนที่พบมากที่สุด */}
                  <div className="p-3 bg-white shadow rounded flex items-center hover:shadow-md transition-shadow duration-200">
                    <div className="mr-2 md:mr-3">
                      <img src="/Img/icon/gun.png" alt="ปืนที่พบมากที่สุด" className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-xs text-gray-600 truncate">ปืนที่พบมากที่สุด</p>
                      <p className="text-sm md:text-base font-bold">{dashboardStats?.mostCommonFirearm?.brand || "ไม่มีข้อมูล"}</p>
                      <p className="text-xs text-green-600">
                        {formatNumber(dashboardStats?.mostCommonFirearm?.count || 0)} หน่วย
                      </p>
                    </div>
                  </div>
                  
                  {/* ช่องว่างสำหรับตำแหน่งที่ 4 (ไม่แสดงเนื้อหา) */}
                  <div className="hidden lg:block"></div>
                </div>
                
                {/* Chart สำหรับข้อมูลอาวุธปืน */}
                <div className="p-3 bg-white shadow rounded lg:col-span-2 h-44 sm:h-48 md:h-56 lg:h-[240px] hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  <div className="h-full w-full flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1 flex-shrink-0">ประเภทอาวุธปืน</h3>
                    <div className="flex-grow relative w-full">
                      <Bar data={barData} options={barOptions} />
                    </div>
                  </div>
                </div>
                
                {/* พื้นที่พบอาวุธปืน */}
                <div className="p-3 bg-gray-300 shadow rounded lg:row-span-2 flex justify-center items-center min-h-[120px] sm:min-h-[150px] md:min-h-[200px] lg:min-h-[480px] hover:shadow-md transition-shadow duration-200">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700 mb-2">พื้นที่พบอาวุธปืน</p>
                    <p className="text-sm text-gray-600">(พื้นที่สำหรับแผนที่)</p>
                  </div>
                </div>
                
                {/* แนวโน้มการพบอาวุธปืน */}
                <div className="p-3 bg-white shadow rounded h-44 sm:h-48 md:h-56 lg:h-[240px] hover:shadow-md transition-shadow duration-200 overflow-hidden lg:col-span-2">
                  <div className="h-full w-full flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1 flex-shrink-0">แนวโน้มการพบอาวุธปืนรายวัน</h3>
                    <div className="flex-grow relative w-full">
                      <Line data={lineData} options={lineOptions} />
                    </div>
                  </div>
                </div>
              </>
            )}
            {activeTab === "drugs" && (
              <>
                {/* สร้าง Summary Cards สำหรับหน้ายาเสพติด - 3 cards ขนาดเท่ากับตอนมี 4 อัน และชิดซ้าย */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
                  {/* พื้นที่ที่พบยาเสพติดมากที่สุด */}
                  <div className="p-3 bg-white shadow rounded flex items-center hover:shadow-md transition-shadow duration-200">
                    <div className="mr-2 md:mr-3">
                      <img src="/Img/icon/gps.png" alt="พื้นที่พบมากที่สุด" className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-xs text-gray-600 truncate">พื้นที่พบยาเสพติดมากที่สุด</p>
                      <p className="text-sm md:text-base font-bold">{dashboardStats?.mostFrequentDrugProvince?.name || "ไม่มีข้อมูล"}</p>
                      <p className={`text-xs ${dashboardStats?.mostFrequentDrugProvince?.change?.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                        {dashboardStats?.mostFrequentDrugProvince?.change || "+0.0%"}
                      </p>
                    </div>
                  </div>
                  
                  {/* ยาเสพติดที่พบทั้งหมด */}
                  <div className="p-3 bg-white shadow rounded flex items-center hover:shadow-md transition-shadow duration-200">
                    <div className="mr-2 md:mr-3">
                      <img src="/Img/icon/drug.png" alt="ยาเสพติดทั้งหมด" className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-xs text-gray-600 truncate">ยาเสพติดที่พบทั้งหมด</p>
                      <p className="text-sm md:text-base font-bold">{formatNumber(dashboardStats?.totalDrugs?.value || 0)}</p>
                      <p className={`text-xs ${dashboardStats?.totalDrugs?.change?.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                        {dashboardStats?.totalDrugs?.change || "+0.0%"}
                      </p>
                    </div>
                  </div>
                  
                  {/* ยาเสพติดที่พบมากที่สุด */}
                  <div className="p-3 bg-white shadow rounded flex items-center hover:shadow-md transition-shadow duration-200">
                    <div className="mr-2 md:mr-3">
                      <img src="/Img/icon/drug.png" alt="ยาเสพติดที่พบมากที่สุด" className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-xs text-gray-600 truncate">ยาเสพติดที่พบมากที่สุด</p>
                      <p className="text-sm md:text-base font-bold">{dashboardStats?.mostCommonDrug?.type || "ไม่มีข้อมูล"}</p>
                      <p className="text-xs text-green-600">
                        {formatNumber(dashboardStats?.mostCommonDrug?.count || 0)} หน่วย
                      </p>
                    </div>
                  </div>
                  
                  {/* ช่องว่างสำหรับตำแหน่งที่ 4 (ไม่แสดงเนื้อหา) */}
                  <div className="hidden lg:block"></div>
                </div>
                
                {/* Chart สำหรับข้อมูลยาเสพติด */}
                <div className="p-3 bg-white shadow rounded lg:col-span-2 h-44 sm:h-48 md:h-56 lg:h-[240px] hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  <div className="h-full w-full flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1 flex-shrink-0">ประเภทยาเสพติด</h3>
                    <div className="flex-grow relative w-full">
                      <Doughnut data={doughnutData} options={{...doughnutOptions, plugins: {...doughnutOptions.plugins, legend: {...doughnutOptions.plugins.legend, position: 'right'}}}} />
                    </div>
                  </div>
                </div>
                
                {/* พื้นที่พบยาเสพติด */}
                <div className="p-3 bg-gray-300 shadow rounded lg:row-span-2 flex justify-center items-center min-h-[120px] sm:min-h-[150px] md:min-h-[200px] lg:min-h-[480px] hover:shadow-md transition-shadow duration-200">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700 mb-2">พื้นที่พบยาเสพติด</p>
                    <p className="text-sm text-gray-600">(พื้นที่สำหรับแผนที่)</p>
                  </div>
                </div>
                
                {/* แนวโน้มการพบยาเสพติด */}
                <div className="p-3 bg-white shadow rounded h-44 sm:h-48 md:h-56 lg:h-[240px] hover:shadow-md transition-shadow duration-200 overflow-hidden lg:col-span-2">
                  <div className="h-full w-full flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1 flex-shrink-0">แนวโน้มการพบยาเสพติดรายวัน</h3>
                    <div className="flex-grow relative w-full">
                      <Line data={lineData} options={lineOptions} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;