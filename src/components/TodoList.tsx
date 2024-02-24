import { useState } from "react";
import useAuthQuery from "../hooks/useCustomQuery";
import { ITodo } from "../interfaces";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Modal from "./ui/Modal";
import Textarea from "./ui/Textarea";
import axiosInstance from "../config/axios.config";
import TodoSkeleton from "./TodoSkeleton";
const TodoList = () => {
  const storageKey = "loggedInUser";
  const userDataString = localStorage.getItem(storageKey);
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpenConfirmModal, setIsOpenConfirmModal] = useState(false);
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [queryVersion, setQueryVersion] = useState(1);
  const [editTodo, setEditTodo] = useState<ITodo>({
    id: 0,
    title: "",
    description: "",
  })
  const [addTodo, setAddTodo] = useState<ITodo>({
    id: 0,
    title: "",
    description: "",
  })
  const {isLoading, data} = useAuthQuery({
    // todoList+$todotoedit.id
    queryKey: ["todoList", `${queryVersion}`],
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

  const openConfirmModal = (todo: ITodo) => {
    setEditTodo(todo);
    setIsOpenConfirmModal(true);
  }

  const openAddModal = () => {
    setIsOpenAddModal(true);
  }

  const closeAddModal = () => {
    setIsOpenAddModal(false);
  }

  const handleEditTodoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditTodo((prev) => ({ ...prev, [name]: value }));
  }
  const handleAddTodoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAddTodo((prev) => ({ ...prev, [name]: value }));
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
        setQueryVersion((prev) => prev + 1);
        
      }
    } catch (error) {
      
    }
    finally {
      setIsUpdating(false);
    }
  }

  const handleAddTodoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const {status} = await axiosInstance.post(`/todos`, {
        data: {
          title: addTodo.title,
          description: addTodo.description,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${userData?.jwt}`,
        },
      });
      if(status === 200) {
        closeAddModal();
        // ** Refetch the todos
        setQueryVersion((prev) => prev + 1);
      }
    } catch (error) {
      
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
        setQueryVersion((prev) => prev + 1);
      }
    } catch (error) {
      
    }
  }
  

  if(isLoading) return (
    <div className="space-y-1">
      {Array.from({ length: 3 }).map((_, i) => <TodoSkeleton key={i} />)}
    </div>
  )

  const renderTodos = data.todos.map((todo: ITodo) => (
    <div key={todo.id} className="flex items-center justify-between hover:bg-gray-100 duration-300 p-3 rounded-md even:bg-gray-100">
      <p className="w-full font-semibold">{1 + ". " + todo.title}</p>
      <div className="flex items-center justify-end w-full space-x-3">
        <Button size={"sm"} onClick={() => onOpenEditModal(todo)} isLoading={isUpdating}>
          Edit
        </Button>
        <Button variant={"danger"} size={"sm"} onClick={() => openConfirmModal(todo)}>
          Remove
        </Button>
      </div>
    </div>
  ));

  return (
    <div className="space-y-1 ">
      <div className="w-fit mx-auto my-10">
        <Button onClick={openAddModal} className="bg-indigo-700 hover:bg-indigo-800">
          Add Todo
        </Button>
      </div>
      

       { data.todos.length? (
          renderTodos
       ) : (
         <p>No todos found</p>
       )}

       {/* Add todo Modal */}
       <Modal isOpen={isOpenAddModal} closeModal={closeAddModal} title="Add Todo">
          <form className="space-y-3" onSubmit={handleAddTodoSubmit}>
            <Input value={addTodo.title} name="title" placeholder="Title" onChange={handleAddTodoChange} />
            <Textarea value={addTodo.description} name="description" placeholder="Description" onChange={handleAddTodoChange} />
            <div className="flex justify-start space-x-3 mt-4">
              <Button className="bg-indigo-700 hover:bg-indigo-800">
                Add
              </Button>
              <Button variant="cancel" onClick={closeAddModal} type="button">
                Cancel
              </Button>
            </div>
          </form>
       </Modal>

       {/**Edit todo Modal */}
       <Modal isOpen={isEditModalOpen} closeModal={onCloseEditModal} title="Edit Todo">
          <form className="space-y-3" onSubmit={handleEditTodoSubmit}>
            <Input value={editTodo.title} name="title" placeholder="Title" onChange={handleEditTodoChange} />
            <Textarea value={editTodo.description} name="description" placeholder="Description" onChange={handleEditTodoChange} />
            <div className="flex justify-start space-x-3 mt-4">
              <Button className="bg-indigo-700 hover:bg-indigo-800">
                Update
              </Button>
              <Button variant="cancel" onClick={onCloseEditModal} type="button">
                Cancel
              </Button>
            </div>
          </form>
      </Modal>

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
          <Button variant={"cancel"} size={"sm"} onClick={closeConfirmModal} type="button">
            Cancel
          </Button>
        </div>
      </Modal>

    </div>
  );
};

export default TodoList;

