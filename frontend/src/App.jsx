import React from 'react';
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout';
import Layout2 from './components/Layout2';
import Layout3 from './components/Layout3';
import Home from "./pages/Home";
import CameraPage from './components/Camera/Camera';
import ImagePreview from './components/Camera/ImagePreview';
import Login from './pages/Login';
import EvidenceProfile from './pages/EvidenceProfile';
import SaveToHistory from './pages/SaveToHistory';
import Map from './pages/Map';
import History from './pages/History';
import SelectCatalogType from './pages/SelectCatalogType';
import GunCatalog from './components/EvidenceCatalog/GunCatalog';
import GunProfile from './components/EvidenceCatalog/GunProfile';
import DrugCatalog from './components/EvidenceCatalog/DrugCatalog';
import DrugProfile from './components/EvidenceCatalog/DrugProfile';
import EvidenceHistoryProfile from './pages/EvidenceHistoryProfile';
import CreateUser from './pages/admin/super admin/CreateUser';
import UserManagementTable from './pages/admin/super admin/UserManagementTable';
import UserProfile from './pages/admin/super admin/UserProfile';
import EditUserProfile from './pages/admin/super admin/EditUserProfile';
import EditGunHistoryProfile from './components/History/EditGunHistoryProfile';
import CandidateShow from './components/Camera/CandidateShow';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <Routes>
      {/* None Layout */}
      <Route path='/login' element={<Login />} />
      <Route path='/camera' element={
        <ProtectedRoute>
          <CameraPage />
        </ProtectedRoute>
      } />
      <Route path='/imagePreview' element={
        <ProtectedRoute>
          <ImagePreview />
        </ProtectedRoute>
      }/>
      <Route path="/candidateShow" element={
        <ProtectedRoute>
          <CandidateShow />
        </ProtectedRoute>
      } />

      {/* Layout */}
      <Route element={
        <ProtectedRoute allowedRoles={[1, 3]}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path='/home' element={<Home />} />
      </Route>

      {/* Layout 2 */}
      <Route element={
        <ProtectedRoute>
          <Layout2 />
        </ProtectedRoute>
      }>
        {/* Super Admin Pages */}
        <Route path='/createUser' element={<CreateUser />} />
        <Route path='/userManagementTable' element={<UserManagementTable />} />
        <Route path='/user-profile/:id' element={<UserProfile />} />
        <Route path='/edit-user/:id' element={<EditUserProfile />} />

        {/* Select Catalog Type */}
        <Route path='/selectCatalogType/' element={<SelectCatalogType />} />
        <Route path='/selectCatalogType/guns-catalog'element={<GunCatalog />} />
        <Route path='/selectCatalogType/guns-catalog/gun-profile/:id' element={<GunProfile />} />
        <Route path='/selectCatalogType/drugs-catalog' element={<DrugCatalog />} />
        <Route path='/selectCatalogType/drugs-catalog/drug-profile/:id' element={<DrugProfile />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* History */}
        <Route path='/history' element={<History />} />
      </Route>

      {/* Layout 2 */}
      <Route element={
        <ProtectedRoute allowedRoles={[1]}>
          <Layout2 />
        </ProtectedRoute>
      }>
        {/* Super Admin Pages */}
        <Route path='/createUser' element={<CreateUser />} />
        <Route path='/userManagementTable' element={<UserManagementTable />} />
        <Route path='/user-profile/:id' element={<UserProfile />} />
        <Route path='/edit-user/:id' element={<EditUserProfile />} />
      </Route>

      <Route element={
        <ProtectedRoute>
          <Layout3 />
        </ProtectedRoute>
      }>
        {/* Evidence Profile */}
        <Route path='/evidenceProfile' element={<EvidenceProfile />} />
        <Route path='/evidenceProfile/gallery' element={<EvidenceProfile />} />
        <Route path='/evidenceProfile/save-to-record' element={<SaveToHistory />} />
        <Route path='/evidenceProfile/history' element={<EvidenceProfile />} />

        {/* History */}
        <Route path='/history/detail' element={<EvidenceHistoryProfile />} />
        <Route path='/history/edit/:id' element={<EditGunHistoryProfile />} />

        <Route path='/map' element={<Map />} />
      </Route>
    </Routes>
  );
};

export default App;