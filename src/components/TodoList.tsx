import useAuthQuery from "../hooks/useAuthQuery";
import Button from "./ui/Button";
const TodoList = () => {
  const storageKey = "loggedInUser";
  const userDataString = localStorage.getItem(storageKey);
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const {isLoading, data, error} = useAuthQuery({
    queryKey: ["todos"],
    url: "/users/me?populate=todos",
    config: {
      headers: {
        Authorization: `Bearer ${userData?.jwt}`,
      },
    },
  });

  if(isLoading) return <p>Loading...</p>
  if(error) return <p>Error: {error.message}</p>

  return (
    <div className="space-y-1 ">

       { data.todos.length? (
        data.todos.map((todo:any) => (
          <div key={todo.id} className="flex items-center justify-between hover:bg-gray-100 duration-300 p-3 rounded-md even:bg-gray-100">
            <p className="w-full font-semibold">{1 + ". " + todo.title}</p>
            <div className="flex items-center justify-end w-full space-x-3">
              <Button size={"sm"}>Edit</Button>
              <Button variant={"danger"} size={"sm"}>
                Remove
              </Button>
            </div>
          </div>
        ))
       ) : (
         <p>No todos found</p>
       )}
    </div>
  );
};

export default TodoList;
