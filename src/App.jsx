import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Preferences from './pages/Preferences'
import Browse from './pages/Browse'
import MealPlan from './pages/MealPlan'
import GroceryList from './pages/GroceryList'
import RecipeDetail from './pages/RecipeDetail'
import Login from './pages/Login'

function App() {
  return (
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
        </Routes>
      </Layout>
    </AuthProvider>
  )
}

export default App
