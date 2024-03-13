import octopus from "../assets/octopus.svg";
import hand from "../assets/hand.svg"
import { Link } from "react-router-dom";
import axiosInstance from "../config/axios.config";
const HomePage = () => {
  const storageKey = "loggedInUser";
  const userDataString = localStorage.getItem(storageKey);
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const getKilledOctopuses = async () => {
    try {
      const res = await axiosInstance.get("/tasks/getKilledOctopuses");
      console.log(res);
    } catch (error) {
      console.log(error);
    }

  }

  getKilledOctopuses();
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
    <section 
      className="min-h-[calc(100vh-120px)]"
    >
            <div className="flex flex-col items-center justify-between md:flex-row-reverse min-h-[calc(100%-10px)]">
              <img 
                src={octopus} 
                alt="octopus" 
                className="w-40 h-40 md:w-80 md:h-80"
              />
              <div className="relative flex flex-col gap-2 md:gap-8 items-center justify-center text-center md:text-left">
              <h1 
                className="text-3xl text-white font-SourceSerifPro md:text-4xl"
              >
                Welcome 
                {
                  userData?.token && userData?.user?.username &&
                  <span className="mx-2">
                    back {userData?.user?.username}
                  </span>
                }
                to 
                <span 
                  className="mx-2 text-pink-500 font-Sunshiney text-transparent bg-clip-text bg-gradient-to-br from-pink-trans to-orange-trans text-2xl font-normal tracking-widest"
                >
                  TODOctopus
                </span>
              </h1>
              {
                !userData?.token &&
                  <>
                    <p 
                       className="text-white font-SourceSerifPro md:text-xl"
                     >
                       Manage your tasks in a 
                       <span 
                         className="mx-2 font-Sunshiney text-xl font-normal tracking-widest md:text-2xl"
                       >
                         funny way
                       </span>
                       with our game..
                     </p>
                     <p 
                     className="text-white font-SourceSerifPro md:text-xl"
                      >
                        The rule is simple, just finish your task to kill the octopus
                      </p>
                  </>
              }

              {
                userData?.token &&
                  <>
                    <p 
                      className="text-white font-SourceSerifPro md:text-xl"
                    >
                      You Killed {userData?.user?.KilledOctopuses} Octopuses so far
                    </p>
                    <p 
                      className="text-white font-SourceSerifPro md:text-xl"
                    >
                      Let's start to kill more octopuses by finishing your tasks
                    </p>
                  </>
              }
             

              <Link
                to={userData?.token ? "/TODOctopus" : "/login"}
                className="relative mt-5 text-white font-SourceSerifPro py-2 px-4 w-52 text-center md:w-60 md:text-xl"
              >
                Let's start
                <span 
                  style={beforeElementStyles}></span>
              </Link>
              </div>

            </div>
            
      <img src={hand} alt="hand" className="absolute bottom-0 right-0 rotate-180 w-24 h-24" />
      <img src={hand} alt="hand" className="absolute bottom-0 left-0 scale-x-[-1] rotate-180 flip w-24 h-24" />
    </section>
  );
};

export default HomePage;
