import toast from "react-hot-toast";
import { NavLink, useLocation } from "react-router-dom";
import Button from "./ui/Button";

const Navbar = () => {
  const { pathname } = useLocation();
  const storageKey = "loggedInUser";
  const userDataString = localStorage.getItem(storageKey);
  const userData = userDataString ? JSON.parse(userDataString) : null;

  const handleLogout = () => {
    localStorage.removeItem(storageKey);
    toast ('You are logged out', {
      position: 'top-center',
      style: {
        backgroundColor: 'black',
        color: '#fff',
        width: 'fit-content',
      }
    });
    setTimeout(() => {
      location.replace(pathname);
    }
    , 1500);
  }

  return (
    <nav className="max-w-2xl mx-auto mt-7 mb-20 px-3 py-5">
      <ul className="flex items-center justify-between">
        <li className="duration-200 font-semibold text-lg">
          <NavLink to="/">Home</NavLink>
        </li>
        
        {
          userData ? (
            <div className="flex items-center space-x-2 text-indigo-600">
              <li className="duration-200 font-semibold text-lg">
                <NavLink to="/profile">Profile</NavLink>
              </li>
              <Button className="cursor-pointer" size={"sm"} onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <p className="flex items-center space-x-3">
              <li className="text-indigo-600 duration-200 font-semibold text-lg">
                <NavLink to="/register">Register</NavLink>
              </li>
              <li className="text-indigo-600 duration-200 font-semibold text-lg">
                <NavLink to="/login">Login</NavLink>
              </li>
            </p>
          )
        }
      </ul>
    </nav>
  );
};

export default Navbar;
