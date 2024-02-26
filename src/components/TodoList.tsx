import { useState } from "react";
import useAuthQuery from "../hooks/useCustomQuery";
import { ITodo } from "../interfaces";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Modal from "./ui/Modal";
import Textarea from "./ui/Textarea";
import axiosInstance from "../config/axios.config";
import TodoSkeleton from "./TodoSkeleton";
import Paginator from "./Paginator";
const TodoList = () => {
  const storageKey = "loggedInUser";
  const userDataString = localStorage.getItem(storageKey);
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpenConfirmModal, setIsOpenConfirmModal] = useState(false);
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [queryVersion, setQueryVersion] = useState(1);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortBy, setSortBy] = useState<'DESC' | "ASC">("DESC");
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
  const {isLoading, data, isFetching} = useAuthQuery({
    // todoList+$todotoedit.id
    queryKey: [`todos-page-${page}`, `${pageSize}`, `${queryVersion}`, `${sortBy}`],
    url: `/todos?pagination[pageSize]=${pageSize}&pagination[page]=${page}&sort=createdAt:${sortBy}`,
    config: {
      headers: {
        Authorization: `Bearer ${userData?.jwt}`,
      },
    },
  });
  console.log(data);

  // ** Handlers

  const onClickPrev = () => {
    setPage((prev) => prev - 1);
  }

  const onClickNext = () => {
    setPage((prev) => prev + 1);
  }

  const onChangePageSize = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(+e.target.value);
  }

  const onChangeSortBy = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as "DESC" | "ASC");
  }

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
          user: [userData.user.id],
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
      console.log(error);
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
  
    
  const renderTodos = data?.data?.map(({id, attributes } : {id: number, attributes: ITodo}, i: number) => (
    <div key={id} className="flex items-center justify-between hover:bg-gray-100 duration-300 p-3 rounded-md even:bg-gray-100">
      <p className="w-full font-semibold">{id + " " + i + ". " + attributes.title}</p>
      <div className="flex items-center justify-end w-full space-x-3">
        <Button size={"sm"} onClick={() => onOpenEditModal({id, title: attributes.title, description: attributes.description})} isLoading={isUpdating}>
          Edit
        </Button>
        <Button variant={"danger"} size={"sm"} onClick={() => openConfirmModal({id, title: attributes.title, description: attributes.description})}>
          Remove
        </Button>
      </div>
    </div>
  ));

  return (
    <div className="space-y-1 ">
      <div className="flex items-center justify-between space-x-2">
        <Button size={"sm"} onClick={openAddModal}>
          Add Todo
        </Button>
        <div className="flex items-center justify-between space-x-2 text-md">
          <select className="border-2 border-indigo-600 rounded-md p-2" value={sortBy} onChange={onChangeSortBy}>
            <option disabled>Sort by</option>
            <option value="ASC">Oldest</option>
            <option value="DESC">Latest</option>
          </select>

          <select className="border-2 border-indigo-600 rounded-md p-2" value={pageSize} onChange={onChangePageSize}>
            <option disabled>Page size</option>
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

       {
        isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: pageSize }).map((_, i) => <TodoSkeleton key={i} />)}
          </div>
        ) : ( 
              data.data?.length? (
                  renderTodos
              ) : (
                <p>No todos found</p>
              )
            )
          }
        <Paginator 
          page={page}
          pageCount={data?.meta?.pagination.pageCount}
          total={data?.meta?.pagination.total}
          isLoading={isLoading || isFetching}
          onClickPrev={onClickPrev}
          onClickNext={onClickNext}
        />

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

