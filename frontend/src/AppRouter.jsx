import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import Admin from './pages/Admin';

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
