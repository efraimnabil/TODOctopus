import octopus from "../assets/octopus.svg";
import hand from "../assets/hand.svg";
import { Link } from "react-router-dom";
import axiosInstance from "../config/axios.config";
import { useEffect, useState } from "react";
const HomePage = () => {
  const storageKey = "loggedInUser";
  const userDataString = localStorage.getItem(storageKey);
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const [killedOctopuses, setKilledOctopuses] = useState<string | number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const getKilledOctopuses = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get(
        `/tasks/getKilledOctopuses/${userData?.user?._id}`
      );
      setKilledOctopuses(res?.data?.data?.KilledOctopuses);
    } catch (error) {
      setKilledOctopuses("?");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.token) {
      getKilledOctopuses();
    }
  }, [userData?.token]);

  const beforeElementStyles: React.CSSProperties = {
    content: '""',
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    borderRadius: "50px",
    border: "2px solid transparent",
    background:
      "linear-gradient(315deg, rgba(255, 0, 194, 0.80) 0%, rgba(255, 77, 0, 0.80) 100%) border-box",
    WebkitMask:
      "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "destination-out",
    maskComposite: "exclude",
  };

  return (
    <section className="min-h-[calc(100vh-120px)]">
      <div className="flex flex-col items-center justify-between md:flex-row-reverse min-h-[calc(100%-10px)] gap-4">
        <img
          src={octopus}
          alt="octopus"
          className="w-48 h-48 md:w-52 md:h-52 lg:w-96 lg:h-96"
        />
        <div className="flex flex-col gap-2 md:gap-6">
          <h1 className="text-2xl text-white font-SourceSerifPro md:text-3xl lg:text-5xl">
            Welcome
            {userData?.token && userData?.user?.username && (
              <span> back {userData?.user?.username}</span>
            )}
            <span> to </span>
            <span className="font-Sunshiney text-transparent bg-clip-text bg-gradient-to-br from-pink-trans to-orange-trans text-3xl md:text-4xl font-normal tracking-widest"> TODOctopus </span>
          </h1>
          {!userData?.token && (
            <>
              <p className="text-white font-SourceSerifPro md:text-xl lg:text-2xl">
                Manage your tasks in a
                <span className="font-Sunshiney text-xl font-normal tracking-widest md:text-xl lg:text-2xl"> FUNNY WAY </span>
                with our game..
              </p>
              <p className="text-white font-SourceSerifPro md:text-xl lg:text-2xl">
                The rule is simple, just finish your task to kill the octopus
              </p>
            </>
          )}

          {userData?.token && (
            <>
              <p className="text-white font-SourceSerifPro md:text-xl lg:text-2xl">
                You Killed{" "}
                {isLoading ? (
                  <span className="animate-pulse"> ... </span>
                ) : (
                  killedOctopuses
                )}{" "}
                Octopuses so far
              </p>
              <p className="text-white font-SourceSerifPro md:text-xl lg:text-2xl">
                Let's start to kill more octopuses by finishing your tasks
              </p>
            </>
          )}

          <div className="flex flex-col xl:flex-row gap-4 mt-2 lg:mt-5">
            <Link
              to={userData?.token ? "/TODOctopus" : "/login"}
              className="text-white font-SourceSerifPro py-2 px-4 w-60 text-center text-xl md:w-80 md:text-2xl transition-all duration-200 bg-gradient-to-br from-pink-trans to-orange-trans rounded-[50px] transform active:scale-95 hover:scale-105"
            >
              <span className="relative z-10">Let's start</span>
            </Link>
            <Link
              to="/aboutus"
              className="text-white font-SourceSerifPro px-4 py-2 w-40 text-center text-xl md:w-60 md:text-2xl transition-all duration-200 transform active:scale-95 hover:scale-105 relative"
            >
              <span style={beforeElementStyles}></span>
              About Us
            </Link>
          </div>
        </div>
      </div>

      <img
        src={hand}
        alt="hand"
        className="absolute bottom-0 right-0 rotate-180 w-20 h-20 md:w-28 md:h-28"
      />
      <img
        src={hand}
        alt="hand"
        className="absolute bottom-0 left-0 scale-x-[-1] rotate-180 flip w-20 h-20 md:w-28 md:h-28"
      />
    </section>
  );
};

export default HomePage;
