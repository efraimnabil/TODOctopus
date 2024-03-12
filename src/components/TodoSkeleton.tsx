import hand8 from '../assets/hand8.svg'

interface IProps {

}

const TodoSkeleton = ({}: IProps) => {
  return (
    <div className="flex items-center justify-between">
      <img 
        src={hand8}
        alt="hand"
        className="w-40 h-40 md:w-80 md:h-80 animate-pulse"
      />
    </div>
  )
}

export default TodoSkeleton