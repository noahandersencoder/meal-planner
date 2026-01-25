import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Preferences from './pages/Preferences'
import Browse from './pages/Browse'
import MealPlan from './pages/MealPlan'
import GroceryList from './pages/GroceryList'
import RecipeDetail from './pages/RecipeDetail'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Settings from './pages/Settings'
import RecipeSubmit from './pages/RecipeSubmit'
import GenerateRecipe from './pages/GenerateRecipe'
import CookingHistory from './pages/CookingHistory'
import UserProfile from './pages/UserProfile'
import Community from './pages/Community'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/recipe/:id" element={<RecipeDetail />} />
            <Route path="/meal-plan" element={<MealPlan />} />
            <Route path="/grocery-list" element={<GroceryList />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/submit-recipe" element={<RecipeSubmit />} />
            <Route path="/generate" element={<GenerateRecipe />} />
            <Route path="/my-cooking" element={<CookingHistory />} />
            <Route path="/user/:oderId" element={<UserProfile />} />
            <Route path="/community" element={<Community />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
