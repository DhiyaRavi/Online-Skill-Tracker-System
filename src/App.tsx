import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/pages/home";
import Platform from "./components/pages/dashBoard/platform";
import Login from "./components/pages/login/login";
import SignUp from "./components/pages/signUp/signup";
import Dashboard from "./components/pages/dashBoard/dashboard";
import PrivateRoute from "./components/pages/dashBoard/privateRoute"; 
import SkillsPage from "./components/pages/skills/skillsPage";
import Youtube from "./components/pages/dashBoard/youTube";
import LeetCode from "./components/pages/dashBoard/leetcode";
import HackerRank from "./components/pages/dashBoard/hackerRank";
import Coursera from "./components/pages/dashBoard/coursera";
import ProfilePage from "./components/pages/profile/ProfilePage";
import { App as AntdApp } from "antd"; 
function App() {
  return (
     <AntdApp>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/platforms" 
          element={
            <PrivateRoute>
              <Platform />
            </PrivateRoute>
          } 
        />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/youtube" element={<Youtube />} />
        <Route path="/leetcode" element={<LeetCode />} />
        <Route path="/hackerrank" element={<HackerRank />} />
        <Route path="/coursera" element={<Coursera />} />
        <Route path="/profile" element={<ProfilePage />} />


      </Routes>
    </Router>
    </AntdApp>
  );
}

export default App;
