import { useState } from "react";
import useAuthQuery from "../hooks/useCustomQuery";
import { ITodo } from "../interfaces";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Modal from "./ui/Modal";
import Textarea from "./ui/Textarea";
import axiosInstance from "../config/axios.config";
const TodoList = () => {
  const storageKey = "loggedInUser";
  const userDataString = localStorage.getItem(storageKey);
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpenConfirmModal, setIsOpenConfirmModal] = useState(false);
  const [editTodo, setEditTodo] = useState<ITodo>({
    id: 0,
    title: "",
    description: "",
  })
  const {isLoading, data} = useAuthQuery({
    // todoList+$todotoedit.id
    queryKey: ["todoList", `${editTodo.id}`],
    url: "/users/me?populate=todos",
    config: {
      headers: {
        Authorization: `Bearer ${userData?.jwt}`,
      },
    },
  });

  // ** Handlers
  const onCloseEditModal = () => {
    setEditTodo({
      id: 0,
      title: "",
      description: "",
    });
    setIsEditModalOpen(false);
  };

  const onOpenEditModal = (todo: ITodo) => {
    setEditTodo(todo);
    setIsEditModalOpen(true);
  }

  const closeConfirmModal = () => {
    setIsOpenConfirmModal(false);
  }

  const openConfirmModal = () => {
    setIsOpenConfirmModal(true);
  }

  const handleEditTodoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditTodo((prev) => ({ ...prev, [name]: value }));
  }

  const handleEditTodoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const {status} = await axiosInstance.put(`/todos/${editTodo.id}`, {
        data: {
          title: editTodo.title,
          description: editTodo.description,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${userData?.jwt}`,
        },
      });
      if(status === 200) {
        onCloseEditModal();
        // ** Refetch the todos
        
      }
    } catch (error) {
      
    }
    finally {
      setIsUpdating(false);
    }
  }

  const onSubmitRemoveTodo = async () => {
    try {
      const {status} = await axiosInstance.delete(`/todos/${editTodo.id}`, {
        headers: {
          Authorization: `Bearer ${userData?.jwt}`,
        },
      });
      if(status === 200) {
        closeConfirmModal();
        // ** Refetch the todos
      }
    } catch (error) {
      
    }
  }
  

  if(isLoading) return <p>Loading...</p>

  const renderTodos = data.todos.map((todo: ITodo) => (
    <div key={todo.id} className="flex items-center justify-between hover:bg-gray-100 duration-300 p-3 rounded-md even:bg-gray-100">
      <p className="w-full font-semibold">{1 + ". " + todo.title}</p>
      <div className="flex items-center justify-end w-full space-x-3">
        <Button size={"sm"} onClick={() => onOpenEditModal(todo)} isLoading={isUpdating}>
          Edit
        </Button>
        <Button variant={"danger"} size={"sm"} onClick={openConfirmModal}>
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
       <Modal isOpen={isEditModalOpen} closeModal={onCloseEditModal} title="Edit Todo">
          <form className="space-y-3" onSubmit={handleEditTodoSubmit}>
            <Input value={editTodo.title} name="title" placeholder="Title" onChange={handleEditTodoChange} />
            <Textarea value={editTodo.description} name="description" placeholder="Description" onChange={handleEditTodoChange} />
            <div className="flex justify-start space-x-3 mt-4">
              <Button className="bg-indigo-700 hover:bg-indigo-800">
                Update
              </Button>
              <Button variant="cancel" onClick={onCloseEditModal}>
                Cancel
              </Button>
            </div>
          </form>

      {/* DELETE TODO CONFIRM MODAL */}
      <Modal
        isOpen={isOpenConfirmModal}
        closeModal={closeConfirmModal}
        title="Are you sure you want to remove this Todo from your Store?"
        description="Deleting this Todo will remove it permanently from your inventory. Any associated data, sales history, and other related information will also be deleted. Please make sure this is the intended action."
      >
        <div className="flex items-center space-x-3">
          <Button variant={"danger"} size={"sm"} onClick={onSubmitRemoveTodo}>
            Yes, remove
          </Button>
          <Button variant={"cancel"} size={"sm"} onClick={closeConfirmModal}>
            Cancel
          </Button>
        </div>
      </Modal>

       </Modal>
    </div>
  );
};

export default TodoList;

