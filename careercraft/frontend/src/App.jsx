import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import CareerExplorer from "./pages/CareerExplorer.jsx";
import CareerDetail from "./pages/CareerDetail.jsx";
import Assessment from "./pages/Assessment.jsx";
import CareerCompare from "./pages/CareerCompare.jsx";
import CareerRoadmap from "./pages/CareerRoadmap.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Mentor from "./pages/Mentor.jsx";
import SkillGapAnalyzer from "./pages/SkillGapAnalyzer.jsx";
import OpportunityHub from "./pages/OpportunityHub.jsx";
import ApplicationTracker from "./pages/ApplicationTracker.jsx";
import CollegeExplorer from "./pages/CollegeExplorer.jsx";
import CollegeDetail from "./pages/CollegeDetail.jsx";
import EntranceExams from "./pages/EntranceExams.jsx";
import ExamDetail from "./pages/ExamDetail.jsx";
import ResourceLibrary from "./pages/ResourceLibrary.jsx";
import Community from "./pages/Community.jsx";
import CommunityDetail from "./pages/CommunityDetail.jsx";
import PostDetail from "./pages/PostDetail.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/explore" element={<CareerExplorer />} />
      <Route path="/careers/:slug" element={<CareerDetail />} />
      <Route path="/careers/:slug/roadmap" element={<CareerRoadmap />} />
      <Route path="/assessment" element={<Assessment />} />
      <Route path="/compare" element={<CareerCompare />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/mentor" element={<Mentor />} />
      <Route path="/transition" element={<SkillGapAnalyzer />} />
      <Route path="/opportunities" element={<OpportunityHub />} />
      <Route path="/applications" element={<ApplicationTracker />} />
      <Route path="/colleges" element={<CollegeExplorer />} />
      <Route path="/colleges/:slug" element={<CollegeDetail />} />
      <Route path="/exams" element={<EntranceExams />} />
      <Route path="/exams/:slug" element={<ExamDetail />} />
      <Route path="/resources" element={<ResourceLibrary />} />
      <Route path="/community" element={<Community />} />
      <Route path="/community/:slug" element={<CommunityDetail />} />
      <Route path="/community/:slug/posts/:id" element={<PostDetail />} />
    </Routes>
  );
}
