import { useAuth } from '../context/AuthContext';
import AdminHome from '../components/Home/AdminHome';
import UserHome from '../components/Home/๊UserHome';

const Home = () => {
  const { user } = useAuth();

  if (user?.role.id === 1) {
    return <AdminHome />;
  }
  if (user?.role.id === 3) {
    return <UserHome />;
  }
  return <div>ไม่มีสิทธิ์เข้าถึง</div>;
};

export default Home;