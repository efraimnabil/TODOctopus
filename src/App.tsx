import { RouterProvider } from "react-router-dom";
import router from "./router";
import { Toaster } from "react-hot-toast";
import Bg from "./assets/bg.png";
const App = () => {
  return (
    <main 
      className="bg-black-90 min-h-screen"
      style={{
        backgroundImage: `url(${Bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <RouterProvider router={router} />
      <Toaster />
    </main>
  );
};

export default App;
