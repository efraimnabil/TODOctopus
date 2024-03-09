interface IProps {
  page: number;
  pageCount: number;
  total: number;
  isLoading: boolean;
  onClickPrev: () => void;
  onClickNext: () => void;
}

const Paginator = ({isLoading, onClickNext, onClickPrev, page, pageCount, total}: IProps) => {
  
  const beforeElementStyles: React.CSSProperties = {
    content: '""',
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    borderRadius: '0 50px 50px 0',
    border: '2px solid transparent',
    background: 'linear-gradient(315deg, rgba(255, 0, 194, 0.80) 0%, rgba(255, 77, 0, 0.80) 100%) border-box',
    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'destination-out',
    maskComposite: 'exclude',
  };

  const beforeElementStyles2: React.CSSProperties = {
    content: '""',
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    borderRadius: '50px 0 0 50px',
    border: '2px solid transparent',
    background: 'linear-gradient(315deg, rgba(255, 0, 194, 0.80) 0%, rgba(255, 77, 0, 0.80) 100%) border-box',
    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'destination-out',
    maskComposite: 'exclude',
  };

  return (
    <div className="flex flex-col items-center space-y-5 mx-auto mt-10">
      <p className="text-sm text-white font-SourceSerifPro mx-3 mt-4">
        Octopus <span className="mx-1 font-semibold text-white text-md">{page}</span> to
        <span className="mx-1 font-semibold text-white ">{pageCount}</span> of
        <span className="mx-1 font-semibold text-white ">{total}</span> Tasks
      </p>
      <div className="flex items-center gap-2">
        <button
            type="button"
            className="relative text-white rounded-l-[50px] border-r border-gray-100 py-2 duration-300 hover:text-white px-3 disabled:cursor-not-allowed disabled:text-gray-700"
            disabled={page === 1 || isLoading}
            onClick={onClickPrev}
          >
            <div className="flex flex-row align-middle">
              <svg className="w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <p className="ml-2">Prev</p>
            </div>
            <span style={beforeElementStyles2}></span>
          </button>

          <button
          type="button"
          className="relative text-white rounded-r-[50px] py-2 border-l border-gray-200 duration-300 hover:text-white px-3 disabled:cursor-not-allowed disabled:text-gray-700"
          disabled={page === pageCount || isLoading}
          onClick={onClickNext}
        >
          <div className="flex flex-row align-middle">
            <span className="mr-2">Next</span>
            <svg className="w-5 ml-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </div>
          <span style={beforeElementStyles}></span>
        </button>
      </div>
    </div>
  )
}

export default Paginator