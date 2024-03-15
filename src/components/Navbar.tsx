import toast from "react-hot-toast";
import { NavLink, useLocation } from "react-router-dom";
import Button from "./ui/Button";
import axiosInstance from "../config/axios.config";
import { useState } from "react";

const Navbar = () => {
  const { pathname } = useLocation();
  const storageKey = "loggedInUser";
  const userDataString = localStorage.getItem(storageKey);
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const [isloading, setIsLoading] = useState(false);
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const {status} = await axiosInstance.get('/users/logout');
      if(status === 200){
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
    } catch (error) {
      toast.error('Something went wrong', {
        position: 'top-center',
        style: {
          backgroundColor: 'black',
          color: '#fff',
          width: 'fit-content',
        }
      });
    }
    finally {
      setIsLoading(false);
    }

  }

  const beforeElementStyles: React.CSSProperties = {
    content: '""',
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    borderRadius: '50px',
    border: '2px solid transparent',
    background: 'linear-gradient(315deg, rgba(255, 0, 194, 0.80) 0%, rgba(255, 77, 0, 0.80) 100%) border-box',
    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'destination-out',
    maskComposite: 'exclude',
  };

  return (
    <nav className="mb-2 md:mb-10 px-3 py-5 flex justify-between items-center md:px-10 lg:px-20 font-SourceSerifPro">
          <NavLink 
            to="/" 
            className="font-Sunshiney text-transparent bg-clip-text bg-gradient-to-br from-pink-trans to-orange-trans text-xl font-normal tracking-widest md:text-2xl lg:text-3xl"
          >
            TODOctopus
          </NavLink>
        
        {
          userData ? (
            <div className="flex items-center space-x-2">
              <Button 
                className="relative font-SourceSerifPro text-sm px-3 text-center text-white"
                onClick={handleLogout}
                isLoading={isloading}
              >
                Logout
                <span style={beforeElementStyles}></span>
              </Button>
            </div>
          ) : (
            <p className="flex items-center space-x-3">
                <NavLink 
                  to="/signup"
                  className="relative rounded-3xl w-24 text-center text-lg py-1 text-white md:text-md md:w-28"
                >
                  Signup
                  <span style={beforeElementStyles}></span>
                </NavLink>

                <NavLink 
                  to="/login"
                  className="bg-gradient-to-br from-pink-trans to-orange-trans text-white rounded-3xl w-24 text-center text-lg py-1 md:text-md md:w-28"
                >
                  Login
                </NavLink>
            </p>
          )
        }
    </nav>
  );
};

export default Navbar;
