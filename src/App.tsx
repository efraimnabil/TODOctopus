import { RouterProvider } from "react-router-dom";
import router from "./router";
import { Toaster } from "react-hot-toast";
import Bg from "./assets/bg.png";
const App = () => {
  return (
    <main 
      className="bg-black-90 bg-cover bg-center bg-repeat"
      style={{
        backgroundImage: `url(${Bg})`,
      }}
    >
      <RouterProvider router={router} />
      <Toaster />
    </main>
  );
};

export default App;