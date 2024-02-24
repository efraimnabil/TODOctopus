import { useState } from "react";
import useAuthQuery from "../hooks/useAuthQuery";
import { ITodo } from "../interfaces";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Modal from "./ui/Modal";
const TodoList = () => {
  const storageKey = "loggedInUser";
  const userDataString = localStorage.getItem(storageKey);
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const {isLoading, data} = useAuthQuery({
    queryKey: ["todos"],
    url: "/users/me?populate=todos",
    config: {
      headers: {
        Authorization: `Bearer ${userData?.jwt}`,
      },
    },
  });

  // ** Handlers
  const onToffleEditModal = () => {
    setIsEditModalOpen(prev => !prev);
  };

  if(isLoading) return <p>Loading...</p>

  const renderTodos = data.todos.map((todo: ITodo) => (
    <div key={todo.id} className="flex items-center justify-between hover:bg-gray-100 duration-300 p-3 rounded-md even:bg-gray-100">
      <p className="w-full font-semibold">{1 + ". " + todo.title}</p>
      <div className="flex items-center justify-end w-full space-x-3">
        <Button size={"sm"} onClick={onToffleEditModal}>
          Edit
        </Button>
        <Button variant={"danger"} size={"sm"}>
          Remove
        </Button>
      </div>
    </div>
  ));

  return (
    <div className="space-y-1 ">

       { data.todos.length? (
          renderTodos
       ) : (
         <p>No todos found</p>
       )}

       {/**Edit todo Modal */}
       <Modal isOpen={isEditModalOpen} closeModal={onToffleEditModal} title="Edit Todo">
          <Input name="title" placeholder="Title" type="text" />
          <Input name="description" placeholder="Description" type="text" />
          <div className="flex justify-center space-x-3 mt-4">
            <Button className="bg-indigo-700 hover:bg-indigo-800">
              Update
            </Button>
            <Button variant="cancel">
              Cancel
            </Button>
          </div>

       </Modal>
    </div>
  );
};

export default TodoList;
